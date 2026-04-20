import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock document for Node environment
global.document = {
  createElement: vi.fn((tag) => {
    if (tag === 'canvas') return {
      style: {},
      width: 256,
      height: 256,
      getContext: vi.fn(() => ({
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        fillRect: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn()
      }))
    };
    return {
      style: {},
      appendChild: vi.fn(),
      clientWidth: 800,
      clientHeight: 600
    };
  })
};

global.window = {
  devicePixelRatio: 1,
  requestAnimationFrame: vi.fn((fn) => setTimeout(fn, 16))
};

global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

global.performance = {
  now: vi.fn(() => Date.now())
};

// Mock Three.js since we can't run WebGL in Node
vi.mock('three', () => ({
  Scene: vi.fn(() => ({ add: vi.fn(), remove: vi.fn(), background: null })),
  Color: vi.fn(),
  PerspectiveCamera: vi.fn(() => ({ position: { set: vi.fn(), lerp: vi.fn(), x: 0, y: 0, z: 0 }, lookAt: vi.fn(), aspect: 1, updateProjectionMatrix: vi.fn() })),
  WebGLRenderer: vi.fn(() => ({ 
    setPixelRatio: vi.fn(), 
    setSize: vi.fn(), 
    render: vi.fn(),
    domElement: document.createElement('canvas')
  })),
  AmbientLight: vi.fn(),
  PlaneGeometry: vi.fn(() => ({ dispose: vi.fn(), parameters: { width: 10, height: 10 } })),
  MeshStandardMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  MeshBasicMaterial: vi.fn(() => ({ dispose: vi.fn() })),
  Mesh: vi.fn(() => ({ rotation: { x: 0 }, position: { set: vi.fn(), x: 0, y: 0 }, name: '', geometry: null, material: null, visible: true })),
  BoxGeometry: vi.fn(() => ({ dispose: vi.fn() })),
  Group: vi.fn(() => ({ add: vi.fn(), position: { set: vi.fn(), y: 0, x: 0 }, rotation: { y: 0 }, name: '' })),
  CanvasTexture: vi.fn(() => ({ colorSpace: '', repeat: { set: vi.fn() }, wrapS: 0, wrapT: 0, needsUpdate: false })),
  Vector3: vi.fn(() => ({ set: vi.fn(), x: 0, y: 0, z: 0 })),
  RepeatWrapping: 1000,
  SRGBColorSpace: 'srgb'
}));

// Mock sceneBuilder
vi.mock('../../../src/three/helpers/sceneBuilder.js', () => ({
  createSceneBuilder: vi.fn(() => ({
    rebuild: vi.fn(),
    clear: vi.fn(),
    getPlantationBounds: vi.fn(() => ({ width: 10, height: 10, centerX: 5, centerZ: 5 }))
  }))
}));

// Mock heatmapOverlay
vi.mock('../../../src/three/helpers/heatmapOverlay.js', () => ({
  createHeatmapOverlay: vi.fn(() => ({
    mesh: { name: 'heatmapOverlay' },
    reveal: vi.fn(),
    dispose: vi.fn()
  }))
}));

// Mock pathTrail
vi.mock('../../../src/three/helpers/pathTrail.js', () => ({
  createPathTrail: vi.fn(() => ({
    group: { name: 'pathTrail' },
    addPoint: vi.fn(),
    dispose: vi.fn()
  }))
}));

describe('sceneController', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    Object.defineProperty(container, 'clientWidth', { value: 800 });
    Object.defineProperty(container, 'clientHeight', { value: 600 });
    vi.clearAllMocks();
  });

  it('returns controller object with rebuild method', async () => {
    const { createDroneScene } = await import('../../../src/three/createDroneScene.js');
    const controller = createDroneScene(container);
    expect(controller).toHaveProperty('rebuild');
    expect(typeof controller.rebuild).toBe('function');
  });

  it('returns controller with setDronePosition method', async () => {
    const { createDroneScene } = await import('../../../src/three/createDroneScene.js');
    const controller = createDroneScene(container);
    expect(controller).toHaveProperty('setDronePosition');
    expect(typeof controller.setDronePosition).toBe('function');
  });

  it('returns controller with stop method', async () => {
    const { createDroneScene } = await import('../../../src/three/createDroneScene.js');
    const controller = createDroneScene(container);
    expect(controller).toHaveProperty('stop');
    expect(typeof controller.stop).toBe('function');
  });
});
