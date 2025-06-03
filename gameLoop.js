// Módulo: gameLoop.js
// Descripción: Orquesta el bucle principal del juego.
//              (Versión Final con Puntos por Esquivar, HUD, Sonido Integrado)

/* ---------- IMPORTACIONES ---------- */
import {
    INITIAL_TIME_S, BASE_SPEED, MAX_TIME_CAP_S,
    LEVEL_RULES, COIN_TYPES, COIN_BONUSES,
    LEVEL_SPEED_MULTIPLIERS,
    SPEED_MULTIPLIER_COMBO3, SPEED_MULTIPLIER_COMBO6,
    SPEED_BOOST_MULTIPLIER, SPEED_BOOST_DURATION_S,
    COIN_SCORE_MULTIPLIER, POINTS_PER_OBSTACLE_DODGED, // << NUEVO: POINTS_PER_OBSTACLE_DODGED
    DASH_SPEED_BONUS // << NUEVO: Para el efecto del dash en la velocidad
  } from './config.js'; //
  
  import { container } from './domRefs.js'; //
  import * as state from './state.js'; //
  import * as uiManager from './uiManager.js'; //
  import * as playerController from './playerController.js'; //
  import * as obstacleManager from './obstacleManager.js'; //
  import * as coinManager from './coinManager.js'; //
  import * as collisionManager from './collisionManager.js'; //
  import { submitScoreAndDisplayRanking } from './apiHandler.js'; //
  // import * as audioManager from './audioManager.js';
  // import { SOUND_LEVEL_UP_PATH, SOUND_GAME_OVER_PATH } from './config.js'; //
  
  /* ---------- ESTADO INTERNO DEL MÓDULO ---------- */
  let currentSpeed = BASE_SPEED; //
  let lastTimestamp = 0;
  let gameLoopId = null;
  let obstaclesDodgedSinceLastHit = 0; // NUEVO: Para contar obstáculos esquivados
  
  /* ===========================================================
     ==============   FUNCIONES EXPORTADAS   ====================
     =========================================================== */
  
  export function startGame() {
    if (state.isGameEffectivelyRunning()) return; //
    console.log("GameLoop: Iniciando juego...");
    state.initializeState(INITIAL_TIME_S); //
    state.setGameRunning(true); //
    lastTimestamp = 0;
    currentSpeed = BASE_SPEED; //
    obstaclesDodgedSinceLastHit = 0; // Resetear contador de esquivados
    playerController.initPlayerState(); //
    obstacleManager.initObstacleManager(); //
    coinManager.initCoinManager(); //
    container?.querySelectorAll('.obstacle, .coin, .floating-text').forEach(el => el.remove()); //
    container?.classList.remove('hit', 'shake'); //
    _updateLevelStyle(state.getCurrentLevel()); //
    uiManager.updateUI(state.getScore(), state.getGameTime(), state.getCombo()); //
    uiManager.updatePowerUpHUD(state.getPowerUpsState()); // << NUEVO: Actualizar HUD al inicio
    _updateSpeed(Date.now());
    obstacleManager.scheduleNextObstacle(state.isGameRunning(), currentSpeed, state.getCombo()); //
    coinManager.scheduleNextCoin(state.isGameRunning()); //
    // audioManager.playGameMusic(); // Iniciar música del juego
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(_gameLoop);
    uiManager.showScreen(null); //
  }
  
  export function pauseGame() {
    if (!state.isGameEffectivelyRunning() || state.isPaused()) return; //
    state.setGamePaused(true); //
    obstacleManager.clearObstacleTimeout(); //
    coinManager.clearCoinTimeout(); //
    // audioManager.pauseMusic(); // Pausar música
    console.log("GameLoop: Juego pausado.");
  }
  
  export function resumeGame() {
    if (!state.isGameEffectivelyRunning() || !state.isPaused()) return; //
    state.setGamePaused(false); //
    lastTimestamp = 0;
    _updateSpeed(Date.now());
    obstacleManager.scheduleNextObstacle(state.isGameRunning(), currentSpeed, state.getCombo()); //
    coinManager.scheduleNextCoin(state.isGameRunning()); //
    // audioManager.resumeMusic(); // Reanudar música
    if (!gameLoopId) {
        gameLoopId = requestAnimationFrame(_gameLoop);
    }
    console.log("GameLoop: Juego reanudado.");
  }
  
  /* ===========================================================
     ===============   FUNCIONES INTERNAS   =====================
     =========================================================== */
  
  function _gameLoop(timestamp) {
    if (!state.isGameEffectivelyRunning()) { //
        gameLoopId = null; return;
    }
    if (lastTimestamp === 0) {
      lastTimestamp = timestamp; gameLoopId = requestAnimationFrame(_gameLoop); return;
    }
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
  
    if (state.isPaused()) { //
      gameLoopId = requestAnimationFrame(_gameLoop); return;
    }
  
    state.setGameTime(state.getGameTime() - deltaTime); //
    _updateSpeed(timestamp);
    playerController.updatePlayerPhysics(deltaTime); //
    _moveElements(obstacleManager.getObstacles(), deltaTime); //
    _moveElements(coinManager.getCoins(), deltaTime); //
    
    const {outOfBoundsObstacles} = _checkOutOfBounds(); // << MODIFICADO: obtener obstáculos que salieron
  
    const collisionResults = collisionManager.checkAllCollisions(state.getCombo()); //
    _applyCollisionResults(collisionResults);
  
    // NUEVO: Puntos por esquivar (si no hubo golpe en este frame)
    if (!collisionResults.obstacleHit && outOfBoundsObstacles.length > 0) {
        const pointsForDodge = outOfBoundsObstacles.length * POINTS_PER_OBSTACLE_DODGED; //
        state.incrementScore(pointsForDodge); //
        // console.log(`GameLoop: +${pointsForDodge} puntos por esquivar ${outOfBoundsObstacles.length} obstáculos.`); // Log opcional
    }
    if (collisionResults.obstacleHit) {
        obstaclesDodgedSinceLastHit = 0; // Resetear contador si hay golpe
    } else if (outOfBoundsObstacles.length > 0) {
        obstaclesDodgedSinceLastHit += outOfBoundsObstacles.length;
        // Podría haber un bonus de combo o algo por esquivar N seguidos.
    }
  
  
    uiManager.updateUI(state.getScore(), state.getGameTime(), state.getCombo()); //
    uiManager.updatePowerUpHUD(state.getPowerUpsState()); // << NUEVO: Actualizar HUD
  
    if (state.getGameTime() <= 0) { //
      _gameOver(); return;
    }
    gameLoopId = requestAnimationFrame(_gameLoop);
  }
  
  function _checkAndAdvanceLevel() {
      const currentLevel = state.getCurrentLevel(); //
      const currentRule = LEVEL_RULES.find(r => r.level === currentLevel); //
  
      if (!currentRule || !currentRule.advanceCoin || currentRule.coinsToAdvance === Infinity) { //
          return;
      }
  
      const requiredType = currentRule.advanceCoin; //
      const requiredAmount = currentRule.coinsToAdvance; //
  
      if (state.getCoinCount(requiredType) >= requiredAmount) { //
          const newLevel = currentLevel + 1;
          // audioManager.playSound(SOUND_LEVEL_UP_PATH);
          state.setLevel(newLevel); //
          state.resetCoinCount(requiredType); // Resetear SOLO el contador de la moneda usada para avanzar
          _updateLevelStyle(newLevel);
          console.log(`GameLoop: ¡Nivel Subido a ${newLevel}! Monedas ${requiredType} reseteadas.`);
      }
  }
  
  function _applyCollisionResults(r) {
      if (!r) return;
  
      if (r.timeDelta) {
        const newTime = Math.min(MAX_TIME_CAP_S, Math.max(0, state.getGameTime() + r.timeDelta)); //
        state.setGameTime(newTime); //
      }
      if (Array.isArray(r.scoreIncrements)) {
        r.scoreIncrements.forEach(s_inc => {
            // La puntuación por moneda ahora incluye el combo.
            const pointsFromCoin = s_inc.basePoints * Math.max(1, state.getCombo()); //
            state.incrementScore(pointsFromCoin); //
        });
      }
  
      if (r.coinsCollectedData && r.coinsCollectedData.length > 0) {
          r.coinsCollectedData.forEach(coin => {
              state.addCoin(coin.type); //
              // Otorgar Power-Up si la moneda recogida es del tipo correcto
              if (coin.type === COIN_TYPES.VIOLET) state.grantPowerUp(COIN_TYPES.VIOLET); //
              else if (coin.type === COIN_TYPES.YELLOW) state.grantPowerUp(COIN_TYPES.YELLOW); //
              else if (coin.type === COIN_TYPES.WHITE) state.grantPowerUp(COIN_TYPES.WHITE); //
              // Reproducir sonido de moneda específica
              // audioManager.playSound(`coin${coin.type.charAt(0).toUpperCase() + coin.type.slice(1)}`);
          });
          _checkAndAdvanceLevel();
      }
  
      if (r.comboDelta === 'reset') {
        console.log("GameLoop: Reseteando estado por golpe con obstáculo.");
        state.resetCombo(); //
        state.setBoostActive(false); //
        state.resetCoinCount(); // << NUEVO: Reiniciar todas las monedas recogidas
        state.setLevel(0); //
        state.resetAllPowerUps(); //
        obstaclesDodgedSinceLastHit = 0; // Resetear contador de esquivados
        _updateLevelStyle(0);
      } else if (typeof r.comboDelta === 'number' && r.comboDelta > 0) {
        for (let i = 0; i < r.comboDelta; i++) state.incrementCombo(); //
      }
  
      if (r.boostActivate) {
        const end = Date.now() + SPEED_BOOST_DURATION_S * 1000; //
        state.setBoostActive(true, end); //
      }
  }
  
  function _updateSpeed(now) {
    const endTime = state.getBoostEndTime(); //
    if (state.isBoostActive() && now >= endTime) { //
        state.setBoostActive(false); //
    }
    // NUEVO: Considerar si el jugador está en Dash para la velocidad
    if (state.isPlayerDashing() && now >= state.getDashEffectEndTime()) { //
        state.setPlayerDashingState(false); //
    }
  
    const levelIndex = Math.min(state.getCurrentLevel(), LEVEL_SPEED_MULTIPLIERS.length - 1); //
    const levelMul = LEVEL_SPEED_MULTIPLIERS[levelIndex] ?? 1; //
    const comboMul = state.getCombo() >= 6 ? SPEED_MULTIPLIER_COMBO6 //
                     : state.getCombo() >= 3 ? SPEED_MULTIPLIER_COMBO3 : 1; //
    const boostMul = state.isBoostActive() ? SPEED_BOOST_MULTIPLIER : 1; //
    
    // Si el Dash es un aumento FIJO de velocidad (ej. +800px/s) en lugar de un multiplicador:
    const dashBonus = state.isPlayerDashing() ? DASH_SPEED_BONUS : 0; //
    currentSpeed = (BASE_SPEED * levelMul * comboMul * boostMul) + dashBonus; //
    // Si el Dash fuera un multiplicador, sería: * (state.isPlayerDashing() ? DASH_SPEED_MULTIPLIER_CONFIG : 1);
  }
  
  function _moveElements(elements, dt) {
    if (!elements || elements.length === 0) return;
    const dx = currentSpeed * dt;
    elements.forEach(item => {
      if (item.element?.isConnected) {
          const currentLeft = parseFloat(item.element.style.left || '0');
          item.element.style.left = `${currentLeft - dx}px`;
      }
    });
  }
  
  function _checkOutOfBounds() {
    const obstaclesToRemove = [];
    obstacleManager.getObstacles().forEach(obs => { //
        if (!obs.element?.isConnected) { obstaclesToRemove.push(obs.element); return; }
        const rect = obs.element.getBoundingClientRect();
        if (rect.right < 0) {
            obs.element.remove();
            obstaclesToRemove.push(obs.element);
        }
    });
    if (obstaclesToRemove.length > 0) obstacleManager.removeObstacles(obstaclesToRemove); //
  
    const coinsToRemove = [];
    coinManager.getCoins().forEach(coin => { //
        if (!coin.element?.isConnected) { coinsToRemove.push(coin.element); return; }
        const rect = coin.element.getBoundingClientRect();
        if (rect.right < 0) {
            coin.element.remove();
            coinsToRemove.push(coin.element);
        }
    });
    if (coinsToRemove.length > 0) coinManager.removeCoins(coinsToRemove); //
  
    return { outOfBoundsObstacles: obstaclesToRemove }; // Devuelve los obstáculos que salieron para puntuar
  }
  
  function _updateLevelStyle(level) {
    if (!container) return; //
    for (let i = 0; i <= LEVEL_RULES.length; i++) { //
        container.classList.remove(`level-${i}`); //
    }
    container.classList.add(`level-${level}`); //
    // console.log(`GameLoop: Estilo visual actualizado a level-${level}`); // Log opcional
  }
  
  function _gameOver() {
    if (!state.isGameEffectivelyRunning()) return; //
    console.log("GameLoop: ¡Juego Terminado! Puntuación final:", state.getScore()); //
    // audioManager.stopAllMusic();
    // audioManager.playSound(SOUND_GAME_OVER_PATH);
    state.setGameRunning(false); //
    obstacleManager.clearObstacleTimeout(); //
    coinManager.clearCoinTimeout(); //
    if (gameLoopId) { cancelAnimationFrame(gameLoopId); gameLoopId = null; }
    submitScoreAndDisplayRanking(state.getPlayerName(), state.getPlayerEmail(), state.getScore()); //
  }