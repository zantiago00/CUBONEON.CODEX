// Módulo: apiHandler.js
// Descripción: Gestiona la comunicación con la API externa para el ranking.
//              (Versión Final con envío por POST y manejo básico de intentos)

// Importar constantes necesarias
import { RANKING_URL, RANKING_MAX_NAME_LENGTH, RANKING_TOP_N } from './config.js'; //
// Importar referencias DOM necesarias
import { rankingDiv, finalScoreTextEl, rankingDisplayScreen, restartButton } from './domRefs.js'; //
// Importar funciones de UI necesarias
import { showScreen } from './uiManager.js'; //
// Importar utilidades necesarias
import { escapeHTML } from './utils.js'; //

/**
 * Función interna para mostrar el ranking o mensajes de error en el div correspondiente.
 * @param {Array|null} data - Los datos del ranking (array de objetos) o null si hubo error de fetch.
 * @param {string|null} apiMessage - Mensaje adicional de la API (ej. sobre intentos).
 * @param {Error|null} sendErr - Error ocurrido durante el envío de la puntuación (si hubo).
 * @param {Error|null} fetchErr - Error ocurrido durante la obtención del ranking (si hubo).
 * @private
 */
function _displayRanking(data, apiMessage, sendErr, fetchErr) {
    if (!rankingDiv) return; //

    let htmlContent = "";

    // Mostrar mensaje de la API si existe (ej. sobre intentos)
    if (apiMessage) {
        htmlContent += `<p style='color:var(--color-yellow); margin-bottom:15px;'>${escapeHTML(apiMessage)}</p>`; //
    }

    if (fetchErr) {
        htmlContent += `<p style='color:orange;'>No se pudo cargar el ranking (${escapeHTML(fetchErr.message)}). Verifica tu conexión.</p>`; //
        if (sendErr) {
            htmlContent += `<p style='color:var(--color-error); font-size:0.8em;'>Además, no se pudo guardar tu puntuación (${escapeHTML(sendErr.message)}).</p>`; //
        } else if (!apiMessage?.includes("intentos")) { // No mostrar si el apiMessage ya informó sobre el envío
             htmlContent += `<p style='color:var(--color-green); font-size:0.8em;'>Tu puntuación fue enviada, pero el ranking no está disponible ahora.</p>`;
        }
    } else if (Array.isArray(data)) {
        try {
            const topPlayers = data
                .map(r => ({
                    nombre: String(r?.nombre || "???").substring(0, RANKING_MAX_NAME_LENGTH), //
                    puntaje: Number(String(r?.puntaje || '0').replace(/[^\d.-]/g, '')) || 0
                }))
                .filter(r => !isNaN(r.puntaje) && r.puntaje >= 0)
                .sort((a, b) => b.puntaje - a.puntaje)
                .slice(0, RANKING_TOP_N); //

            htmlContent += `<h2>Ranking Top ${RANKING_TOP_N}</h2><table><thead><tr><th>#</th><th>Nombre</th><th>Puntos</th></tr></thead><tbody>`; //
            if (topPlayers.length > 0) {
                topPlayers.forEach((r, i) => {
                    htmlContent += `<tr><td>${i + 1}</td><td>${escapeHTML(r.nombre)}</td><td>${r.puntaje}</td></tr>`; //
                });
            } else {
                htmlContent += '<tr><td colspan="3">Ranking vacío o no disponible. ¡Sé el primero!</td></tr>';
            }
            htmlContent += '</tbody></table>';

            if (sendErr) {
                htmlContent += `<p style='color:orange; font-size:0.8em; margin-top:10px;'>Nota: No se pudo confirmar el guardado de tu puntuación (${escapeHTML(sendErr.message)}), pero el ranking sí se cargó.</p>`; //
            }

        } catch (processingError) {
            console.error("Error al procesar datos del ranking:", processingError);
            htmlContent += "<p>Error al mostrar el ranking. Intenta de nuevo más tarde.</p>";
        }
    } else {
        console.warn("Los datos del ranking recibidos no son un array o son nulos:", data);
        htmlContent += "<p>Formato de ranking inesperado o no disponible.</p>";
        if (sendErr) {
             htmlContent += `<p style='color:var(--color-error); font-size:0.8em;'>Además, hubo un error al guardar tu puntuación (${escapeHTML(sendErr.message)}).</p>`; //
        }
    }
    rankingDiv.innerHTML = htmlContent; //
}


/**
 * Envía la puntuación del jugador a la API y luego obtiene y muestra el ranking.
 * Muestra mensajes de carga y maneja errores de red/API.
 * @param {string} playerName - Nombre del jugador.
 * @param {string} playerEmail - Email del jugador.
 * @param {number} score - Puntuación final obtenida.
 */
export async function submitScoreAndDisplayRanking(playerName, playerEmail, score) {
    if(finalScoreTextEl) finalScoreTextEl.textContent = `${escapeHTML(playerName) || 'Jugador'}, tu puntuación final: ${score}`; //
    if(rankingDiv) rankingDiv.innerHTML = "<p>Enviando puntuación y cargando ranking...</p>"; //
    showScreen(rankingDisplayScreen); //
    restartButton?.focus(); //

    const payload = {
        nombre: String(playerName).substring(0, RANKING_MAX_NAME_LENGTH), //
        email: playerEmail,
        puntaje: score,
        action: 'submitScore' // Acción para que el script de Google sepa qué hacer
    };

    let rankingData = null;
    let apiResponseMessage = null; // Para mensajes como "Intentos agotados"
    let sendError = null;
    let fetchError = null;

    console.log("API Handler: Enviando puntuación...");
    const sendPromise = fetch(RANKING_URL, { //
        method: 'POST',
        mode: 'cors', // Necesario para peticiones cross-origin
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json', // Asegúrate que tu Apps Script puede manejar JSON
        },
        body: JSON.stringify(payload),
        // Google Apps Script requiere un truco para POST con JSON si no se usa `doPost(e)` correctamente.
        // Una alternativa común es enviar como text/plain y parsear en el script, o usar `application/x-www-form-urlencoded`.
        // Si tu Apps Script está configurado para `doPost(e)` y `e.postData.contents` es un JSON, esto debería funcionar.
        // Si no, podrías necesitar ajustar el `Content-Type` y el formato del `body`.
    })
    .then(response => response.json()) // Asumimos que la API siempre devuelve JSON
    .then(data => {
        console.log("API Handler: Respuesta del envío de puntuación:", data);
        if (data.status === 'success') {
            apiResponseMessage = data.message || "Puntuación enviada."; // ej: "Puntuación guardada. Te quedan 2 intentos."
        } else if (data.status === 'error' || data.status === 'limitReached') {
            apiResponseMessage = data.message || "No se pudo guardar la puntuación o intentos agotados.";
            // Considerar sendError como un error lógico de la API, no de red
            sendError = new Error(apiResponseMessage);
        } else { // Respuesta inesperada
            throw new Error("Respuesta inesperada del servidor al enviar puntuación.");
        }
    })
    .catch(err => {
        console.error("API Handler: Error en la red o al procesar respuesta del envío:", err);
        sendError = err;
        apiResponseMessage = apiResponseMessage || "Error de red al enviar tu puntuación.";
    });

    // La obtención del ranking puede ser una acción separada o parte de la respuesta del envío.
    // Si es separada, la mantenemos. Si la API de envío ya devuelve el ranking actualizado,
    // se puede omitir este fetch. Asumamos que sigue siendo un fetch separado por ahora.
    console.log("API Handler: Obteniendo ranking...");
    const fetchPayload = { action: 'getRanking' }; // Para que el script sepa qué hacer
    const fetchPromise = fetch(RANKING_URL, { //
        method: 'POST', // O GET si tu script lo maneja así para obtener ranking
        mode: 'cors',
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fetchPayload)
    })
    .then(response => response.json())
    .then(data => {
        console.log("API Handler: Ranking recibido.");
        if (data.status === 'success' && Array.isArray(data.ranking)) {
            rankingData = data.ranking;
        } else {
            throw new Error(data.message || "No se pudo obtener el ranking o formato incorrecto.");
        }
    })
    .catch(err => {
        console.error("API Handler: Error al obtener ranking:", err);
        fetchError = err;
    });

    await Promise.allSettled([sendPromise, fetchPromise]);

    console.log("API Handler: Operaciones de red finalizadas.");

    if (!rankingDisplayScreen || rankingDisplayScreen.classList.contains('screen--hidden')) { //
        console.log("API Handler: Actualización de ranking cancelada (pantalla oculta).");
        return;
    }

    _displayRanking(rankingData, apiResponseMessage, sendError, fetchError);
}
