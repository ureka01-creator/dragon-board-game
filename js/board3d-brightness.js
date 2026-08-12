// DRAGON BOARD V0.6.0.1 — brighter 3D presentation
(() => {
  const style = document.createElement('style');
  style.id = 'board3dBrightnessStyles';
  style.textContent = `
    .board3d-overlay {
      background: #17110c !important;
    }
    .board3d-canvas-wrap {
      background: radial-gradient(circle at 50% 34%, #4b3924 0%, #2b2117 34%, #17110c 72%, #0f0c09 100%) !important;
    }
    .board3d-canvas {
      filter: brightness(1.42) saturate(1.12) contrast(.96);
    }
    .board3d-badge {
      background: rgba(37, 27, 18, .82) !important;
      color: #f1ddb0 !important;
      border-color: rgba(231, 187, 93, .78) !important;
    }
  `;
  document.head.appendChild(style);
  // Dedicated module so the 3D lighting/readability tuning can evolve independently.
})();
