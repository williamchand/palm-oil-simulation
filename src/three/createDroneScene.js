import {
  AmbientLight,
  BoxGeometry,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three';
import { createSceneBuilder } from './helpers/sceneBuilder.js';
import { createHeatmapOverlay } from './helpers/heatmapOverlay.js';
import { createPathTrail } from './helpers/pathTrail.js';

function createGroundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext('2d');

  context.fillStyle = '#0f1c2b';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = '#1f4b3f';
  context.lineWidth = 2;

  for (let index = 16; index < 256; index += 32) {
    context.beginPath();
    context.moveTo(index, 0);
    context.lineTo(index, 256);
    context.stroke();

    context.beginPath();
    context.moveTo(0, index);
    context.lineTo(256, index);
    context.stroke();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.repeat.set(6, 6);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  return texture;
}

function createDrone() {
  const group = new Group();
  group.name = 'drone';

  const body = new Mesh(
    new BoxGeometry(1.6, 0.35, 0.7),
    new MeshStandardMaterial({ color: '#38bdf8', metalness: 0.3, roughness: 0.4 })
  );

  const sensor = new Mesh(
    new BoxGeometry(0.5, 0.2, 0.5),
    new MeshStandardMaterial({ color: '#f8fafc', metalness: 0.1, roughness: 0.7 })
  );
  sensor.position.y = 0.3;

  group.add(body, sensor);
  group.position.y = 1.5;

  return group;
}

/**
 * Creates 3D drone scene with controller for rebuild and animation.
 * 
 * @param {HTMLElement} container
 * @returns {{rebuild: Function, setDronePosition: Function, stop: Function, resume: Function, addTrailPoint: Function, revealHeatmap: Function, resetVisualization: Function}}
 */
export function createDroneScene(container) {
  const scene = new Scene();
  scene.background = new Color('#07111f');

  const width = container.clientWidth || 640;
  const height = container.clientHeight || 360;

  const camera = new PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(15, 12, 20);
  camera.lookAt(0, 0, 0);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambient = new AmbientLight('#ffffff', 1.6);
  scene.add(ambient);

  // Default ground (shown before plantation is loaded)
  const defaultGround = new Mesh(
    new PlaneGeometry(12, 12),
    new MeshStandardMaterial({
      map: createGroundTexture(),
      color: '#0d1724',
      roughness: 1
    })
  );
  defaultGround.rotation.x = -Math.PI / 2;
  defaultGround.name = 'defaultGround';
  scene.add(defaultGround);

  const drone = createDrone();
  scene.add(drone);

  const sceneBuilder = createSceneBuilder(scene);

  let heatmapOverlay = null;
  let pathTrail = null;
  const cameraTarget = new Vector3();
  let autoFollowEnabled = false;

  let animationActive = true;
  let routeWaypoints = null;
  let currentWaypointIndex = 0;
  let animationProgress = 0;

  const animate = () => {
    if (!animationActive) {
      renderer.render(scene, camera);
      return;
    }

    // Default idle animation when no route
    if (!routeWaypoints) {
      drone.rotation.y += 0.01;
      drone.position.x = Math.sin(performance.now() * 0.001) * 0.35;
    } else {
      // Route-based animation handled by startAnimation
    }

    // Auto-follow camera: lerp toward drone position each frame (D-26)
    if (autoFollowEnabled) {
      cameraTarget.set(
        drone.position.x + 8,
        drone.position.y + 6,
        drone.position.z + 10
      );
      camera.position.lerp(cameraTarget, 0.02);
      camera.lookAt(drone.position.x, drone.position.y, drone.position.z);
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(animate);
  };

  animate();

  const resizeObserver = new ResizeObserver(([entry]) => {
    const nextWidth = entry.contentRect.width;
    const nextHeight = entry.contentRect.height;
    renderer.setSize(nextWidth, nextHeight);
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(container);

  return {
    /**
     * Rebuilds scene from plantation data. Clears existing content first.
     * @param {import('../types/plantation.js').PlantationData} plantationData
     */
    rebuild(plantationData) {
      // Hide default ground when plantation is loaded
      defaultGround.visible = false;
      sceneBuilder.rebuild(plantationData);

      // Dispose previous heatmap/trail before creating new ones
      if (heatmapOverlay) {
        scene.remove(heatmapOverlay.mesh);
        heatmapOverlay.dispose();
        heatmapOverlay = null;
      }
      if (pathTrail) {
        scene.remove(pathTrail.group);
        pathTrail.dispose();
        pathTrail = null;
      }

      if (plantationData && plantationData.trees && plantationData.trees.length > 0) {
        // Create heatmap overlay
        heatmapOverlay = createHeatmapOverlay(plantationData);
        scene.add(heatmapOverlay.mesh);

        // Create path trail
        pathTrail = createPathTrail();
        scene.add(pathTrail.group);
      }

      // Camera positioned by bounds-based logic; auto-follow starts on simulation run
      autoFollowEnabled = false;

      // Adjust camera to fit plantation
      const bounds = sceneBuilder.getPlantationBounds();
      if (bounds) {
        camera.position.set(
          bounds.centerX + bounds.width * 0.8,
          bounds.height * 0.6,
          bounds.centerZ + bounds.height * 0.8
        );
        camera.lookAt(bounds.centerX, 0, bounds.centerZ);
      }

      // Reset drone to origin
      drone.position.set(0, 1.5, 0);
    },

    /**
     * Sets drone position in scene units.
     * @param {number} x
     * @param {number} z 
     * @param {number} altitude
     */
    setDronePosition(x, z, altitude) {
      drone.position.set(x * 0.1, altitude * 0.1, z * 0.1);
    },

    /**
     * Stops animation loop.
     */
    stop() {
      animationActive = false;
    },

    /**
     * Resumes animation loop.
     */
    resume() {
      if (!animationActive) {
        animationActive = true;
        animate();
      }
    },

    /**
     * Adds a point to the drone path trail.
     * First call enables auto-follow camera.
     * @param {number} x - World X in meters
     * @param {number} z - World Z in meters
     * @param {number} altitude - Altitude in meters
     * @param {'scan'|'turn'|'transit'} action
     * @param {boolean} isAnomaly
     */
    addTrailPoint(x, z, altitude, action, isAnomaly) {
      if (!pathTrail) return;
      pathTrail.addPoint(x, z, altitude, action, isAnomaly);
      autoFollowEnabled = true;
    },

    /**
     * Reveals a scanned region on the heatmap overlay.
     * @param {number} waypointX - Waypoint X in meters
     * @param {number} waypointY - Waypoint Y in meters
     * @param {import('../types/plantation.js').Tree[]} trees - Nearby trees
     * @param {Array<{x: number, y: number}>} anomalies - Anomaly positions
     */
    revealHeatmap(waypointX, waypointY, trees, anomalies) {
      if (!heatmapOverlay) return;
      heatmapOverlay.reveal(waypointX, waypointY, trees, anomalies);
    },

    /**
     * Resets visualization state (heatmap + trail).
     */
    resetVisualization() {
      if (heatmapOverlay) {
        scene.remove(heatmapOverlay.mesh);
        heatmapOverlay.dispose();
        heatmapOverlay = null;
      }
      if (pathTrail) {
        scene.remove(pathTrail.group);
        pathTrail.dispose();
        pathTrail = null;
      }
      autoFollowEnabled = false;
    }
  };
}
