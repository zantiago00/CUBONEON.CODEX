// Módulo: domRefs.js
// Descripción: Obtiene y exporta referencias a los elementos clave del DOM.

export const player = document.getElementById('player');
export const container = document.getElementById('gameContainer');
export const scoreEl = document.getElementById('score');
export const timerEl = document.getElementById('timer');
export const comboEl = document.getElementById('combo');

// Pantallas y Formularios
export const welcomeScreen = document.getElementById('welcomeScreen');
export const emailScreen = document.getElementById('emailScreen');
export const emailForm = document.getElementById('emailForm');
export const initialEmailInput = document.getElementById('initialEmail');

export const registerScreen = document.getElementById('registerScreen');
export const registerForm = document.getElementById('registerForm');
export const playerEmailInput = document.getElementById('playerEmail'); // Ya estaba
export const playerNameInput = document.getElementById('playerName'); // Ya estaba
export const termsCheckbox = document.getElementById('termsCheckbox'); // Ya estaba
export const registerButton = document.getElementById('registerButton'); // Añadido para consistencia si se necesita

export const startScreen = document.getElementById('startScreen');
export const rankingDisplayScreen = document.getElementById('rankingDisplay');

// Botones, Inputs y Elementos UI
export const welcomeStartBtn = document.getElementById('welcomeStartBtn');
export const startButton = document.getElementById('startButton');
export const rankingDiv = document.getElementById('ranking');
export const finalScoreTextEl = document.getElementById('finalScoreText');
export const restartButton = document.getElementById('restartButton');

// Referencia específica para instrucciones móviles
export const mobileInstructions = document.getElementById('mobileInstructions'); // Usar ID directo es más robusto

// Mensaje de orientación
export const orientationMessage = document.getElementById('orientation-message');

// Elementos de Términos y Condiciones
export const termsModal = document.getElementById('termsModal');
export const openTermsBtn = document.getElementById('openTermsBtn');
export const closeTermsBtn = document.getElementById('closeTermsBtn'); // ID añadido en HTML
export const acceptTermsBtn = document.getElementById('acceptTermsBtn'); // Ya estaba

// NUEVO: Referencias para el HUD de Power-Ups
export const powerUpHud = document.getElementById('powerup-hud');
export const hudDashIcon = document.getElementById('hud-dash-icon');
export const hudDjIcon = document.getElementById('hud-dj-icon');
export const hudBlancoIcon = document.getElementById('hud-blanco-icon'); // Asumiendo que 'blanco' es el nombre clave para el tercer power-up

// NUEVO: Referencia para el Botón de Sonido
export const soundToggleBtn = document.getElementById('soundToggleBtn');

// Nota: Se eliminó el optional chaining (?) donde los elementos ahora tienen IDs directos y se espera que existan.
// Si algún elemento es verdaderamente opcional, se podría reintroducir el optional chaining o verificar su existencia al usarlo.