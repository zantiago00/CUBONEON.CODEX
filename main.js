// Módulo: main.js
// Descripción: Punto de entrada principal de CUBONEON ARENA.
//              (Versión Final con inicialización de audio y flujo de música)

// Log inicial para saber si el archivo se carga
// console.log("--- main.js: Archivo cargado y ejecutándose ---"); // Log opcional

// Importar referencias DOM
import * as dom from './domRefs.js'; //
// Importar gestores y módulos
import * as uiManager from './uiManager.js'; //
import * as inputManager from './inputManager.js'; //
import * as gameLoop from './gameLoop.js'; //
import * as state from './state.js'; //
import * as audioManager from './audioManager.js'; // << IMPORTADO
import { WELCOME_TRANSITION_DURATION_MS, RANKING_MAX_NAME_LENGTH } from './config.js'; //

/**
 * Función principal de inicialización.
 */
function initializeApp() {
    console.log("Main: Inicializando aplicación CUBONEON ARENA...");
    let currentEmail = ''; // Almacena el email entre pantallas

    // Inicializar módulos en orden de dependencia
    audioManager.initAudioManager(); // << INICIALIZAR AUDIO PRIMERO O TEMPRANO
    uiManager.adjustGameContainer(); //
    inputManager.initInputListeners(); //
    // gameLoop, state, etc., se inicializan cuando se llama a startGame o directamente

    // Mostrar pantalla de bienvenida y preparar UI inicial
    uiManager.showScreen(dom.welcomeScreen); //
    dom.welcomeStartBtn?.focus(); //
    audioManager.playMenuMusic(); // << INICIAR MÚSICA DE MENÚ
    if (dom.soundToggleBtn) { //
        uiManager.updateSoundButtonVisuals(state.isSoundMuted()); // Sincronizar botón con estado cargado
    }


    // --- Configurar Listeners de UI Específicos de Main ---
    dom.welcomeStartBtn?.addEventListener('click', () => { //
        audioManager.playSound('buttonClick');
        console.log("Main: Clic en welcomeStartBtn.");
        if (dom.welcomeScreen && dom.emailScreen) { //
            dom.welcomeScreen.classList.add('transition-out'); //
            setTimeout(() => {
                uiManager.showScreen(dom.emailScreen); //
                dom.welcomeScreen?.classList.remove('transition-out'); //
                dom.initialEmailInput?.focus(); //
            }, WELCOME_TRANSITION_DURATION_MS); //
        } else {
            uiManager.showScreen(dom.emailScreen); // Fallback
            dom.initialEmailInput?.focus(); //
        }
    });

    dom.emailForm?.addEventListener('submit', (e) => { //
        audioManager.playSound('buttonClick');
        const email = uiManager.handleEmailSubmit(e); //
        if (email) {
            currentEmail = email;
            console.log("Main: Email recibido:", currentEmail);
        }
    });

    dom.registerForm?.addEventListener('submit', (e) => { //
        audioManager.playSound('buttonClick');
        const name = uiManager.handleRegisterSubmit(e); //
        if (name && currentEmail) {
            const truncatedName = name.substring(0, RANKING_MAX_NAME_LENGTH); // Truncar nombre aquí
            state.setPlayerInfo(truncatedName, currentEmail); //
            // La transición a startScreen la hace handleRegisterSubmit
        } else {
            console.warn("Main: Registro fallido (nombre vacío o email perdido).");
            if (!currentEmail) {
                alert("Error: Email no encontrado. Por favor, regresa e ingresa tu email.");
                uiManager.showScreen(dom.emailScreen); //
            }
        }
    });

    dom.startButton?.addEventListener('click', () => { //
        audioManager.playSound('buttonClick');
        // Detener música de menú e iniciar música de juego (esto se hará en gameLoop.startGame)
        audioManager.stopAllMusic(); // Detener explícitamente aquí antes de que gameLoop inicie la otra
        gameLoop.startGame(); //
    });

    dom.restartButton?.addEventListener('click', () => { //
        audioManager.playSound('buttonClick');
        uiManager.showScreen(dom.startScreen); //
        dom.startButton?.focus(); //
        audioManager.playMenuMusic(); // Volver a la música de menú
    });

    dom.openTermsBtn?.addEventListener('click', (e) => { //
        e.preventDefault();
        audioManager.playSound('buttonClick');
        uiManager.openTermsModal(); //
    });
    dom.closeTermsBtn?.addEventListener('click', () => { //
        // No reproducir sonido de click aquí, ya que es un cierre, no una acción primaria
        uiManager.closeTermsModal(); //
    });
    dom.acceptTermsBtn?.addEventListener('click', () => { //
        audioManager.playSound('buttonClick');
        uiManager.acceptTerms(); //
    });
    dom.termsModal?.addEventListener('click', (e) => { //
        if (e.target === dom.termsModal) { //
            uiManager.closeTermsModal(); //
        }
    });

    // Listeners Globales Ventana
    window.addEventListener('resize', uiManager.debouncedAdjustGameContainer); //
    if (window.screen?.orientation) {
        try {
            window.screen.orientation.addEventListener('change', uiManager.debouncedAdjustGameContainer); //
        } catch (e) {
            window.addEventListener('orientationchange', uiManager.debouncedAdjustGameContainer); //
        }
    } else {
        window.addEventListener('orientationchange', uiManager.debouncedAdjustGameContainer); //
    }

    // Manejadores de errores globales (muy útiles para depuración)
    window.onerror = function(message, source, lineno, colno, error) {
        console.error("Error global no capturado:", { message, source, lineno, colno, error });
        // Aquí podrías enviar este error a un sistema de logging si tuvieras uno
    };
    window.onunhandledrejection = function(event) {
        console.error("Promesa rechazada no manejada:", event.reason);
    };

    console.log("Main: Aplicación inicializada y todos los listeners configurados.");
}

// --- Punto de Entrada ---
document.addEventListener('DOMContentLoaded', () => {
    // console.log("--- main.js: DOMContentLoaded disparado ---"); // Log opcional
    initializeApp();
});

// console.log("--- main.js: Fin del script alcanzado ---"); // Log opcional