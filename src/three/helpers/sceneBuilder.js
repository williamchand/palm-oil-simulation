import { PlaneGeometry, MeshStandardMaterial, Mesh, Color } from 'three';
import { createPlantationMesh, disposePlantationMesh } from './plantationMesh.js';

/**
 * @typedef {import('../../types/plantation.js').PlantationData} PlantationData
 */

/**
 * Creates a scene builder that manages dynamic scene content.
 * Handles clearing old objects before rebuilding (D-08).
 * 
 * @param {THREE.Scene} scene - The Three.js scene
 * @returns {{rebuild: (data: PlantationData) => void, clear: () => void, getPlantationBounds: () => {width: number, height: number, centerX: number, centerZ: number} | null}}
 */
export function createSceneBuilder(scene) {
  /** @type {import('three').Group | null} */
  let currentPlantation = null;
  /** @type {import('three').Mesh | null} */
  let currentGround = null;

  /**
   * Clears all dynamic scene content (plantation, ground).
   * Preserves static elements (lights, camera, drone).
   */
  function clear() {
    if (currentPlantation) {
      scene.remove(currentPlantation);
      disposePlantationMesh(currentPlantation);
      currentPlantation = null;
    }
    if (currentGround) {
      scene.remove(currentGround);
      if (currentGround.geometry) currentGround.geometry.dispose();
      if (currentGround.material) currentGround.material.dispose();
      currentGround = null;
    }
  }

  /**
   * Rebuilds scene content from plantation data.
   * Clears existing content first per D-08.
   * 
   * @param {PlantationData} plantationData
   */
  function rebuild(plantationData) {
    // Always clear before rebuilding (D-08)
    clear();

    if (!plantationData || plantationData.trees.length === 0) {
      return;
    }

    // Create ground plane sized to plantation
    const widthUnits = plantationData.metadata.cols * plantationData.metadata.spacing * 0.1;
    const heightUnits = plantationData.metadata.rows * plantationData.metadata.spacing * 0.1;
    
    const groundGeometry = new PlaneGeometry(widthUnits * 1.2, heightUnits * 1.2);
    const groundMaterial = new MeshStandardMaterial({
      color: '#1a2f1a',
      roughness: 1
    });
    currentGround = new Mesh(groundGeometry, groundMaterial);
    currentGround.rotation.x = -Math.PI / 2;
    currentGround.position.set(widthUnits / 2, 0, heightUnits / 2);
    currentGround.name = 'ground';
    scene.add(currentGround);

    // Create plantation mesh
    currentPlantation = createPlantationMesh(plantationData);
    scene.add(currentPlantation);
  }

  /**
   * Gets the current plantation bounds in scene units.
   * 
   * @returns {{width: number, height: number, centerX: number, centerZ: number} | null}
   */
  function getPlantationBounds() {
    if (!currentPlantation) return null;
    // Calculate from current ground position
    if (!currentGround) return null;
    const geo = currentGround.geometry;
    return {
      width: geo.parameters.width,
      height: geo.parameters.height,
      centerX: currentGround.position.x,
      centerZ: currentGround.position.z
    };
  }

  return { rebuild, clear, getPlantationBounds };
}
