import { Viewer, Ion, createWorldTerrainAsync, Rectangle } from 'cesium';

function createMessage(title, description) {
  const wrapper = document.createElement('div');
  wrapper.className = 'map-placeholder';
  wrapper.innerHTML = `
    <strong>${title}</strong>
    <p>${description}</p>
  `;
  return wrapper;
}

export async function createMapPanel(container, config) {
  if (!config.cesiumToken) {
    container.appendChild(
      createMessage(
        'Cesium token required',
        'Set VITE_CESIUM_ION_TOKEN in .env to enable 3D terrain and imagery.'
      )
    );
    return { viewer: null };
  }

  try {
    Ion.defaultAccessToken = config.cesiumToken;

    // Try terrain first, fall back to default if Ion services unavailable
    let terrainOpts = {};
    try {
      terrainOpts.terrain = await createWorldTerrainAsync();
    } catch (terrainErr) {
      console.warn('Cesium terrain unavailable, using default ellipsoid:', terrainErr.message);
    }
    
    const viewer = new Viewer(container, {
      ...terrainOpts,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false
    });

    // Center on Malaysia plantation region per existing default
    viewer.camera.setView({
      destination: Rectangle.fromDegrees(101.5, 3.0, 101.9, 3.3)
    });

    return { viewer };
  } catch (error) {
    console.error('Unable to initialize Cesium viewer:', error);
    container.replaceChildren(
      createMessage(
        'Cesium initialization failed',
        `${error.message || 'Unknown error'}. Check the token and network access.`
      )
    );
    return { viewer: null };
  }
}

