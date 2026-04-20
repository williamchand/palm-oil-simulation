async function loadArcGisModules() {
  const [arcgisConfigModule, MapModule, MapViewModule] = await Promise.all([
    import('@arcgis/core/config.js'),
    import('@arcgis/core/Map.js'),
    import('@arcgis/core/views/MapView.js')
  ]);

  return {
    arcgisConfig: arcgisConfigModule.default,
    ArcGisMap: MapModule.default,
    MapView: MapViewModule.default
  };
}

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
  if (!config.arcgisApiKey) {
    container.appendChild(
      createMessage(
        'ArcGIS key required',
        'Add VITE_ARCGIS_API_KEY to initialize the live basemap. The layout is ready for Phase 2 area selection work.'
      )
    );
    return;
  }

  try {
    const { arcgisConfig, ArcGisMap, MapView } = await loadArcGisModules();
    arcgisConfig.apiKey = config.arcgisApiKey;

    const map = new ArcGisMap({
      basemap: 'topo-vector'
    });

    const view = new MapView({
      container,
      map,
      center: [101.6869, 3.139],
      zoom: 11,
      ui: {
        components: ['zoom', 'compass']
      }
    });

    await view.when();
  } catch (error) {
    console.error('Unable to initialize ArcGIS map', error);
    container.replaceChildren(
      createMessage(
        'ArcGIS initialization failed',
        'Check the API key and network access. The panel stays mounted so the rest of the UI can continue working.'
      )
    );
  }
}

