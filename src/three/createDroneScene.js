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
  WebGLRenderer
} from 'three';

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
  group.position.y = 1.1;

  return group;
}

export function createDroneScene(container) {
  const scene = new Scene();
  scene.background = new Color('#07111f');

  const width = container.clientWidth || 640;
  const height = container.clientHeight || 360;

  const camera = new PerspectiveCamera(50, width / height, 0.1, 100);
  camera.position.set(3, 2.8, 4.2);
  camera.lookAt(0, 0.8, 0);

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const ambient = new AmbientLight('#ffffff', 1.6);
  scene.add(ambient);

  const ground = new Mesh(
    new PlaneGeometry(12, 12),
    new MeshStandardMaterial({
      map: createGroundTexture(),
      color: '#0d1724',
      roughness: 1
    })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const drone = createDrone();
  scene.add(drone);

  const animate = () => {
    drone.rotation.y += 0.01;
    drone.position.x = Math.sin(performance.now() * 0.001) * 0.35;
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
}
