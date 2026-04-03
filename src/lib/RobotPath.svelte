<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { PathPoint } from '$lib/schema/types.gen';

  let {
    fieldImage = '/feild2026.png',
    label = '',
    pathData = $bindable<PathPoint[][]>([]),
  }: {
    fieldImage?: string;
    label?: string;
    pathData?: PathPoint[][];
  } = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let canvasEl: HTMLCanvasElement = $state() as any;
  let containerEl: HTMLDivElement = $state() as any;
  let paperScope: any = $state();
  let mode = $state('draw');        // 'draw' | 'playback'
  let isPlaying = $state(false);
  let hasPaths = $state(false);

  let currentPath = null;   // paper.Path being drawn
  let allPaths = [];        // array of paper.Path objects
  let playbackDot = null;   // paper.Shape.Circle for the robot dot
  let rafId = null;

  const FIELD_W = 600;
  const FIELD_H = 315;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount(() => {
    let mounted = true;
    let ro: ResizeObserver | null = null;

    (async () => {
      const paperModule = await import('paper');
      const paper = paperModule.default;
      if (!mounted) return;

      // Ensure canvas pixel buffer matches attributes before Paper.js reads it
      canvasEl.width = FIELD_W;
      canvasEl.height = FIELD_H;

      paper.setup(canvasEl);
      paperScope = paper;

      // Scale the Paper.js view to match the container's CSS size so that
      // event coordinates and drawing always align with the background.
      function updateView() {
        if (!containerEl) return;
        const W = containerEl.clientWidth;
        const H = containerEl.clientHeight;
        if (!W || !H) return;
        paper.view.viewSize = new paper.Size(W, H);
        paper.view.zoom = W / FIELD_W;
        paper.view.center = new paper.Point(FIELD_W / 2, FIELD_H / 2);
        paper.view.update();
      }

      updateView();
      ro = new ResizeObserver(updateView);
      ro.observe(containerEl);

      // Draw field image as background
      const raster = new paper.Raster(fieldImage);
      raster.onLoad = () => {
        raster.position = paper.view.center;
        raster.size = new paper.Size(FIELD_W, FIELD_H);
        raster.sendToBack();
        paper.view.update();
      };

      setupDrawTool(paper);

      // Force initial render on next frame
      requestAnimationFrame(() => {
        paper.view.update();
      });
    })();

    return () => {
      mounted = false;
      ro?.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      paperScope?.remove();
    };
  });

  // ── React to external pathData reset ───────────────────────────────────────
  $effect(() => {
    // Only track pathData.length — run cleanup in untrack to avoid loops
    if (pathData.length === 0) {
      untrack(() => {
        if (!hasPaths || !paperScope) return;
        stopPlayback();
        allPaths.forEach(p => p.remove());
        allPaths = [];
        playbackDot?.remove();
        playbackDot = null;
        hasPaths = false;
        mode = 'draw';
        paperScope.view.update();
      });
    }
  });

  // ── Draw tool ──────────────────────────────────────────────────────────────
  function setupDrawTool(paper) {
    const tool = new paper.Tool();

    tool.onMouseDown = (e) => {
      if (mode !== 'draw') return;
      currentPath = new paper.Path({
        strokeColor: '#00e5ff',
        strokeWidth: 3,
        strokeCap: 'round',
        strokeJoin: 'round',
        opacity: 0.85,
      });
      currentPath.add(e.point);
    };

    tool.onMouseDrag = (e) => {
      if (mode !== 'draw' || !currentPath) return;
      currentPath.add(e.point);
    };

    tool.onMouseUp = () => {
      if (mode !== 'draw' || !currentPath) return;
      currentPath.simplify(4);
      allPaths.push(currentPath);
      hasPaths = true;
      currentPath = null;
      pathData = serializeStrokes();
    };
  }

  // ── Mode switching ─────────────────────────────────────────────────────────
  function setMode(m) {
    stopPlayback();
    mode = m;
  }

  function clearAll() {
    stopPlayback();
    allPaths.forEach(p => p.remove());
    allPaths = [];
    playbackDot?.remove();
    playbackDot = null;
    mode = 'draw';
    hasPaths = false;
    pathData = [];
  }

  // ── Playback ───────────────────────────────────────────────────────────────
  function startPlayback() {
    if (allPaths.length === 0) return;
    const paper = paperScope;

    // Hide drawn paths during playback, show ghost
    allPaths.forEach(p => { p.opacity = 0.2; });

    // Create the robot dot
    playbackDot?.remove();
    playbackDot = new paper.Shape.Circle({
      center: allPaths[0].getPointAt(0),
      radius: 10,
      fillColor: '#ff3d3d',
      shadowColor: new paper.Color(1, 0.24, 0.24, 0.6),
      shadowBlur: 12,
    });

    // Replay ghost trail
    const ghost = new paper.Path({
      strokeColor: '#00e5ff',
      strokeWidth: 2,
      opacity: 0.9,
      strokeCap: 'round',
    });

    isPlaying = true;
    mode = 'playback';

    // Walk all paths sequentially
    let pathIdx = 0;
    let offset = 0;
    const speed = 2.5; // px per frame

    function tick() {
      if (!isPlaying) return;

      const path = allPaths[pathIdx];
      const len = path.length;

      offset += speed;
      if (offset >= len) {
        // Snap to end of this path
        const endPt = path.getPointAt(len);
        playbackDot.position = endPt;
        ghost.add(endPt);

        pathIdx++;
        offset = 0;

        if (pathIdx >= allPaths.length) {
          // Done
          isPlaying = false;
          allPaths.forEach(p => { p.opacity = 0.85; });
          ghost.remove();
          playbackDot.remove();
          playbackDot = null;
          mode = 'draw';
          return;
        }
      } else {
        const pt = path.getPointAt(offset);
        playbackDot.position = pt;
        ghost.add(pt);
      }

      paper.view.update();
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  function stopPlayback() {
    isPlaying = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    allPaths.forEach(p => { p.opacity = 0.85; });
    playbackDot?.remove();
    playbackDot = null;
    mode = 'draw';
  }

  // ── Serialize & Submit ─────────────────────────────────────────────────────
  function serializeStrokes() {
    return allPaths.map(path =>
      path.segments.map(seg => ({
        x: Math.round(seg.point.x),
        y: Math.round(seg.point.y),
      }))
    );
  }

</script>


<div class="wrapper">
  <!-- Toolbar -->
  <div class="toolbar">
    <span class="title">Robot Path</span>

    {#if label}
      <span class="label-badge">{label}</span>
    {/if}

    <div class="spacer"></div>

    <button
      type="button"
      class="btn {mode === 'draw' ? 'active' : ''}"
      onclick={() => setMode('draw')}
      disabled={isPlaying}
    >
      ✏ Draw
    </button>

    <button
      type="button"
      class="btn accent"
      onclick={startPlayback}
      disabled={isPlaying || !hasPaths}
    >
      ▶ Play
    </button>

    {#if isPlaying}
      <button type="button" class="btn" onclick={stopPlayback}>■ Stop</button>
    {/if}

    <button type="button" class="btn danger" onclick={clearAll} disabled={isPlaying}>
      Clear
    </button>
  </div>

  <!-- Canvas -->
  <div class="canvas-scaler" bind:this={containerEl}>
    <canvas
      bind:this={canvasEl}
      width={FIELD_W}
      height={FIELD_H}
      data-paper-resize="false"
      class="field-canvas {mode === 'draw' ? 'drawing' : ''}"
    ></canvas>
  </div>

  <p class="hint">
    {#if mode === 'draw'}
      Click and drag to trace the robot's path on the field.
    {:else if isPlaying}
      Playing back path…
    {/if}
  </p>
</div>

<style>
  .wrapper {
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: 'DM Mono', monospace, sans-serif;
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
  }

  .toolbar {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: #aaa;
  }

  .label-badge {
    font-size: 11px;
    background: #1e2a38;
    color: #7ecfff;
    border: 1px solid #2a3f55;
    border-radius: 4px;
    padding: 2px 8px;
  }

  .spacer { flex: 1; }

  .btn {
    font-size: 12px;
    font-weight: 500;
    padding: 5px 12px;
    border-radius: 5px;
    border: 1px solid #2e2e2e;
    background: #1a1a1a;
    color: #ccc;
    cursor: pointer;
    transition: background .12s, color .12s;
  }

  .btn:hover:not(:disabled) { background: #252525; color: #fff; }
  .btn:disabled { opacity: .35; cursor: default; }
  .btn.active { border-color: #00e5ff; color: #00e5ff; }
  .btn.accent { border-color: #ff3d3d; color: #ff3d3d; }
  .btn.accent:hover:not(:disabled) { background: #2a1010; }
  .btn.danger:hover:not(:disabled) { background: #1e1010; color: #ff6b6b; }
  .canvas-scaler {
    width: 100%;
    max-width: 600px;
    aspect-ratio: 600 / 315;
  }

  .field-canvas {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 6px;
    border: 1px solid #2a2a2a;
    background: #111;
    touch-action: none;
  }

  .field-canvas.drawing { cursor: crosshair; }

  .hint {
    font-size: 11px;
    color: #555;
    margin: 0;
    min-height: 16px;
  }

</style>
