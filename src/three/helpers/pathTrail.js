import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry
} from 'three';

/**
 * Returns RGB color for a path trail segment.
 * Pure function — safe for testing without Three.js.
 *
 * @param {string} action - 'scan' | 'turn' | 'transit'
 * @param {boolean} isAnomaly
 * @returns {{ r: number, g: number, b: number }}
 */
export function getSegmentColor(action, isAnomaly) {
  if (isAnomaly) {
    return { r: 1, g: 0.27, b: 0.27 }; // red #ef4444
  }
  if (action === 'scan') {
    return { r: 0.22, g: 0.74, b: 0.97 }; // blue #38bdf8
  }
  return { r: 0.39, g: 0.45, b: 0.53 }; // gray #64748b
}

/** Maximum number of trail points (T-04-02) */
const MAX_POINTS = 10000;

/** Maximum number of scan markers (T-04-03) */
const MAX_MARKERS = 2000;

/**
 * Creates a path trail with growing BufferGeometry line and instanced scan markers.
 * Line is color-coded by segment type (D-22). Scan waypoints get sphere markers (D-23).
 *
 * @returns {{ group: Group, addPoint: Function, dispose: Function }}
 */
export function createPathTrail() {
  const group = new Group();
  group.name = 'pathTrail';

  // --- Line trail (D-22) ---
  const positions = new Float32Array(MAX_POINTS * 3);
  const colors = new Float32Array(MAX_POINTS * 3);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
  geometry.setDrawRange(0, 0);

  const lineMaterial = new LineBasicMaterial({ vertexColors: true });
  const line = new Line(geometry, lineMaterial);
  line.name = 'trailLine';
  group.add(line);

  // --- Instanced scan markers (D-23) ---
  const markerGeo = new SphereGeometry(0.15, 8, 6);
  const markerMat = new MeshBasicMaterial({ color: '#38bdf8' });
  const markers = new InstancedMesh(markerGeo, markerMat, MAX_MARKERS);
  markers.name = 'scanMarkers';
  markers.count = 0; // Render none initially
  group.add(markers);

  let pointCount = 0;
  let markerCount = 0;
  const dummy = new Object3D();
  const redColor = new Color(1, 0.27, 0.27);

  /**
   * Adds a point to the trail and optionally a scan marker.
   *
   * @param {number} x - World X in meters
   * @param {number} z - World Z in meters
   * @param {number} altitude - Altitude in meters
   * @param {'scan'|'turn'|'transit'} action
   * @param {boolean} isAnomaly
   */
  function addPoint(x, z, altitude, action, isAnomaly) {
    // Capacity guard (T-04-02)
    if (pointCount >= MAX_POINTS) return;

    // Convert to scene units (1 unit = 10m)
    const sx = x * 0.1;
    const sy = altitude * 0.1;
    const sz = z * 0.1;

    const i3 = pointCount * 3;
    positions[i3] = sx;
    positions[i3 + 1] = sy;
    positions[i3 + 2] = sz;

    const color = getSegmentColor(action, isAnomaly);
    colors[i3] = color.r;
    colors[i3 + 1] = color.g;
    colors[i3 + 2] = color.b;

    pointCount++;
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.setDrawRange(0, pointCount);

    // Scan markers (D-23)
    if (action === 'scan' && markerCount < MAX_MARKERS) {
      dummy.position.set(sx, sy, sz);
      dummy.updateMatrix();
      markers.setMatrixAt(markerCount, dummy.matrix);
      if (isAnomaly) {
        markers.setColorAt(markerCount, redColor);
      }
      markerCount++;
      markers.count = markerCount;
      markers.instanceMatrix.needsUpdate = true;
      if (markers.instanceColor) {
        markers.instanceColor.needsUpdate = true;
      }
    }
  }

  /**
   * Disposes all GPU resources in the trail group.
   */
  function dispose() {
    group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  return { group, addPoint, dispose };
}
