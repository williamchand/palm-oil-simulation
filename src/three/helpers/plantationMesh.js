import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  Color
} from 'three';

/**
 * @typedef {import('../../types/plantation.js').PlantationData} PlantationData
 */

const TRUNK_HEIGHT = 4;
const TRUNK_RADIUS = 0.3;
const CANOPY_HEIGHT = 3;
const CANOPY_RADIUS = 2;

/**
 * Creates instanced mesh for plantation trees from PlantationData.
 * Uses instancing for performance with thousands of trees.
 * 
 * @param {PlantationData} plantationData
 * @returns {Group} - Group containing trunk and canopy instanced meshes
 */
export function createPlantationMesh(plantationData) {
  const group = new Group();
  group.name = 'plantation';

  const treeCount = plantationData.trees.length;
  if (treeCount === 0) return group;

  // Trunk geometry and material
  const trunkGeometry = new CylinderGeometry(
    TRUNK_RADIUS * 0.7,
    TRUNK_RADIUS,
    TRUNK_HEIGHT,
    8
  );
  const trunkMaterial = new MeshStandardMaterial({
    color: '#4a3728',
    roughness: 0.9
  });

  // Canopy geometry and material (cone for palm fronds)
  const canopyGeometry = new ConeGeometry(CANOPY_RADIUS, CANOPY_HEIGHT, 8);
  const canopyMaterial = new MeshStandardMaterial({
    color: '#2d5a3d',
    roughness: 0.8
  });

  // Create instanced meshes
  const trunks = new InstancedMesh(trunkGeometry, trunkMaterial, treeCount);
  trunks.name = 'trunks';
  const canopies = new InstancedMesh(canopyGeometry, canopyMaterial, treeCount);
  canopies.name = 'canopies';

  const dummy = new Object3D();
  const tempColor = new Color();

  plantationData.trees.forEach((tree, index) => {
    // Scale down from meters to scene units (1 unit = 10m for visibility)
    const sceneX = tree.x * 0.1;
    const sceneZ = tree.y * 0.1; // Y in world coords -> Z in Three.js
    
    // Trunk position
    dummy.position.set(sceneX, TRUNK_HEIGHT / 2, sceneZ);
    dummy.updateMatrix();
    trunks.setMatrixAt(index, dummy.matrix);

    // Canopy position (on top of trunk)
    dummy.position.set(sceneX, TRUNK_HEIGHT + CANOPY_HEIGHT / 2, sceneZ);
    dummy.updateMatrix();
    canopies.setMatrixAt(index, dummy.matrix);

    // Color canopy based on health (green to yellow/brown)
    const healthColor = tree.health > 0.7 
      ? '#2d5a3d'  // Healthy green
      : tree.health > 0.4
        ? '#5a6b3d' // Slightly stressed
        : '#6b5a3d'; // Disease indicator
    tempColor.set(healthColor);
    canopies.setColorAt(index, tempColor);
  });

  trunks.instanceMatrix.needsUpdate = true;
  canopies.instanceMatrix.needsUpdate = true;
  if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;

  group.add(trunks);
  group.add(canopies);

  return group;
}

/**
 * Disposes of plantation mesh and its geometries/materials.
 * 
 * @param {Group} plantationGroup
 */
export function disposePlantationMesh(plantationGroup) {
  plantationGroup.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}
