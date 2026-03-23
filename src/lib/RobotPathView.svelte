<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import type { AutoPath } from '$lib/types/robotpath';

  let {
    strokes = [],
    fieldImage = '/feild2026.png',
    label = '',
    fieldWidth = 600,
    fieldHeight = 315,
  }: {
    strokes?: AutoPath;
    fieldImage?: string;
    label?: string;
    fieldWidth?: number;
    fieldHeight?: number;
  } = $props();

  let canvasEl = $state();
  let paperScope = $state();
  let isPlaying = $state(false);

  let drawnPaths = [];
  let hasDrawnPaths = $state(false);
  let playbackDot = null;
  let ghostPath = null;
  let rafId = null;

  $effect(() => {
    // Read strokes to subscribe to changes
    const s = strokes;
    untrack(() => {
      if (paperScope && s) {
        drawFromData();
      }
    });
  });

  onMount(() => {
    let mounted = true;

    (async () => {
      const paperModule = await import('paper');
      const paper = paperModule.default;
      if (!mounted) return;

      canvasEl.width = fieldWidth;
      canvasEl.height = fieldHeight;

      paper.setup(canvasEl);
      paper.view.viewSize = new paper.Size(fieldWidth, fieldHeight);
      paperScope = paper;

      const raster = new paper.Raster(fieldImage);
      raster.onLoad = () => {
        raster.position = paper.view.center;
        raster.size = new paper.Size(fieldWidth, fieldHeight);
        raster.sendToBack();
        paper.view.update();
      };

      drawFromData();

      requestAnimationFrame(() => {
        paper.view.update();
      });
    })();

    return () => {
      mounted = false;
      if (rafId) cancelAnimationFrame(rafId);
      paperScope?.remove();
    };
  });

  function drawFromData() {
    const paper = paperScope;
    if (!paper || !strokes) return;

    // Clear old paths
    drawnPaths.forEach(p => p.remove());
    drawnPaths = [];

    for (const stroke of strokes) {
      const path = new paper.Path({
        strokeColor: '#00e5ff',
        strokeWidth: 3,
        strokeCap: 'round',
        strokeJoin: 'round',
        opacity: 0.85,
      });
      for (const pt of stroke) {
        path.add(new paper.Point(pt.x, pt.y));
      }
      drawnPaths.push(path);
    }

    hasDrawnPaths = drawnPaths.length > 0;
    paper.view.update();
  }

  function startPlayback() {
    if (drawnPaths.length === 0) return;
    stopPlayback();
    const paper = paperScope;

    drawnPaths.forEach(p => { p.opacity = 0.2; });

    playbackDot = new paper.Shape.Circle({
      center: drawnPaths[0].getPointAt(0),
      radius: 10,
      fillColor: '#ff3d3d',
      shadowColor: new paper.Color(1, 0.24, 0.24, 0.6),
      shadowBlur: 12,
    });

    ghostPath = new paper.Path({
      strokeColor: '#00e5ff',
      strokeWidth: 2,
      opacity: 0.9,
      strokeCap: 'round',
    });

    isPlaying = true;

    let pathIdx = 0;
    let offset = 0;
    const speed = 2.5;

    function tick() {
      if (!isPlaying) return;

      const path = drawnPaths[pathIdx];
      const len = path.length;

      offset += speed;
      if (offset >= len) {
        const endPt = path.getPointAt(len);
        playbackDot.position = endPt;
        ghostPath.add(endPt);

        pathIdx++;
        offset = 0;

        if (pathIdx >= drawnPaths.length) {
          isPlaying = false;
          stopPlayback();
          return;
        }
      } else {
        const pt = path.getPointAt(offset);
        playbackDot.position = pt;
        ghostPath.add(pt);
      }

      paper.view.update();
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
  }

  function stopPlayback() {
    isPlaying = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    drawnPaths.forEach(p => { p.opacity = 0.85; });
    ghostPath?.remove();
    ghostPath = null;
    playbackDot?.remove();
    playbackDot = null;
  }
</script>

<div class="wrapper">
  <div class="toolbar">
    <span class="title">Robot Path View</span>

    {#if label}
      <span class="label-badge">{label}</span>
    {/if}

    <div class="spacer"></div>

    <button
      class="btn accent"
      onclick={startPlayback}
      disabled={isPlaying || !hasDrawnPaths}
    >
      ▶ Play
    </button>

    {#if isPlaying}
      <button class="btn" onclick={stopPlayback}>■ Stop</button>
    {/if}
  </div>

  <canvas
    bind:this={canvasEl}
    width={fieldWidth}
    height={fieldHeight}
    data-paper-resize="false"
    class="field-canvas"
  />

  <p class="hint">
    {#if isPlaying}
      Playing back path…
    {:else}
      Press Play to animate the robot path.
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
  .btn.accent { border-color: #ff3d3d; color: #ff3d3d; }
  .btn.accent:hover:not(:disabled) { background: #2a1010; }

  .field-canvas {
    display: block;
    border-radius: 6px;
    border: 1px solid #2a2a2a;
    background: #111;
    width: 600px;
    height: 315px;
    touch-action: none;
  }

  .hint {
    font-size: 11px;
    color: #555;
    margin: 0;
    min-height: 16px;
  }
</style>
