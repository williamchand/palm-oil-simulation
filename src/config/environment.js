export function getEnvironmentConfig() {
  return {
    arcgisApiKey: import.meta.env.VITE_ARCGIS_API_KEY?.trim() ?? '',
    cesiumToken: import.meta.env.VITE_CESIUM_ION_TOKEN?.trim() ?? '',
    gemmaApiUrl: import.meta.env.VITE_GEMMA_API_URL?.trim() ?? '',
    gemmaApiKey: import.meta.env.VITE_GEMMA_API_KEY?.trim() ?? ''
  };
}

