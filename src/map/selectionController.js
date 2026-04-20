import * as Cesium from 'cesium';
import { normalizeSelection, validateBounds } from '../types/selection.js';

export function createSelectionController(viewer, callbacks = {}) {
  if (!viewer) return { enable: () => {}, disable: () => {}, getSelection: () => null, clear: () => {} };

  let isDrawing = false;
  let startPosition = null;
  let currentRectangle = null;
  let rectangleEntity = null;
  let confirmedSelection = null;

  const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);

  function updateRectangleEntity() {
    if (rectangleEntity) {
      viewer.entities.remove(rectangleEntity);
    }
    if (!currentRectangle) return;

    rectangleEntity = viewer.entities.add({
      rectangle: {
        coordinates: new Cesium.CallbackProperty(() => currentRectangle, false),
        material: Cesium.Color.fromCssColorString('#38bdf8').withAlpha(0.15),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#38bdf8'),
        outlineWidth: 2
      }
    });
  }

  function enable() {
    handler.setInputAction((click) => {
      const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;
      
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      startPosition = { lon: Cesium.Math.toDegrees(carto.longitude), lat: Cesium.Math.toDegrees(carto.latitude) };
      isDrawing = true;
      confirmedSelection = null;
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((movement) => {
      if (!isDrawing || !startPosition) return;
      
      const cartesian = viewer.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
      if (!cartesian) return;

      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      const endLon = Cesium.Math.toDegrees(carto.longitude);
      const endLat = Cesium.Math.toDegrees(carto.latitude);

      currentRectangle = Cesium.Rectangle.fromDegrees(
        Math.min(startPosition.lon, endLon),
        Math.min(startPosition.lat, endLat),
        Math.max(startPosition.lon, endLon),
        Math.max(startPosition.lat, endLat)
      );
      updateRectangleEntity();
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(() => {
      if (!isDrawing || !currentRectangle) return;
      isDrawing = false;
      
      const bounds = {
        west: Cesium.Math.toDegrees(currentRectangle.west),
        south: Cesium.Math.toDegrees(currentRectangle.south),
        east: Cesium.Math.toDegrees(currentRectangle.east),
        north: Cesium.Math.toDegrees(currentRectangle.north)
      };

      const validation = validateBounds(bounds);
      if (!validation.valid) {
        callbacks.onError?.(validation.error);
        clear();
        return;
      }

      confirmedSelection = normalizeSelection(currentRectangle);
      callbacks.onConfirm?.(confirmedSelection);
    }, Cesium.ScreenSpaceEventType.LEFT_UP);
  }

  function disable() {
    handler.removeInputAction(ScreenSpaceEventType.LEFT_DOWN);
    handler.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE);
    handler.removeInputAction(ScreenSpaceEventType.LEFT_UP);
  }

  function getSelection() {
    return confirmedSelection;
  }

  function clear() {
    if (rectangleEntity) {
      viewer.entities.remove(rectangleEntity);
      rectangleEntity = null;
    }
    currentRectangle = null;
    confirmedSelection = null;
    startPosition = null;
    isDrawing = false;
  }

  return { enable, disable, getSelection, clear };
}
