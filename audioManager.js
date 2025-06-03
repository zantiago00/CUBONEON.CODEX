// Módulo: audioManager.js
// Descripción: Gestiona la carga y reproducción de efectos de sonido y música.

import * as state from './state.js'; //
import {
    // Rutas de Sonido
    SOUND_JUMP_PATH, SOUND_DOUBLE_JUMP_PATH, SOUND_COIN_GREEN_PATH,
    SOUND_COIN_BLUE_PATH, SOUND_COIN_VIOLET_PATH, SOUND_COIN_YELLOW_PATH,
    SOUND_COIN_WHITE_PATH, SOUND_HIT_OBSTACLE_PATH, SOUND_LEVEL_UP_PATH,
    SOUND_GAME_OVER_PATH, SOUND_BUTTON_CLICK_PATH, SOUND_POWERUP_GRANT_PATH,
    SOUND_DASH_PATH, SOUND_AIR_COMBO_PATH,
    // Rutas de Música
    MUSIC_BACKGROUND_PATH, MUSIC_MENU_PATH
} from './config.js'; //

const sounds = {};
let backgroundMusic = null;
let menuMusic = null;
let currentMusicVolume = 0.3; // Volumen por defecto para la música (0.0 a 1.0)
let currentEffectsVolume = 0.5; // Volumen por defecto para efectos (0.0 a 1.0)

/**
 * Carga un archivo de audio.
 * @param {string} path - La ruta al archivo de audio.
 * @param {boolean} [loop=false] - Si el audio debe repetirse.
 * @returns {HTMLAudioElement | null} El elemento de audio o null si hay error.
 * @private
 */
function _loadAudio(path, loop = false) {
    if (!path) {
        console.warn(`AudioManager: Ruta de audio no proporcionada.`);
        return null;
    }
    try {
        const audio = new Audio(path);
        audio.loop = loop;
        return audio;
    } catch (e) {
        console.error(`AudioManager: Error al cargar audio desde ${path}:`, e);
        return null;
    }
}

/**
 * Inicializa el gestor de audio, cargando todos los sonidos y música.
 */
export function initAudioManager() {
    console.log("AudioManager: Inicializando y cargando sonidos...");
    // Carga de Efectos de Sonido
    sounds.jump = _loadAudio(SOUND_JUMP_PATH);
    sounds.doubleJump = _loadAudio(SOUND_DOUBLE_JUMP_PATH);
    sounds.coinGreen = _loadAudio(SOUND_COIN_GREEN_PATH);
    sounds.coinBlue = _loadAudio(SOUND_COIN_BLUE_PATH);
    sounds.coinViolet = _loadAudio(SOUND_COIN_VIOLET_PATH);
    sounds.coinYellow = _loadAudio(SOUND_COIN_YELLOW_PATH);
    sounds.coinWhite = _loadAudio(SOUND_COIN_WHITE_PATH);
    sounds.hitObstacle = _loadAudio(SOUND_HIT_OBSTACLE_PATH);
    sounds.levelUp = _loadAudio(SOUND_LEVEL_UP_PATH);
    sounds.gameOver = _loadAudio(SOUND_GAME_OVER_PATH);
    sounds.buttonClick = _loadAudio(SOUND_BUTTON_CLICK_PATH);
    sounds.powerupGrant = _loadAudio(SOUND_POWERUP_GRANT_PATH);
    sounds.dash = _loadAudio(SOUND_DASH_PATH);
    sounds.airCombo = _loadAudio(SOUND_AIR_COMBO_PATH);

    // Carga de Música
    backgroundMusic = _loadAudio(MUSIC_BACKGROUND_PATH, true);
    menuMusic = _loadAudio(MUSIC_MENU_PATH, true);

    // Aplicar volumen inicial (considerando si está muteado)
    applyCurrentVolume();
    console.log("AudioManager: Sonidos y música cargados.");

    // Opcional: si el estado de mute ya está cargado, aplicarlo
    if (state.isSoundMuted()) { //
        _muteAll(true);
    }
}

/**
 * Reproduce un efecto de sonido por su nombre clave.
 * @param {string} soundName - El nombre clave del sonido (ej. 'jump', 'coinGreen').
 */
export function playSound(soundName) {
    if (state.isSoundMuted() || !sounds[soundName]) { //
        return;
    }
    try {
        sounds[soundName].currentTime = 0; // Reiniciar para permitir múltiples reproducciones rápidas
        sounds[soundName].play().catch(e => console.warn(`AudioManager: No se pudo reproducir sonido ${soundName}:`, e));
    } catch (e) {
        console.error(`AudioManager: Error al intentar reproducir ${soundName}:`, e);
    }
}

/**
 * Reproduce la música de fondo del juego.
 */
export function playGameMusic() {
    stopAllMusic();
    if (!state.isSoundMuted() && backgroundMusic) { //
        backgroundMusic.volume = currentMusicVolume;
        backgroundMusic.play().catch(e => console.warn("AudioManager: No se pudo reproducir música de fondo:", e));
    }
}

/**
 * Reproduce la música del menú/pantallas iniciales.
 */
export function playMenuMusic() {
    stopAllMusic();
    if (!state.isSoundMuted() && menuMusic) { //
        menuMusic.volume = currentMusicVolume;
        menuMusic.play().catch(e => console.warn("AudioManager: No se pudo reproducir música de menú:", e));
    }
}

/**
 * Detiene toda la música que se esté reproduciendo.
 */
export function stopAllMusic() {
    if (backgroundMusic && !backgroundMusic.paused) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
    if (menuMusic && !menuMusic.paused) {
        menuMusic.pause();
        menuMusic.currentTime = 0;
    }
}

/**
 * Silencia o activa todos los sonidos basado en el estado.
 * @param {boolean} mute - True para silenciar, false para activar.
 * @private
 */
function _muteAll(mute) {
    const volumeMultiplier = mute ? 0 : 1;
    Object.values(sounds).forEach(sound => {
        if (sound) sound.volume = currentEffectsVolume * volumeMultiplier;
    });
    if (backgroundMusic) backgroundMusic.volume = currentMusicVolume * volumeMultiplier;
    if (menuMusic) menuMusic.volume = currentMusicVolume * volumeMultiplier;

    // Si se está activando el sonido y alguna música debería estar sonando, reanudarla.
    // Esta lógica podría ser más compleja dependiendo de qué música estaba sonando antes.
    // Por simplicidad, si se activa el sonido, no se reanuda automáticamente la música aquí,
    // se debería llamar a playMenuMusic() o playGameMusic() explícitamente.
}

/**
 * Alterna el estado de silencio general.
 * Llama a state.js para actualizar el estado global.
 * @returns {boolean} El nuevo estado de mute (true si está silenciado).
 */
export function toggleMute() {
    const newMuteState = state.toggleSoundMuted(); // state.js actualiza su variable y localStorage
    _muteAll(newMuteState);

    if (!newMuteState) {
        // Si se acaba de activar el sonido, decidir qué música reproducir.
        // Esto dependerá de la pantalla actual. Por ahora, no iniciamos música automáticamente aquí.
        // El módulo main.js o uiManager.js podría decidirlo.
        console.log("AudioManager: Sonido activado. Recordar iniciar música si es necesario.");
    }
    return newMuteState;
}

/**
 * Establece el volumen para los efectos de sonido.
 * @param {number} volume - Valor entre 0.0 y 1.0.
 */
export function setEffectsVolume(volume) {
    currentEffectsVolume = Math.max(0, Math.min(1, volume)); // Clamp volume
    if (!state.isSoundMuted()) { //
        Object.values(sounds).forEach(sound => {
            if (sound) sound.volume = currentEffectsVolume;
        });
    }
}

/**
 * Establece el volumen para la música.
 * @param {number} volume - Valor entre 0.0 y 1.0.
 */
export function setMusicVolume(volume) {
    currentMusicVolume = Math.max(0, Math.min(1, volume)); // Clamp volume
    if (!state.isSoundMuted()) { //
        if (backgroundMusic) backgroundMusic.volume = currentMusicVolume;
        if (menuMusic) menuMusic.volume = currentMusicVolume;
    }
}

/**
 * Aplica los volúmenes actuales a todos los elementos de audio.
 * Útil después de cambiar el estado de mute general.
 */
export function applyCurrentVolume() {
    _muteAll(state.isSoundMuted()); //
}