// Módulo: playerController.js
// Descripción: Gestiona estado, física y acciones del jugador.
//              (Versión Final con Power-Ups: Dash, Doble Salto Consumible, Combo Aéreo)

// Importar referencias DOM
import { player } from './domRefs.js';
// Importar constantes desde config.js
import {
    GRAVITY_ACCEL, INITIAL_JUMP_VELOCITY, JUMP_COMBO_MULTIPLIER,
    DOUBLE_JUMP_VELOCITY_MULTIPLIER, GROUND_Y, JUMP_EFFECT_DURATION_MS,
    COLLECT_EFFECT_DURATION_MS,
    LEVEL_JUMP_MULTIPLIERS, // << IMPORTADO
    COIN_TYPES,             // << IMPORTADO
    DASH_DURATION_S,        // << IMPORTADO
    // DASH_SPEED_BONUS,    // << Se usará indirectamente a través del estado
    DASH_INVULNERABLE,      // << IMPORTADO
    AIR_COMBO_RESETS_DOUBLE_JUMP // << IMPORTADO
} from './config.js';
// Importar el módulo de estado completo
import * as state from './state.js';
// import * as audioManager from './audioManager.js'; // Descomentar cuando exista

// --- Estado Interno del Módulo ---
let playerY = 0;
let velocityY = 0;
let playerIsAirborne = false;
let doubleJumpAvailable = true; // Indica si el próximo salto en el aire puede ser un doble salto
let isDashing = false;          // << NUEVO: Flag para el estado de Dash

/** Inicializa o resetea el estado del jugador para una nueva partida. */
export function initPlayerState() {
    playerY = GROUND_Y;
    velocityY = 0;
    playerIsAirborne = false;
    doubleJumpAvailable = true; // Siempre disponible al tocar el suelo
    isDashing = false;          // << NUEVO: Resetear estado de Dash
    if (player) {
        player.style.bottom = `${playerY}px`;
        player.classList.remove('jumping', 'collected', 'dashing', 'air-combo-active'); // Limpiar todas las clases de estado
    }
}

/**
 * Actualiza la posición y velocidad vertical del jugador basado en la gravedad.
 * Se llama en cada frame del gameLoop.
 * Resetea la disponibilidad del doble salto al aterrizar.
 * @param {number} deltaTime - Tiempo transcurrido desde el último frame (en segundos).
 */
export function updatePlayerPhysics(deltaTime) {
    if (!player) return;
    if (isDashing) { // Si está en Dash, la física vertical podría comportarse diferente (ej. mantener altura)
        // Por ahora, el Dash no afecta la gravedad directamente aquí, solo la velocidad que maneja gameLoop
        // o podría tener una lógica de mantener Y, pero lo simplificaremos por ahora.
    }

    velocityY -= GRAVITY_ACCEL * deltaTime;
    playerY += velocityY * deltaTime;

    if (playerY <= GROUND_Y) {
        playerY = GROUND_Y;
        velocityY = 0;
        if (playerIsAirborne) {
             playerIsAirborne = false;
             doubleJumpAvailable = true; // Doble salto se resetea al tocar el suelo
        }
    }
    player.style.bottom = `${playerY}px`;
}

/**
 * Inicia un salto normal, un doble salto (si el power-up está disponible),
 * o maneja la activación de otros power-ups si están disponibles y se presionan
 * las teclas correspondientes (manejado en inputManager).
 * @param {boolean} isGameRunning - Si el juego está activo.
 */
export function jump(isGameRunning) { // currentCombo se leerá de state.js
    const currentLevel = state.getCurrentLevel();
    const currentCombo = state.getCombo();
    const onGround = playerY <= GROUND_Y + 1; // Pequeño margen por si acaso

    if (!isGameRunning || !player || isDashing) { // No saltar si está en Dash
        return;
    }

    const levelIndex = Math.min(currentLevel, LEVEL_JUMP_MULTIPLIERS.length - 1);
    const levelJumpMultiplier = LEVEL_JUMP_MULTIPLIERS[levelIndex] ?? 1.0;
    const baseJumpVelocity = INITIAL_JUMP_VELOCITY * levelJumpMultiplier;
    const comboJumpMultiplier = (currentCombo >= 3) ? JUMP_COMBO_MULTIPLIER : 1;
    const currentJumpVelocity = baseJumpVelocity * comboJumpMultiplier;

    if (!playerIsAirborne && onGround) { // Salto Normal
        // audioManager.playSound(config.SOUND_JUMP_PATH);
        playerIsAirborne = true;
        // doubleJumpAvailable ya es true por estar en el suelo
        velocityY = currentJumpVelocity;
        player.classList.add('jumping');
        setTimeout(() => { player?.classList.remove('jumping'); }, JUMP_EFFECT_DURATION_MS);
    } else if (playerIsAirborne && doubleJumpAvailable && state.hasPowerUp(COIN_TYPES.YELLOW)) { // Doble Salto (Power-Up)
        // audioManager.playSound(config.SOUND_DOUBLE_JUMP_PATH);
        velocityY = currentJumpVelocity * DOUBLE_JUMP_VELOCITY_MULTIPLIER;
        state.consumePowerUp(COIN_TYPES.YELLOW);
        doubleJumpAvailable = false; // Se consumió el doble salto (power-up) o el único permitido en aire
        player.classList.remove('jumping'); // Quitar y re-aplicar para reiniciar animación si es necesario
        player.classList.add('jumping');
        setTimeout(() => { player?.classList.remove('jumping'); }, JUMP_EFFECT_DURATION_MS);
    }
}

/** Activa el Power-Up de Dash. */
export function activateDash() {
    if (isDashing || !state.isGameRunning() || !state.hasPowerUp(COIN_TYPES.VIOLET)) return;

    // audioManager.playSound(config.SOUND_DASH_PATH);
    state.consumePowerUp(COIN_TYPES.VIOLET);
    isDashing = true;
    const dashEndTime = Date.now() + DASH_DURATION_S * 1000;
    state.setPlayerDashingState(true, dashEndTime); // Informar a state.js para que gameLoop pueda ajustar la velocidad

    player?.classList.add('dashing');
    console.log("PlayerController: Dash activado!");

    setTimeout(() => {
        isDashing = false;
        state.setPlayerDashingState(false); // Informar a state.js
        player?.classList.remove('dashing');
        console.log("PlayerController: Dash finalizado.");
    }, DASH_DURATION_S * 1000);
}

/** Activa el Power-Up de Combo Aéreo (ej: resetea doble salto). */
export function activateAirCombo() {
    if (!playerIsAirborne || !state.isGameRunning() || !state.hasPowerUp(COIN_TYPES.WHITE)) return;

    // audioManager.playSound(config.SOUND_AIR_COMBO_PATH);
    state.consumePowerUp(COIN_TYPES.WHITE);

    if (AIR_COMBO_RESETS_DOUBLE_JUMP) {
        doubleJumpAvailable = true; // Permite otro doble salto o el primero si ya se gastó el normal
        console.log("PlayerController: Combo Aéreo activado (doble salto reseteado/disponible).");
    }
    // Aquí iría otra lógica si el combo aéreo hace algo más.

    player?.classList.add('air-combo-active');
    setTimeout(() => player?.classList.remove('air-combo-active'), 300); // Efecto visual corto
}


/** Devuelve la posición Y actual del jugador (px desde abajo). */
export function getPlayerY() {
    return playerY;
}

/** Devuelve si el jugador está actualmente en el aire. */
export function isPlayerAirborneState() {
    return playerIsAirborne;
}

/** Devuelve si el jugador está actualmente en un dash. */
export function isPlayerDashingState() {
    return isDashing;
}

/** Devuelve si el jugador es invulnerable (ej. durante el dash). */
export function isPlayerInvulnerable() {
    // Solo es invulnerable si está en dash Y la configuración lo permite
    return isDashing && DASH_INVULNERABLE;
}

/** Activa el efecto visual temporal de recoger moneda. */
export function triggerCollectedEffect() {
    if(player) {
        player.classList.add('collected');
        setTimeout(() => player?.classList.remove('collected'), COLLECT_EFFECT_DURATION_MS);
    }
}