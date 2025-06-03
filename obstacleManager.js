// Módulo: obstacleManager.js
// Descripción: Gestiona programación, creación y estado de obstáculos,
//              con formas y colores tipo Tetris dependientes del nivel. (Versión Final)

// Importar referencias DOM
import { container } from './domRefs.js'; //
// Importar constantes de configuración
import {
  OBSTACLE_BASE_INTERVAL_MS, OBSTACLE_MIN_GAP_TIME_MS, OBSTACLE_RATE_DECREASE_FACTOR,
  MAX_CONSECUTIVE_OBSTACLES, CONSECUTIVE_OBSTACLE_BREAK_MULTIPLIER,
  MIN_OBSTACLE_VISUAL_GAP_PX, OBSTACLE_LARGE_CHANCE, OBSTACLE_DOUBLE_CHANCE,
  GROUND_Y
} from './config.js'; //
// Importar el módulo de estado para leer el nivel actual
import * as state from './state.js'; //

/* ---------- Formas disponibles por nivel ---------- */
// Esta definición se mantiene aquí para este módulo. Si se moviera a config.js, se importaría.
const SHAPES_BY_LEVEL = [
  ['square'],                                      // Nivel 0
  ['square', 'triangle'],                          // Nivel 1
  ['square', 'triangle', 'line', 'cube'],          // Nivel 2
  ['square', 'triangle', 'line', 'cube', 'zeta'],  // Nivel 3
  ['square', 'triangle', 'line', 'cube', 'zeta', 'lshape'] // Nivel 4 y 5 (Nivel 5 usará la última definición)
];

/* ---------- ESTADO INTERNO ---------- */
let obstacles = [];
let obstacleTimeoutId = null;
let lastObstacleSpawnTime = 0;
let consecutiveObstacles = 0;

/* ===========================================================
                       API PÚBLICA
   =========================================================== */
export function initObstacleManager() {
  obstacles = [];
  consecutiveObstacles = 0;
  lastObstacleSpawnTime = 0;
  clearObstacleTimeout();
  // console.log('Gestor de obstáculos inicializado.'); // Log opcional para menos verbosidad
}

export function scheduleNextObstacle(gameRunning, currentSpeed, currentCombo) {
  if (!gameRunning) {
    clearObstacleTimeout();
    return;
  }

  clearObstacleTimeout();

  const now = Date.now();
  let baseInterval = OBSTACLE_BASE_INTERVAL_MS; //

  if (currentCombo >= 3) {
    baseInterval *= Math.pow(OBSTACLE_RATE_DECREASE_FACTOR, //
      Math.min(10, currentCombo - 2)); // Limitar efecto del combo
  }

  if (consecutiveObstacles >= MAX_CONSECUTIVE_OBSTACLES) { //
    baseInterval *= CONSECUTIVE_OBSTACLE_BREAK_MULTIPLIER; //
  }

  const containerWidth = container?.offsetWidth ?? 800; //
  const visualGapTime = (MIN_OBSTACLE_VISUAL_GAP_PX / currentSpeed) * 1000; //
  const minGap = visualGapTime + OBSTACLE_MIN_GAP_TIME_MS; //

  const rateMod = state.getObstacleRateModifier ? state.getObstacleRateModifier() : 1;
  const timeSinceLast = now - lastObstacleSpawnTime;
  const delay = Math.max(minGap, (baseInterval * rateMod) - timeSinceLast);

  obstacleTimeoutId = setTimeout(() => {
    _spawnAndReschedule(gameRunning, currentSpeed, currentCombo);
  }, delay);
}

export function clearObstacleTimeout() {
  if (obstacleTimeoutId) {
    clearTimeout(obstacleTimeoutId);
    obstacleTimeoutId = null;
  }
}

export function getObstacles() { return obstacles; }

export function removeObstacles(obstaclesToRemoveElements) {
  if (!obstaclesToRemoveElements || obstaclesToRemoveElements.length === 0) return;
  const elementsSet = new Set(obstaclesToRemoveElements);
  obstacles = obstacles.filter(obs => !elementsSet.has(obs.element));
}

/* ===========================================================
                       FUNCIONES PRIVADAS
   =========================================================== */
function _spawnAndReschedule(gameRunning, currentSpeed, currentCombo) {
  if (!gameRunning) return;

  if (consecutiveObstacles >= MAX_CONSECUTIVE_OBSTACLES) { //
    consecutiveObstacles = 0; // Resetear contador después del respiro
  }

  _spawnObstacle();
  lastObstacleSpawnTime = Date.now();

  scheduleNextObstacle(gameRunning, currentSpeed, currentCombo);
}

function _spawnObstacle() {
  if (!container) return; //

  const obsData = _createObstacleElement();
  if (!obsData) return;

  obstacles.push(obsData);
  container.appendChild(obsData.element); //
  consecutiveObstacles++;

  if (state.getCombo() >= 3 && //
      Math.random() < OBSTACLE_DOUBLE_CHANCE && //
      consecutiveObstacles < MAX_CONSECUTIVE_OBSTACLES) { //

    const firstObstacleWidth = obsData.element.offsetWidth || (container.offsetWidth * 0.04); //
    if (firstObstacleWidth > 0) {
      const secondObsData = _createObstacleElement(firstObstacleWidth);
      if (secondObsData) {
        obstacles.push(secondObsData);
        container.appendChild(secondObsData.element); //
        consecutiveObstacles++;
        // console.log('Obstáculo doble generado.'); // Log opcional
      }
    }
  }
}

function _createObstacleElement(previousObstacleWidth = 0) {
  if (!container) return null; //

  const currentLevel = state.getCurrentLevel(); //
  const shapePoolIndex = Math.min(currentLevel, SHAPES_BY_LEVEL.length - 1);
  const shapePool = SHAPES_BY_LEVEL[shapePoolIndex];
  const shape = shapePool[Math.floor(Math.random() * shapePool.length)];

  const el = document.createElement('div');
  el.className = 'obstacle';
  el.classList.add(shape);

  const isLargeCandidate = ['square', 'cube', 'line'].includes(shape);
  if (isLargeCandidate && currentLevel >= 2 && Math.random() < OBSTACLE_LARGE_CHANCE) { //
    el.classList.add('large');
  }

  const containerWidth = container.offsetWidth; //
  let initialLeft = containerWidth;
  if (previousObstacleWidth > 0) {
    const gap = MIN_OBSTACLE_VISUAL_GAP_PX + (Math.random() * (containerWidth * 0.05)); //
    initialLeft += previousObstacleWidth + gap;
  }
  el.style.left = `${initialLeft}px`;
  el.style.bottom = `${GROUND_Y}px`; //

  return { element: el, width: 0, height: 0 }; // width/height se leerán dinámicamente si es necesario
}