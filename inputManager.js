// Módulo: inputManager.js
// Descripción: Configura y maneja los event listeners.
//              (Versión Final con activación de Power-Ups y Sonido integrado)

// Importar referencias DOM
import * as dom from './domRefs.js'; //
// Importar funciones/estado de otros módulos
import * as playerController from './playerController.js'; //
import * as gameLoop from './gameLoop.js'; //
import * as uiManager from './uiManager.js'; //
import * as state from './state.js'; //
import * as audioManager from './audioManager.js'; // << DESCOMENTADO E IMPORTADO
// Importar utilidades
import { isMobileDevice } from './utils.js'; //
import { COIN_TYPES, SOUND_BUTTON_CLICK_PATH } from './config.js'; // << Añadido SOUND_BUTTON_CLICK_PATH

// Variable interna para rastrear si la pausa fue por cambio de foco/visibilidad
let gamePausedByBlur = false;

/**
 * Configura todos los event listeners necesarios para el juego.
 */
export function initInputListeners() {
    console.log("InputManager: Configurando listeners...");

    // --- Listeners de Teclado ---
    document.addEventListener('keydown', (e) => {
        const gameIsRunning = state.isGameRunning(); //
        const gameIsEffectivelyRunning = state.isGameEffectivelyRunning(); //
        const gameIsPaused = state.isPaused(); //

        // Saltar con Espacio durante el juego
        if (gameIsRunning && (e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) {
            e.preventDefault();
            playerController.jump(gameIsRunning); //
        }
        // Activar Dash con tecla 'D'
        else if (gameIsRunning && (e.code === 'KeyD' || e.key === 'd')) {
            e.preventDefault();
            if (state.hasPowerUp(COIN_TYPES.VIOLET)) { //
                playerController.activateDash(); //
            }
        }
        // Activar Combo Aéreo con tecla 'C' (ejemplo)
        else if (gameIsRunning && playerController.isPlayerAirborneState() && (e.code === 'KeyC' || e.key === 'c')) { //
            e.preventDefault();
            if (state.hasPowerUp(COIN_TYPES.WHITE)) { //
                playerController.activateAirCombo(); //
            }
        }
        // Iniciar juego con Enter/Espacio desde StartScreen
        else if (!gameIsEffectivelyRunning && dom.startScreen && !dom.startScreen.classList.contains('screen--hidden') && (e.key === 'Enter' || e.keyCode === 13 || e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) { //
            e.preventDefault();
            audioManager.playSound('buttonClick'); // << LLAMADA A AUDIOMANAGER
            console.log("InputManager: Tecla Start/Enter detectada en StartScreen.");
            gameLoop.startGame(); //
        }
        // Reiniciar juego con Enter/Espacio desde RankingScreen
        else if (!gameIsEffectivelyRunning && dom.rankingDisplayScreen && !dom.rankingDisplayScreen.classList.contains('screen--hidden') && (e.key === 'Enter' || e.keyCode === 13 || e.code === 'Space' || e.key === ' ' || e.keyCode === 32)) { //
            e.preventDefault();
            audioManager.playSound('buttonClick'); // << LLAMADA A AUDIOMANAGER
            console.log("InputManager: Tecla Start/Enter detectada en RankingScreen.");
            dom.restartButton?.click(); //
        }
        // Aceptar términos con Enter
        else if (dom.termsModal && dom.termsModal.style.display === 'block' && document.activeElement === dom.acceptTermsBtn && (e.key === 'Enter' || e.keyCode === 13)) { //
             e.preventDefault();
             audioManager.playSound('buttonClick'); // << LLAMADA A AUDIOMANAGER
             uiManager.acceptTerms(); //
        }
         // Cerrar modal con Escape
        else if (dom.termsModal && dom.termsModal.style.display === 'block' && (e.key === 'Escape' || e.keyCode === 27)) { //
             uiManager.closeTermsModal(); //
        }
        // Pausa con 'P'
        else if (gameIsEffectivelyRunning && (e.code === 'KeyP' || e.key === 'p')) {
            e.preventDefault();
            if (gameIsPaused) { gameLoop.resumeGame(); } //
            else { gameLoop.pauseGame(); } //
        }
        // Mute/Unmute con tecla 'M'
        else if (e.code === 'KeyM' || e.key === 'm') {
            e.preventDefault();
            const muted = audioManager.toggleMute(); // << LLAMADA A AUDIOMANAGER
            uiManager.updateSoundButtonVisuals(muted); // << LLAMADA A UIMANAGER
            console.log(`InputManager: Sonido ${muted ? 'desactivado' : 'activado'} con tecla M.`);
        }
    });

    // --- Listeners Táctiles ---
    // (Sin cambios respecto a la versión anterior que te di, sigue siendo relevante)
    dom.container?.addEventListener('touchstart', (e) => { //
        const gameIsRunning = state.isGameRunning(); //
        if (gameIsRunning && !e.target.closest('button, a, input, .modal, #powerup-hud .hud-icon')) {
            playerController.jump(gameIsRunning); //
        }
    }, { passive: true });

    if (isMobileDevice()) { //
        document.body.addEventListener('touchmove', (e) => {
            if (state.isGameRunning()) { //
                e.preventDefault();
            }
        }, { passive: false });
    }

    // --- Listeners de Ventana (Foco, Visibilidad) ---
    // (Sin cambios respecto a la versión anterior que te di, siguen siendo relevantes)
    window.addEventListener('blur', () => {
        if (state.isGameRunning()) { //
            gamePausedByBlur = true;
            gameLoop.pauseGame(); //
        }
    });
    window.addEventListener('focus', () => {
         if (gamePausedByBlur && state.isGameEffectivelyRunning() && !state.isPaused()) { //
            gamePausedByBlur = false;
            gameLoop.resumeGame(); //
         } else if (gamePausedByBlur && !state.isGameEffectivelyRunning()) { //
            gamePausedByBlur = false;
         }
    });
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            if (state.isGameRunning()) { //
                 gamePausedByBlur = true;
                 gameLoop.pauseGame(); //
            }
        } else {
             if (gamePausedByBlur && state.isGameEffectivelyRunning() && !state.isPaused()) { //
                 gamePausedByBlur = false;
                 gameLoop.resumeGame(); //
             } else if (gamePausedByBlur && !state.isGameEffectivelyRunning()) { //
                gamePausedByBlur = false;
             }
        }
    });

    // --- Listener para el Botón de Sonido INTEGRADO ---
    dom.soundToggleBtn?.addEventListener('click', () => { //
        audioManager.playSound('buttonClick'); // << LLAMADA A AUDIOMANAGER
        const muted = audioManager.toggleMute(); // << LLAMADA A AUDIOMANAGER
        uiManager.updateSoundButtonVisuals(muted); // << LLAMADA A UIMANAGER
        console.log(`InputManager: Sonido ${muted ? 'desactivado' : 'activado'} con botón.`);
    });

    console.log("InputManager: Listeners configurados.");
}