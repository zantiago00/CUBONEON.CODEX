// Módulo: state.js
// Descripción: Gestiona el estado centralizado de CUBONEON ARENA
// Versión: Power-Ups con Enum + Telemetría + Estado de Sonido y Dash

/* ---------- Importaciones ---------- */
import { COIN_TYPES, GREEN_SPEED_INCREMENT, BLUE_JUMP_INCREMENT, WHITE_OBSTACLE_RATE_MOD } from './config.js';

const MODO_DEPURACION = false;

/* ---------- Variables de estado internas ---------- */

// Estado del Juego
let gameRunning = false;
let gamePaused = false;

// Puntuación y Progreso
let score = 0;
let combo = 0;
let gameTime = 0;
let currentLevel = 0;
let coinsCollected = {
  [COIN_TYPES.GREEN]: 0,
  [COIN_TYPES.BLUE]: 0,
  [COIN_TYPES.VIOLET]: 0,
  [COIN_TYPES.YELLOW]: 0,
  [COIN_TYPES.WHITE]: 0
}; //

// Información del Jugador
let playerName = "Anónimo";
let playerEmail = "";

// Estado del Boost de Velocidad Temporal (por moneda azul/amarilla)
let speedBoostActive = false;
let boostEndTime = 0;

// NUEVO: Estado para el Dash (si afecta la velocidad global gestionada en gameLoop)
let playerDashing = false;
let dashEffectEndTime = 0; // Para que gameLoop sepa cuándo termina el efecto del Dash en la velocidad

// NUEVO: Estado del Sonido
let soundMuted = false; // Podría cargarse desde localStorage para persistencia

// Bonus permanentes y modo ilimitado
let permanentSpeedBonus = 0;
let jumpVelocityBonus = 0;
let unlimitedMode = false;
let obstacleRateModifier = 1;

//--------------------------------------------------
// Power-Ups de un solo uso activados por moneda
//--------------------------------------------------
let powerUps = {
  [COIN_TYPES.VIOLET]: { count: 0 },   // Dash
  [COIN_TYPES.YELLOW]: { count: 0 },   // Double Jump
  [COIN_TYPES.WHITE]:  { count: 0 }    // Combo Aire
}; //

// Función interna para telemetría básica (lanza eventos personalizados)
function _dispatchAnalytics(eventName, detail) {
    try {
        window.dispatchEvent(new CustomEvent('analytics', {
             detail: {
                timestamp: Date.now(),
                event: eventName,
                ...detail
             }
        }));
    } catch (e) {
        // console.warn("Analytics event dispatch failed:", eventName, e);
    }
}

/**
 * Guarda un valor en localStorage atrapando posibles errores.
 * @param {string} clave - Llave donde se almacenará el valor.
 * @param {string} valor - Valor a almacenar.
 */
function _guardarEnLocalStorage(clave, valor) {
    try {
        localStorage.setItem(clave, valor);
    } catch (e) {
        console.warn(`No se pudo guardar ${clave} en localStorage.`);
    }
}

/**
 * Lee un valor desde localStorage de manera segura.
 * @param {string} clave - Llave a consultar.
 * @returns {string|null} Valor almacenado o null si falla.
 */
function _leerDeLocalStorage(clave) {
    try {
        return localStorage.getItem(clave);
    } catch (e) {
        console.warn(`No se pudo cargar ${clave} desde localStorage.`);
        return null;
    }
}

/* --- API pública para gestionar Power-Ups --- */
export function grantPowerUp(type) {
  if (powerUps.hasOwnProperty(type)) {
    if (powerUps[type].count === 0) { // Solo otorga si no tiene uno ya (o ajusta si pueden acumularse)
       powerUps[type].count = 1;
       if (MODO_DEPURACION) console.log(`State: Power-Up '${type}' otorgado (1 uso).`);
       _dispatchAnalytics('grantPowerUp', { type }); //
       // Aquí se podría llamar a un sonido de "power-up obtenido"
       // import { audioManager } from './audioManager.js'; // Cuidado con dependencias circulares si audioManager importa state
       // audioManager.playSound(SOUND_POWERUP_GRANT_PATH); // Idealmente, esto lo haría gameLoop al detectar el cambio.
    }
  } else {
      console.warn(`State: Intento de otorgar power-up inválido: ${type}`);
  }
}

export function consumePowerUp(type) {
  if (powerUps.hasOwnProperty(type) && powerUps[type].count > 0) {
    powerUps[type].count--; // Decrementa, podría ser > 0 si se acumulan
    if (MODO_DEPURACION) console.log(`State: Power-Up '${type}' consumido. Restantes: ${powerUps[type].count}`);
    _dispatchAnalytics('consumePowerUp', { type }); //
  }
} //

export function hasPowerUp(type) {
  return Boolean(powerUps[type]?.count > 0);
} //

export function resetAllPowerUps() {
  let changed = false;
  Object.keys(powerUps).forEach(key => {
      if(powerUps[key].count > 0) changed = true;
      powerUps[key].count = 0;
  });
  if (changed) {
      if (MODO_DEPURACION) console.log("State: Todos los power-ups reseteados a 0 usos.");
      _dispatchAnalytics('resetPowerUps', {}); //
  }
} //

export function getPowerUpsState() {
  // Devuelve una copia superficial para evitar mutación externa del objeto interno
  const currentPowerUpsStatus = {};
  for (const type in powerUps) {
      currentPowerUpsStatus[type] = { ...powerUps[type] };
  }
  return currentPowerUpsStatus;
}

/* ---------- Getters Generales ---------- */
export const isGameRunning            = () => gameRunning && !gamePaused;
export const isGameEffectivelyRunning = () => gameRunning; //
export const isPaused                 = () => gamePaused;
export const getScore                 = () => score;
export const getCombo                 = () => combo;
export const getGameTime              = () => gameTime;
export const getCurrentLevel          = () => currentLevel;
export const getCoinCount             = type => coinsCollected[type] ?? 0; //
export const getPlayerName            = () => playerName;
export const getPlayerEmail           = () => playerEmail;
export const isBoostActive            = () => speedBoostActive; //
export const getBoostEndTime          = () => boostEndTime;     //
export const isPlayerDashing          = () => playerDashing;    // NUEVO
export const getDashEffectEndTime     = () => dashEffectEndTime; // NUEVO
export const isSoundMuted             = () => soundMuted;       // NUEVO

/* ---------- Setters / Modificadores ---------- */

export function setGameRunning(isRunning) {
    if (gameRunning !== isRunning) {
        gameRunning = isRunning;
        if (!isRunning) gamePaused = false; // Si el juego se detiene, no puede estar pausado
        if (MODO_DEPURACION) console.log(`State: gameRunning = ${gameRunning}`);
    }
}

export function setGamePaused(isPaused) {
    if (!gameRunning && isPaused) { // No se puede pausar si el juego no está corriendo
        if (MODO_DEPURACION) console.log("State: Intento de pausar un juego no iniciado.");
        if(gamePaused) gamePaused = false; // Asegurar que el estado de pausa sea falso
        return;
    }
    if (gamePaused !== isPaused) {
        gamePaused = isPaused;
        if (MODO_DEPURACION) console.log(`State: gamePaused = ${gamePaused}`);
    }
}

export const setScore   = newScore => (score = Math.max(0, newScore));
export const setCombo   = newCombo => (combo = Math.max(0, newCombo));
export const setGameTime = time    => (gameTime = Math.max(0, time));

export function incrementScore(amount)   { score += amount; }
export function incrementCombo()         { combo++; /* console.log(`State: combo = ${combo}`); */ } // Log menos verboso
export function resetCombo()             { if (combo > 0) { if (MODO_DEPURACION) console.log(`State: combo reset (${combo} → 0)`); combo = 0; } }

export function setLevel(level) {
  if (currentLevel !== level) {
    currentLevel = level;
    if (MODO_DEPURACION) console.log(`State: currentLevel = ${currentLevel}`);
    _dispatchAnalytics('levelChange', { level: currentLevel }); //
  }
}

export function addCoin(type) {
  if (coinsCollected.hasOwnProperty(type)) { //
    coinsCollected[type]++; //
    // console.log(`State: coin ${type} = ${coinsCollected[type]}`); // Log menos verboso
  } else {
    console.warn(`State: Intento de añadir moneda de tipo inválido: ${type}`);
  }
}

export function resetCoinCount(type = null) {
  if (type === null) {
    let changed = false;
    Object.keys(coinsCollected).forEach(key => {
        if(coinsCollected[key] > 0) changed = true;
        coinsCollected[key] = 0;
    });
    if (changed && MODO_DEPURACION) console.log('State: Todos los contadores de monedas reseteados.');
  } else if (coinsCollected.hasOwnProperty(type)) {
    if (coinsCollected[type] > 0) {
        // console.log(`State: Contador de ${type} reseteado (${coinsCollected[type]} → 0).`); // Log menos verboso
        coinsCollected[type] = 0;
    }
  } else {
      console.warn(`State: Intento de resetear contador de tipo inválido: ${type}`);
  }
}

export function setPlayerInfo(name, email) {
  playerName  = (String(name).trim() || 'Anónimo'); // Asegurar que sea string y quitar espacios
  playerEmail = String(email).trim().toLowerCase(); // Asegurar que sea string, quitar espacios y normalizar
  if (MODO_DEPURACION) console.log(`State: Player = ${playerName}, Email = ${playerEmail}`);
}

export function setBoostActive(isActive, endTime = 0) {
  const now = Date.now();
  if (isActive && endTime > now) {
      if (!speedBoostActive) {
         if (MODO_DEPURACION) console.log(`State: boost ON hasta ${new Date(endTime).toLocaleTimeString()}`);
         _dispatchAnalytics('boostStart', { duration: endTime - now }); //
      }
      speedBoostActive = true;
      boostEndTime     = endTime;
  } else { // Si isActive es false, o endTime ya pasó
    if (speedBoostActive) { // Solo desactivar y loguear si estaba activo
        speedBoostActive = false;
        boostEndTime     = 0;
        if (MODO_DEPURACION) console.log('State: boost OFF');
        _dispatchAnalytics('boostEnd', {}); //
    }
  }
}

// NUEVO: Setters para el estado del Dash (si gameLoop lo gestiona)
export function setPlayerDashingState(isDashing, endTime = 0) {
    const now = Date.now();
    if (isDashing && endTime > now) {
        if (!playerDashing) {
            if (MODO_DEPURACION) console.log(`State: Player Dashing ON hasta ${new Date(endTime).toLocaleTimeString()}`);
            _dispatchAnalytics('dashStart', { duration: endTime - now });
        }
        playerDashing = true;
        dashEffectEndTime = endTime;
    } else {
        if (playerDashing) { // Solo desactivar y loguear si estaba activo
            playerDashing = false;
            dashEffectEndTime = 0;
            if (MODO_DEPURACION) console.log('State: Player Dashing OFF');
            _dispatchAnalytics('dashEnd', {});
        }
    }
}

// NUEVO: Setter para el estado del sonido
export function toggleSoundMuted() {
    soundMuted = !soundMuted;
    if (MODO_DEPURACION) console.log(`State: soundMuted = ${soundMuted}`);
    _guardarEnLocalStorage('cuboneonSoundMuted', soundMuted.toString());
    _dispatchAnalytics('soundToggle', { muted: soundMuted });
    return soundMuted; // Devolver el nuevo estado
}

/* ---------- Bonus permanentes y modo ilimitado ---------- */
export const getPermanentSpeedBonus = () => permanentSpeedBonus;
export const getJumpVelocityBonus  = () => jumpVelocityBonus;
export const getObstacleRateModifier = () => obstacleRateModifier;
export const isUnlimitedMode = () => unlimitedMode;

export function incrementPermanentSpeedBonus(amount = GREEN_SPEED_INCREMENT) {
    permanentSpeedBonus += amount;
}

export function incrementJumpVelocityBonus(amount = BLUE_JUMP_INCREMENT) {
    jumpVelocityBonus += amount;
}

export function enableUnlimitedMode() {
    unlimitedMode = true;
    obstacleRateModifier = WHITE_OBSTACLE_RATE_MOD;
}

export function resetBonuses() {
    permanentSpeedBonus = 0;
    jumpVelocityBonus = 0;
    unlimitedMode = false;
    obstacleRateModifier = 1;
}


/* ---------- Inicialización Completa del Estado ---------- */
export function initializeState(initialTime) {
  setGameRunning(false); // Esto también setea gamePaused a false
  setScore(0);
  setCombo(0);
  setGameTime(initialTime);
  setLevel(0);
  resetCoinCount();
  resetAllPowerUps();
  setBoostActive(false);
  setPlayerDashingState(false); // Resetear estado del Dash
  resetBonuses();

  // Cargar preferencia de sonido desde localStorage al inicializar (opcional)
  const storedMuteState = _leerDeLocalStorage('cuboneonSoundMuted');
  if (storedMuteState !== null) {
      soundMuted = (storedMuteState === 'true');
  } else {
      soundMuted = false; // Default a no muteado si hay error o no existe
  }
  if (MODO_DEPURACION) console.log(`State: Estado inicializado para nueva partida. Sonido muteado: ${soundMuted}`);
}
