// Módulo: uiManager.js
// Descripción: Gestiona las interacciones y actualizaciones de la interfaz de usuario (UI).
//              (Versión Final con HUD de Power-Ups y control visual de sonido)

// Importar referencias a elementos del DOM
import * as dom from './domRefs.js'; //
// Importar funciones auxiliares
import { setElementVisibility, isMobileDevice } from './utils.js'; //
// Importar constantes necesarias
import { WELCOME_TRANSITION_DURATION_MS, FLOATING_TEXT_DURATION_MS, COIN_TYPES } from './config.js'; //

// Variable interna para el debounce del ajuste de contenedor
let resizeTimeout = null;

/**
 * Muestra una pantalla específica y oculta las demás.
 * @param {HTMLElement | null} screenToShow - El elemento de la pantalla a mostrar, o null para ocultar todas.
 */
export function showScreen(screenToShow) {
    [
        dom.welcomeScreen, dom.emailScreen, dom.registerScreen, //
        dom.startScreen, dom.rankingDisplayScreen //
    ].forEach(screen => {
        if (screen) {
            setElementVisibility(screen, false); //
        }
    });
    if (screenToShow) {
        setElementVisibility(screenToShow, true); //
    }
}

/** Abre el modal de Términos y Condiciones. */
export function openTermsModal() {
    if (dom.termsModal) { //
        dom.termsModal.style.display = "block"; //
        dom.termsModal.setAttribute('aria-hidden', 'false'); //
        dom.acceptTermsBtn?.focus(); //
    }
}

/** Cierra el modal de Términos y Condiciones. */
export function closeTermsModal() {
    if (dom.termsModal) { //
        dom.termsModal.style.display = "none"; //
        dom.termsModal.setAttribute('aria-hidden', 'true'); //
        dom.openTermsBtn?.focus(); //
    }
}

/** Marca el checkbox de términos como aceptado y cierra el modal. */
export function acceptTerms() {
    if (dom.termsCheckbox) { //
        dom.termsCheckbox.checked = true; //
        dom.termsCheckbox.dispatchEvent(new Event('change')); //
    }
    closeTermsModal();
}

/**
 * Maneja el envío del formulario de correo inicial. Valida y devuelve el email.
 * @param {Event} e - El objeto evento del formulario.
 * @returns {string | null} El email validado en minúsculas, o null si la validación falla.
 */
export function handleEmailSubmit(e) {
    e.preventDefault();
    if (!dom.initialEmailInput || !dom.playerEmailInput) return null; //

    const email = dom.initialEmailInput.value.trim().toLowerCase(); //

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        alert("Por favor, ingresa un correo electrónico válido.");
        dom.initialEmailInput.focus(); //
        return null;
    }

    dom.playerEmailInput.value = email; //
    dom.playerEmailInput.readOnly = true; //

    showScreen(dom.registerScreen); //
    dom.playerNameInput?.focus(); //

    return email;
}

/**
 * Maneja el envío del formulario de registro. Valida y devuelve el nombre.
 * @param {Event} e - El objeto evento del formulario.
 * @returns {string | null} El nombre validado y truncado, o null si la validación falla.
 */
export function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!dom.playerNameInput || !dom.playerEmailInput || !dom.termsCheckbox) return null; //

    const name = dom.playerNameInput.value.trim(); //

    if (!name) {
        alert("Por favor, ingresa tu nombre de jugador.");
        dom.playerNameInput.focus(); //
        return null;
    }
    if (!dom.termsCheckbox.checked) { //
        alert("Debes aceptar los términos y condiciones para continuar.");
        dom.termsCheckbox.focus(); //
        return null;
    }
    if (!dom.playerEmailInput.value) { //
        alert("Error con el correo. Por favor, vuelve a la pantalla inicial e inténtalo de nuevo.");
        showScreen(dom.emailScreen); //
        dom.initialEmailInput?.focus(); //
        return null;
    }

    // El truncado del nombre se puede hacer aquí o en main.js antes de setPlayerInfo
    // const finalName = name.substring(0, RANKING_MAX_NAME_LENGTH); // Requiere RANKING_MAX_NAME_LENGTH de config.js
    showScreen(dom.startScreen); //
    dom.startButton?.focus(); //

    return name; // Devolver nombre validado (el truncado se hará en main.js o apiHandler)
}

/**
 * Actualiza los elementos de la UI con el estado actual del juego.
 * @param {number} score - Puntuación actual.
 * @param {number} gameTime - Tiempo restante.
 * @param {number} combo - Combo actual.
 */
export function updateUI(score, gameTime, combo) {
    if (dom.scoreEl) dom.scoreEl.textContent = score; //
    if (dom.timerEl) dom.timerEl.textContent = gameTime.toFixed(1); //
    if (dom.comboEl) dom.comboEl.textContent = `Combo: ${combo}`; //
}

/**
 * Muestra un texto flotante (+/-) en una posición específica.
 * @param {number} x - Coordenada X relativa al contenedor del juego.
 * @param {number} y - Coordenada Y relativa al contenedor del juego (desde arriba).
 * @param {string} text - El texto a mostrar (ej: "+1s", "-5").
 * @param {boolean} isPositive - True para estilo 'plus', false para estilo 'minus'.
 */
export function showFloatingText(x, y, text, isPositive) {
    if (!dom.container) return; //
    const el = document.createElement('div');
    el.className = `floating-text ${isPositive ? 'plus' : 'minus'}`;
    el.textContent = text;

    const textWidthEstimate = text.length * (parseFloat(getComputedStyle(el).fontSize) * 0.6); // Estimación más dinámica
    el.style.left = `${x - textWidthEstimate / 2}px`;
    el.style.top = `${y}px`;

    dom.container.appendChild(el); //
    setTimeout(() => { el?.remove(); }, FLOATING_TEXT_DURATION_MS); //
}


/**
 * NUEVO: Actualiza la visualización del HUD de Power-Ups.
 * @param {object} currentPowerUpsState - El objeto con el estado actual de los power-ups desde state.js.
 */
export function updatePowerUpHUD(currentPowerUpsState) {
    if (!dom.powerUpHud) return; //

    const dashAvailable = currentPowerUpsState[COIN_TYPES.VIOLET]?.count > 0; //
    const djAvailable = currentPowerUpsState[COIN_TYPES.YELLOW]?.count > 0; //
    const airComboAvailable = currentPowerUpsState[COIN_TYPES.WHITE]?.count > 0; //

    if (dom.hudDashIcon) dom.hudDashIcon.classList.toggle('available', dashAvailable); //
    if (dom.hudDjIcon) dom.hudDjIcon.classList.toggle('available', djAvailable); //
    if (dom.hudBlancoIcon) dom.hudBlancoIcon.classList.toggle('available', airComboAvailable); //

    // Opcional: Mostrar contador si los power-ups pueden acumularse > 1
    // if (dom.hudDashIcon && currentPowerUpsState[COIN_TYPES.VIOLET]) dom.hudDashIcon.setAttribute('data-count', currentPowerUpsState[COIN_TYPES.VIOLET].count);
}

/**
 * NUEVO: Actualiza el icono/texto del botón de sonido.
 * @param {boolean} isMuted - True si el sonido está actualmente silenciado.
 */
export function updateSoundButtonVisuals(isMuted) {
    if (dom.soundToggleBtn) { //
        dom.soundToggleBtn.textContent = isMuted ? '🔇' : '🔊'; //
        dom.soundToggleBtn.setAttribute('title', isMuted ? 'Activar Sonido' : 'Desactivar Sonido'); //
    }
}


/**
 * Ajusta elementos de UI basados en tamaño/orientación, principalmente el mensaje de orientación.
 */
export function adjustGameContainer() {
    const esRetrato = window.innerHeight > window.innerWidth;
    const mostrarOrientacion = isMobileDevice() && esRetrato;
    setElementVisibility(dom.orientationMessage, mostrarOrientacion);
    if (dom.orientationMessage) {
        dom.orientationMessage.setAttribute('aria-hidden', String(!mostrarOrientacion));
    }
    setElementVisibility(dom.mobileInstructions, isMobileDevice());
}

/**
 * Versión "debounced" de adjustGameContainer para evitar llamadas excesivas en resize/orientationchange.
 */
export function debouncedAdjustGameContainer() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(adjustGameContainer, 150);
}
