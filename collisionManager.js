// Módulo: collisionManager.js
// Descripción: Detecta colisiones y retorna un objeto 'changes' con sus efectos.
//              (Versión Final con manejo de invulnerabilidad del jugador)

// --- Importaciones ---
import { player, container } from './domRefs.js'; //
import { getObstacles, removeObstacles } from './obstacleManager.js'; //
import { getCoins, removeCoins } from './coinManager.js'; //
import { triggerCollectedEffect, isPlayerInvulnerable } from './playerController.js'; //
import { showFloatingText } from './uiManager.js'; //
import {
  OBSTACLE_HIT_PENALTY_S, //
  COIN_SCORE_MULTIPLIER, //
  HIT_EFFECT_DURATION_MS, //
  COIN_TYPES, //
  DASH_INVULNERABLE //
} from './config.js';
// import * as audioManager from './audioManager.js'; // Descomentar cuando exista
// import { SOUND_HIT_OBSTACLE_PATH, SOUND_COIN_GREEN_PATH, ... } from './config.js'; // Para sonidos

// --- Funciones Internas Auxiliares ---

/** Chequeo de colisión AABB con margen opcional */
function _checkCollision(r1, r2, margin = 0) {
  if (!r1 || !r2) return false;
  return (
    r1.left < r2.right + margin &&
    r1.right > r2.left - margin &&
    r1.top < r2.bottom + margin &&
    r1.bottom > r2.top - margin
  );
}

/** Aplica solo los efectos VISUALES de chocar con obstáculo */
function _handleObstacleHitVisuals(obstacleElement) {
    // console.log("Colisión con obstáculo detectada!"); // Log opcional
    container?.classList.add('hit', 'shake'); //
    setTimeout(() => { container?.classList.remove('hit', 'shake'); }, HIT_EFFECT_DURATION_MS); //
    try {
        const rect = obstacleElement.getBoundingClientRect();
        const containerRect = container?.getBoundingClientRect(); //
        if (containerRect) {
            showFloatingText( //
                rect.left - containerRect.left + rect.width / 2,
                rect.top - containerRect.top - 10,
                `-${OBSTACLE_HIT_PENALTY_S}s`, //
                false // isPositive = false
            );
        }
    } catch (e) { console.error("Error mostrando texto flotante (hit):", e); }
}

/** Aplica solo los efectos VISUALES de recoger una moneda */
function _handleCoinCollectVisuals(coinElement, coinData) {
    // console.log(`Moneda recogida: ${coinData.type}`); // Log opcional
    triggerCollectedEffect(); //
    try {
        const rect = coinElement.getBoundingClientRect();
        const containerRect = container?.getBoundingClientRect(); //
        if (containerRect) {
             showFloatingText( //
                rect.left - containerRect.left + rect.width / 2,
                rect.top - containerRect.top - 10,
                `+${coinData.bonus}s`,
                true // isPositive = true
            );
        }
    } catch (e) { console.error("Error mostrando texto flotante (coin):", e); }
}

// --- Función Pública Principal ---

/**
 * Revisa colisiones jugador vs obstáculos y jugador vs monedas.
 * Retorna un objeto 'changes' con los efectos detectados para que gameLoop los aplique.
 * @param {number} currentCombo - Combo actual (ya no es estrictamente necesario si el score se calcula en gameLoop).
 * @returns {object} Objeto 'changes'.
 */
export function checkAllCollisions(currentCombo) {
  if (!player) return {}; //

  const playerRect = player.getBoundingClientRect(); //
  const currentObstacles = getObstacles(); //
  const currentCoins = getCoins(); //

  const changes = {
    scoreIncrements: [],
    timeDelta: 0,
    comboDelta: 0,
    boostActivate: false,
    coinsCollectedData: [],
    obstacleHit: false // Para que gameLoop sepa si hubo un golpe real
  };

  const obstaclesToRemove = [];
  const coinsToRemove = [];
  const playerIsCurrentlyInvulnerable = isPlayerInvulnerable(); //

  // 1. Colisiones con Obstáculos
  for (const obs of currentObstacles) {
    if (!obs.element?.isConnected) continue;

    const obstacleRect = obs.element.getBoundingClientRect();
    if (_checkCollision(playerRect, obstacleRect, -10)) { // Margen negativo para colisión más precisa
      if (playerIsCurrentlyInvulnerable) {
        if (DASH_INVULNERABLE) { // Si el Dash configurado destruye obstáculos
            // console.log("Obstáculo evadido/destruido por invulnerabilidad (Dash)!");
            // audioManager.playSound('dashDestroyObstacle'); // Sonido específico
            obs.element.remove();
            obstaclesToRemove.push(obs.element);
            // Opcional: Dar puntos por destruir obstáculos con Dash
            // changes.scoreIncrements.push({ basePoints: POINTS_FOR_DASH_DESTROY, forCombo: false });
        }
        // Si DASH_INVULNERABLE es false pero el jugador es invulnerable por otra razón (si se implementa),
        // la colisión simplemente se ignoraría sin destruir el obstáculo ni penalizar.
      } else {
        // Colisión normal con obstáculo
        // audioManager.playSound(SOUND_HIT_OBSTACLE_PATH);
        _handleObstacleHitVisuals(obs.element);
        changes.timeDelta -= OBSTACLE_HIT_PENALTY_S; //
        changes.comboDelta = 'reset';
        changes.obstacleHit = true;
        obs.element.remove();
        obstaclesToRemove.push(obs.element);
      }
    }
  }

  // 2. Colisiones con Monedas
  // Solo recoger monedas si no hubo un golpe que resetee el combo en el mismo frame.
  // Se podrían recoger monedas incluso siendo invulnerable por Dash.
  if (changes.comboDelta !== 'reset') {
    for (const coin of currentCoins) {
      if (!coin.element?.isConnected) continue;

      const coinRect = coin.element.getBoundingClientRect();
      if (_checkCollision(playerRect, coinRect, 5)) { // Margen positivo para facilitar recolección
        // Determinar el nombre del sonido de la moneda basado en coin.type
        // let coinSoundName = `coin${coin.type.charAt(0).toUpperCase() + coin.type.slice(1)}`; // ej: coinGreen, coinBlue
        // if(coin.type === COIN_TYPES.YELLOW) coinSoundName = 'coinYellow'; // Casos especiales si nombres no coinciden
        // else if(coin.type === COIN_TYPES.VIOLET) coinSoundName = 'coinViolet';
        // else if(coin.type === COIN_TYPES.WHITE) coinSoundName = 'coinWhite';
        // audioManager.playSound(coinSoundName);

        _handleCoinCollectVisuals(coin.element, coin);
        
        changes.timeDelta += coin.bonus;
        changes.comboDelta += 1;
        changes.scoreIncrements.push({ basePoints: COIN_SCORE_MULTIPLIER }); //
        changes.coinsCollectedData.push({ type: coin.type, bonus: coin.bonus });

        // La lógica de boost temporal por moneda azul/amarilla se mantiene aquí por ahora.
        // Podría ser un efecto adicional al power-up que otorgan.
        if (coin.type === COIN_TYPES.BLUE || coin.type === COIN_TYPES.YELLOW) { //
           changes.boostActivate = true;
        }

        coin.element.remove();
        coinsToRemove.push(coin.element);
      }
    }
  }

  // 3. Limpieza de arrays en sus respectivos managers
  if (obstaclesToRemove.length > 0) removeObstacles(obstaclesToRemove); //
  if (coinsToRemove.length > 0) removeCoins(coinsToRemove); //

  return changes;
}