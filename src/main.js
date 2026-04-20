import 'cesium/Build/Cesium/Widgets/widgets.css';
import './styles/main.css';
import { createSimulationShell } from './app/createSimulationShell.js';

window.CESIUM_BASE_URL = '/cesium/';

createSimulationShell(document.querySelector('#app'));

