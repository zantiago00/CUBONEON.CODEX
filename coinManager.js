// Módulo: coinManager.js
// Descripción: Gestiona monedas, generando tipos basados en la regla 'spawn'
//              del nivel actual definido en config.js. (Versión Final)

// --- Importaciones ---
import { container } from './domRefs.js'; //
import {
    COIN_BASE_INTERVAL_MS, //
    MIN_COIN_INTERVAL_TIME_MS, //
    COIN_INTERVAL_RANDOMNESS_MS, //
    COIN_INTERVAL_COMBO6_MULTIPLIER, //
    LEVEL_RULES, //
    COIN_BONUSES //
} from './config.js';
import * as state from './state.js'; //

// --- Estado Interno del Módulo ---
let coins = [];
let coinTimeoutId = null;
let lastCoinSpawnTime = 0;

// ===========================================================
//                    FUNCIONES PÚBLICAS
// ===========================================================

/** Inicializa o resetea el gestor para una nueva partida. */
export function initCoinManager() {
    coins = [];
    lastCoinSpawnTime = 0;
    clearCoinTimeout();
    // console.log("CoinManager: Gestor de monedas inicializado."); // Log opcional
}

/**
 * Programa la aparición de la siguiente moneda.
 * @param {boolean} gameRunning - Si el juego está activo.
 */
export function scheduleNextCoin(gameRunning) {
    if (!gameRunning) {
        clearCoinTimeout();
        return;
    }
    clearCoinTimeout();

    const now = Date.now();
    let baseInterval = COIN_BASE_INTERVAL_MS; //

    const combo = state.getCombo();
    if (combo >= 6) {
        baseInterval *= COIN_INTERVAL_COMBO6_MULTIPLIER; //
    }
    baseInterval += Math.random() * COIN_INTERVAL_RANDOMNESS_MS; //

    const timeSinceLast = now - lastCoinSpawnTime;
    const delay = Math.max(MIN_COIN_INTERVAL_TIME_MS, baseInterval - timeSinceLast); //

    coinTimeoutId = setTimeout(() => {
        _spawnAndReschedule(gameRunning);
    }, delay);
}

/** Cancela el timeout pendiente. */
export function clearCoinTimeout() {
    if (coinTimeoutId) {
        clearTimeout(coinTimeoutId);
        coinTimeoutId = null;
    }
}

/** Devuelve las monedas activas. */
export function getCoins() {
    return coins;
}

/** Elimina monedas del array interno. */
export function removeCoins(coinsToRemoveElements) {
    if (!coinsToRemoveElements || coinsToRemoveElements.length === 0) return;
    const elementsToRemoveSet = new Set(coinsToRemoveElements);
    coins = coins.filter(coin => !elementsToRemoveSet.has(coin.element));
}

// ===========================================================
//                    FUNCIONES PRIVADAS
// ===========================================================

/** Función interna llamada por setTimeout para generar y reprogramar. */
function _spawnAndReschedule(gameRunning) {
    if (!gameRunning) return;

    _spawnCoin();
    lastCoinSpawnTime = Date.now();

    scheduleNextCoin(gameRunning); //
}

/**
 * Determina qué tipo de moneda debe aparecer según la regla 'spawn'
 * del NIVEL ACTUAL, la crea y la añade al juego.
 * @private
 */
function _spawnCoin() {
    if (!container) return; //

    const currentLevel = state.getCurrentLevel(); //
    const rule = LEVEL_RULES.find(r => r.level === currentLevel); //

    let typeToSpawn = null;
    let bonus = 0;

    if (rule && rule.spawn) {
        typeToSpawn = rule.spawn; // Obtiene el valor string de COIN_TYPES.* desde config.js
        bonus = COIN_BONUSES[typeToSpawn] ?? 0; // Busca bonus en config.js
    } else {
        console.warn(`CoinManager: No hay regla de 'spawn' definida para el Nivel ${currentLevel}. No se generará moneda.`);
        return;
    }

    if (typeToSpawn && COIN_BONUSES.hasOwnProperty(typeToSpawn)) { //
        // console.log(`CoinManager: Generando moneda tipo '${typeToSpawn}' (bonus ${bonus}s) para Nivel ${currentLevel}.`); // Log opcional
        const coinData = _createCoinElement(typeToSpawn, bonus);
        if (coinData) {
            coins.push(coinData);
            container.appendChild(coinData.element); //
        }
    } else {
        console.warn(`CoinManager: Tipo de moneda a generar '${typeToSpawn}' es inválido o no tiene bonus definido en COIN_BONUSES de config.js.`);
    }
}

/**
 * Crea el elemento DOM para una moneda.
 * @param {string} type - El tipo de moneda (valor string del Enum, ej: 'green', 'amarilla').
 * @param {number} bonus - El bonus de tiempo asociado.
 * @returns {object | null} Objeto con { element, type, bonus, width, height } o null si falla.
 * @private
 */
function _createCoinElement(type, bonus) {
    if (!container) return null; //
    const element = document.createElement('div');
    element.className = `coin ${type}`; // El CSS usará este string directamente
    element.classList.add('firefly');

    const containerWidth = container.offsetWidth; //
    element.style.left = `${containerWidth + (Math.random() * (containerWidth * 0.1))}px`;

    const containerHeight = container.offsetHeight; //
    const playerHeightEstimate = containerHeight * 0.175;
    const safeBottomMin = playerHeightEstimate * 0.5;
    const safeBottomMax = Math.min(containerHeight * 0.65, containerHeight - (playerHeightEstimate * 1.5));
    const randomBottom = safeBottomMin + Math.random() * (safeBottomMax - safeBottomMin);
    element.style.bottom = `${randomBottom}px`;

    return { element, type: type, bonus, width: 0, height: 0, y: randomBottom };
}