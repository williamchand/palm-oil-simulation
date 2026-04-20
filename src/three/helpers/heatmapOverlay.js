import {
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry
} from 'three';

/**
 * Returns RGBA color based on tree health and ripeness values.
 * Pure function — safe for testing without Three.js.
 *
 * @param {number} health - 0-1
 * @param {number} ripeness - 0-1
 * @returns {{ r: number, g: number, b: number, a: number }}
 */
export function getHealthColor(health, ripeness) {
  if (health < 0.4) {
    // Red / diseased
    return { r: 239, g: 68, b: 68, a: 0.5 + ripeness * 0.5 };
  }
  if (health < 0.7) {
    // Yellow / stressed
    return { r: 234, g: 179, b: 8, a: 0.5 + ripeness * 0.5 };
  }
  // Green / healthy
  return { r: 34, g: 197, b: 94, a: 0.5 + ripeness * 0.5 };
}

/**
 * Creates a fog-of-war heatmap overlay for the plantation ground plane.
 * Canvas starts fully dark and reveals scanned regions with health/ripeness colors (D-21, D-24).
 * Updates are throttled to 1Hz (D-25). Canvas capped at 512×512 (T-04-01).
 *
 * @param {import('../../../types/plantation.js').PlantationData} plantationData
 * @returns {{ mesh: Mesh, reveal: Function, dispose: Function }}
 */
export function createHeatmapOverlay(plantationData) {
  const { rows, cols, spacing } = plantationData.metadata;

  // Canvas dimensions: cols × rows pixels, capped at 512×512 (T-04-01)
  const canvasWidth = Math.min(cols * 2, 512);
  const canvasHeight = Math.min(rows * 2, 512);

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Fog-of-war: start fully dark (D-24)
  ctx.fillStyle = 'rgba(0, 0, 0, 1)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const texture = new CanvasTexture(canvas);

  // Ground sizing matches sceneBuilder.js: cols*spacing*0.1*1.2
  const widthUnits = cols * spacing * 0.1;
  const heightUnits = rows * spacing * 0.1;
  const geometry = new PlaneGeometry(widthUnits * 1.2, heightUnits * 1.2);
  const material = new MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });

  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  // Position matches ground: (widthUnits/2, 0.01, heightUnits/2)
  mesh.position.set(widthUnits / 2, 0.01, heightUnits / 2);
  mesh.name = 'heatmapOverlay';

  // Plantation world extents in meters
  const worldWidth = cols * spacing;
  const worldHeight = rows * spacing;

  // Throttle state (D-25)
  let lastUpdateTime = 0;

  /**
   * Reveals a scanned region on the heatmap around a waypoint position.
   *
   * @param {number} waypointX - Waypoint X in meters
   * @param {number} waypointY - Waypoint Y in meters
   * @param {import('../../../types/plantation.js').Tree[]} trees - Nearby trees to color
   * @param {Array<{x: number, y: number}>} anomalies - Anomaly positions
   */
  function reveal(waypointX, waypointY, trees, anomalies) {
    const now = Date.now();
    // Throttle to 1Hz (D-25)
    if (now - lastUpdateTime < 1000) return;
    lastUpdateTime = now;

    // Convert waypoint meters → canvas pixels
    const pixelX = (waypointX / worldWidth) * canvasWidth;
    const pixelY = (waypointY / worldHeight) * canvasHeight;

    // Reveal radius: 30m scan radius → pixels
    const radiusPx = (30 / worldWidth) * canvasWidth;

    // Paint base reveal area — translucent dark-green to "lift" the fog
    ctx.globalCompositeOperation = 'source-over';
    const baseGradient = ctx.createRadialGradient(
      pixelX, pixelY, 0,
      pixelX, pixelY, radiusPx
    );
    baseGradient.addColorStop(0, 'rgba(26, 47, 26, 0.6)');
    baseGradient.addColorStop(1, 'rgba(26, 47, 26, 0)');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, radiusPx, 0, Math.PI * 2);
    ctx.fill();

    // Paint individual tree health dots
    if (trees && trees.length > 0) {
      for (const tree of trees) {
        // Only paint trees within 30m of waypoint
        const dx = tree.x - waypointX;
        const dy = tree.y - waypointY;
        if (dx * dx + dy * dy > 900) continue; // 30m radius squared

        const treePixelX = (tree.x / worldWidth) * canvasWidth;
        const treePixelY = (tree.y / worldHeight) * canvasHeight;
        const color = getHealthColor(tree.health, tree.ripeness);

        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
        ctx.beginPath();
        ctx.arc(treePixelX, treePixelY, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Paint anomaly red highlights
    if (anomalies && anomalies.length > 0) {
      for (const anomaly of anomalies) {
        const ax = (anomaly.x / worldWidth) * canvasWidth;
        const ay = (anomaly.y / worldHeight) * canvasHeight;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        ctx.beginPath();
        ctx.arc(ax, ay, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    texture.needsUpdate = true;
  }

  /**
   * Disposes of all GPU resources.
   */
  function dispose() {
    geometry.dispose();
    material.dispose();
    texture.dispose();
  }

  return { mesh, reveal, dispose };
}
