// Módulo: utils.js
// Descripción: Contiene funciones auxiliares generales reutilizables en el juego.

/**
 * Detecta si el agente de usuario corresponde a un dispositivo móvil común.
 * @returns {boolean} True si parece ser móvil, false en caso contrario.
 */
export function isMobileDevice() {
    // Esta expresión regular cubre la mayoría de los navegadores móviles.
    // Se pueden añadir más agentes de usuario si es necesario, pero esta es una buena base.
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Muestra u oculta un elemento añadiendo o quitando una clase CSS ('screen--hidden').
 * @param {HTMLElement | null} element - El elemento del DOM a modificar.
 * @param {boolean} isVisible - True para mostrar (quitar clase), false para ocultar (añadir clase).
 */
export function setElementVisibility(element, isVisible) {
    if (!element) {
        // console.warn("setElementVisibility: el elemento proporcionado es null o undefined.");
        return; // Salir si el elemento no existe o es null
    }

    const HIDDEN_CLASS = 'screen--hidden'; // Nombre de la clase CSS para ocultar

    if (isVisible) {
        element.classList.remove(HIDDEN_CLASS);
        // Considerar accesibilidad: si se muestra, aria-hidden debe ser false.
        // Esto se maneja a menudo en el módulo de UI donde se tiene más contexto.
    } else {
        element.classList.add(HIDDEN_CLASS);
        // Considerar accesibilidad: si se oculta, aria-hidden debe ser true.
    }
}

/**
 * Escapa caracteres HTML básicos ('<', '>', '&', '"', "'") para prevenir XSS simple al insertar texto en el DOM.
 * Es importante usar esto siempre que se inserte contenido dinámico que podría provenir de fuentes no confiables
 * o que simplemente podría contener estos caracteres accidentalmente.
 * @param {string | number | null | undefined} str - La cadena de texto o número a escapar.
 * @returns {string} La cadena escapada, o una cadena vacía si la entrada es null/undefined.
 */
export function escapeHTML(str) {
    if (str === null || str === undefined) {
        return ''; // Manejar null/undefined explícitamente
    }
    // Convertir a string antes de reemplazar, por si la entrada es un número
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Genera un número entero aleatorio dentro de un rango (inclusivo).
 * @param {number} min - El valor mínimo del rango.
 * @param {number} max - El valor máximo del rango.
 * @returns {number} Un número entero aleatorio entre min y max.
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Limita un número a un rango específico.
 * @param {number} value - El valor a limitar.
 * @param {number} min - El límite inferior.
 * @param {number} max - El límite superior.
 * @returns {number} El valor limitado.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

// Nota: No incluimos aquí funciones más específicas como showFloatingText o updateUI,
// ya que pertenecen correctamente a un módulo de UI más específico ('uiManager.js').