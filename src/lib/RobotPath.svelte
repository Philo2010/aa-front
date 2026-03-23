<script>
  import { onMount } from 'svelte';

  // ── Props ──────────────────────────────────────────────────────────────────
  /** @type {{ fieldImage?: string, label?: string, onsave?: (data: object) => void }} */
  let {
    fieldImage = '/field.png',
    label = '',
    onsave,
  } = $props();

  // ── State ──────────────────────────────────────────────────────────────────
  let canvasEl = $state();
  let paperScope = $state();
  let mode = $state('draw');        // 'draw' | 'playback'
  let isPlaying = $state(false);
  let hasPaths = $state(false);

  let currentPath = null;   // paper.Path being drawn
  let allPaths = [];        // array of paper.Path objects
  let playbackDot = null;   // paper.Shape.Circle for the robot dot
  let rafId = null;

  const FIELD_W = 800;
  const FIELD_H = 400;

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  onMount(() => {
    let mounted = true;

    (async () => {
      const paperModule = await import('paper');
      const paper = paperModule.default;
      if (!mounted) return;

      paper.setup(canvasEl);
      paperScope = paper;

      // Draw field image as background
      const raster = new paper.Raster(fieldImage);
      raster.position = paper.view.center;
      raster.size = new paper.Size(FIELD_W, FIELD_H);
      raster.sendToBack();

      setupDrawTool(paper);
    })();

    return () => {
      mounted = false;
      if (rafId) cancelAnimationFrame(rafId);
      paperScope?.remove();
    };
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
  function serialize() {
    return {
      label,
      fieldWidth: FIELD_W,
      fieldHeight: FIELD_H,
      strokes: allPaths.map(path =>
        path.segments.map(seg => ({
          x: Math.round(seg.point.x),
          y: Math.round(seg.point.y),
        }))
      ),
      createdAt: new Date().toISOString(),
    };
  }

  function handleSave() {
    if (allPaths.length === 0) return;
    onsave?.(serialize());
  }
</script>

<svelte:head>
  <!-- Paper.js from CDN — swap for npm import if you prefer -->
  <script src="https://unpkg.com/paper/dist/paper-full.min.js"></script>
</svelte:head>

<div class="wrapper">
  <!-- Toolbar -->
  <div class="toolbar">
    <span class="title">Robot Path</span>

    {#if label}
      <span class="label-badge">{label}</span>
    {/if}

    <div class="spacer"></div>

    <button
      class="btn {mode === 'draw' ? 'active' : ''}"
      onclick={() => setMode('draw')}
      disabled={isPlaying}
    >
      ✏ Draw
    </button>

    <button
      class="btn accent"
      onclick={startPlayback}
      disabled={isPlaying || !hasPaths}
    >
      ▶ Play
    </button>

    {#if isPlaying}
      <button class="btn" onclick={stopPlayback}>■ Stop</button>
    {/if}

    <button class="btn danger" onclick={clearAll} disabled={isPlaying}>
      Clear
    </button>

    <button
      class="btn submit"
      onclick={handleSave}
      disabled={isPlaying || !hasPaths}
    >
      Save
    </button>
  </div>

  <!-- Canvas -->
  <canvas
    bind:this={canvasEl}
    width={FIELD_W}
    height={FIELD_H}
    data-paper-resize="false"
    class="field-canvas {mode === 'draw' ? 'drawing' : ''}"
  />

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
  .btn.submit { border-color: #3dffb0; color: #3dffb0; }
  .btn.submit:hover:not(:disabled) { background: #0a2a1e; }

  .field-canvas {
    display: block;
    border-radius: 6px;
    border: 1px solid #2a2a2a;
    background: #111;
    max-width: 100%;
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
