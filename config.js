// Módulo: config.js
// Descripción: Configuración centralizada del juego CUBONEON ARENA (Versión Final)
// ------------------------------------------------------------------------------------

/* ---------- ENUM / Tipos de moneda ---------- */
// Usamos Object.freeze para hacerlo inmutable (buena práctica)
export const COIN_TYPES = Object.freeze({
    GREEN:  'green',
    BLUE:   'blue',
    VIOLET: 'violeta',
    YELLOW: 'amarilla',
    WHITE:  'blanca'
  });
  
  /* ---------- Física y movimiento ---------- */
  export const GRAVITY_ACCEL                 = 1800; // Aceleración pixels/s^2
  export const INITIAL_JUMP_VELOCITY         = 700;  // Velocidad vertical inicial salto (pixels/s)
  export const JUMP_COMBO_MULTIPLIER         = 1.1;  // Multiplicador altura salto por combo >= 3
  export const DOUBLE_JUMP_VELOCITY_MULTIPLIER = 1.1;  // Impulso extra para Doble Salto (Power-Up)
  
  /* ---------- Posición Suelo ---------- */
  export const GROUND_Y                      = 0;    // Posición Y del suelo (px desde abajo)
  
  /* ---------- Velocidad base y multiplicadores ---------- */
  export const BASE_SPEED            = 420; // Velocidad horizontal base (pixels/s)
  export const SPEED_MULTIPLIER_COMBO3 = 1.2; // Multiplicador por combo >= 3
  export const SPEED_MULTIPLIER_COMBO6 = 1.5; // Multiplicador por combo >= 6
  /* --- Boost temporal por moneda Azul (si se mantiene esta mecánica además del power-up) --- */
  export const SPEED_BOOST_MULTIPLIER = 1.5;  // Factor de multiplicación durante boost
  export const SPEED_BOOST_DURATION_S = 5;    // Duración del boost en segundos
  
  /* --- Multiplicadores PERMANENTES por Nivel (0 a 5) --- */
  // Estos se aplican sobre la BASE_SPEED y INITIAL_JUMP_VELOCITY según el nivel.
  export const LEVEL_SPEED_MULTIPLIERS = [1.0, 1.15, 1.30, 1.45, 1.60, 1.75]; // Ejemplo: Aumentos progresivos
  export const LEVEL_JUMP_MULTIPLIERS  = [1.0, 1.0,  1.1,  1.1,  1.2,  1.2];  // Ejemplo: Salto mejora en ciertos niveles
  
  /* ---------- Tiempo, puntuación, ranking ---------- */
  // Tiempo inicial reducido para partidas más rápidas
  export const INITIAL_TIME_S   = 30; // Tiempo inicial en segundos
  export const MAX_TIME_CAP_S   = INITIAL_TIME_S + 60; // Límite máximo de tiempo acumulable
  export const OBSTACLE_HIT_PENALTY_S = 1;  // Segundos penalización por golpe
  export const COIN_SCORE_MULTIPLIER  = 5;  // Puntos base por moneda (multiplicado por combo actual)
  export const POINTS_PER_OBSTACLE_DODGED = 10; // Puntos al esquivar un obstáculo (nueva)
  
  export const RANKING_URL      = "https://script.google.com/macros/s/AKfycbzBUuj5qYyp9PnnP83ofKBGwStiqmk8ixX4CcQiPZWAevi1_vB6rqiXtYioXM4GcnHidw/exec"; // TU URL DE APPS SCRIPT
  export const RANKING_MAX_NAME_LENGTH = 15; // Máximo caracteres nombre
  export const RANKING_TOP_N          = 20; // Cuántos mostrar en el ranking
  
  /* ---------- Generación obstáculos/monedas (Intervalos en ms) ---------- */
  export const OBSTACLE_BASE_INTERVAL_MS   = 1800; //
  export const OBSTACLE_MIN_GAP_TIME_MS    = 550; // Ajustado ligeramente
  export const OBSTACLE_RATE_DECREASE_FACTOR = 0.96; // Factor reducción intervalo por combo (más impacto)
  export const MAX_CONSECUTIVE_OBSTACLES = 3;    // Máximo seguidos antes de pausa
  export const CONSECUTIVE_OBSTACLE_BREAK_MULTIPLIER = 1.6; // Multiplicador pausa (mayor pausa)
  export const COIN_BASE_INTERVAL_MS       = 2200; // Ligeramente más frecuente
  export const MIN_COIN_INTERVAL_TIME_MS   = 1600; // Ligeramente más frecuente
  export const COIN_INTERVAL_RANDOMNESS_MS = 800;
  export const COIN_INTERVAL_COMBO6_MULTIPLIER = 0.7; // Mayor impacto del combo
  export const MIN_OBSTACLE_VISUAL_GAP_PX  = 120;  // Gap mínimo entre obstáculos dobles (aumentado)
  export const OBSTACLE_LARGE_CHANCE = 0.33; // Probabilidad Obst. Grande (Nivel 3+)
  export const OBSTACLE_DOUBLE_CHANCE = 0.4; // Probabilidad Obst. Doble (Combo 3+)
  
  /* ---------- Configuración de Power-Ups ---------- */
  // Dash (Activado por Moneda Violeta)
  export const DASH_SPEED_BONUS = 800;     // Aumento instantáneo o velocidad fija extra (pixels/s)
  export const DASH_DURATION_S = 0.25;   // Duración del Dash en segundos
  export const DASH_INVULNERABLE = true; // Si el jugador es invulnerable durante el dash
  
  // Combo Aéreo (Activado por Moneda Blanca)
  // EJEMPLO: Permite un reseteo de la disponibilidad del doble salto en el aire
  export const AIR_COMBO_RESETS_DOUBLE_JUMP = true;
  
  /* ---------- Reglas de Nivel y Monedas ---------- */
  // Define qué se necesita para pasar AL SIGUIENTE nivel desde el nivel actual
  // y qué moneda aparece MIENTRAS estás en el nivel actual.
  export const LEVEL_RULES = [
    // Nivel 0 (Cian): Necesitas 3 Verdes para pasar a Lvl 1. Aparecen Verdes.
    { level: 0, spawn: COIN_TYPES.GREEN,  coinsToAdvance: 3, advanceCoin: COIN_TYPES.GREEN }, //
    // Nivel 1 (Verde): Necesitas 3 Azules para pasar a Lvl 2. Aparecen Azules.
    { level: 1, spawn: COIN_TYPES.BLUE,   coinsToAdvance: 3, advanceCoin: COIN_TYPES.BLUE  }, //
    // Nivel 2 (Azul): Necesitas 2 Violetas para Lvl 3. Aparecen Violetas.
    { level: 2, spawn: COIN_TYPES.VIOLET, coinsToAdvance: 2, advanceCoin: COIN_TYPES.VIOLET }, // Menos monedas para avanzar
    // Nivel 3 (Violeta): Necesitas 2 Amarillas para Lvl 4. Aparecen Amarillas. (Activa PowerUp Dash con moneda VIOLETA)
    { level: 3, spawn: COIN_TYPES.YELLOW, coinsToAdvance: 2, advanceCoin: COIN_TYPES.YELLOW }, //
    // Nivel 4 (Amarillo): Necesitas 2 Blancas para Lvl 5. Aparecen Blancas. (Activa PowerUp Doble Salto con moneda AMARILLA)
    { level: 4, spawn: COIN_TYPES.WHITE,  coinsToAdvance: 2, advanceCoin: COIN_TYPES.WHITE  }, //
    // Nivel 5 (Blanco): Nivel final. Siempre aparecen Blancas. (Activa PowerUp Combo Aire con moneda BLANCA)
    { level: 5, spawn: COIN_TYPES.WHITE,  coinsToAdvance: Infinity } //
  ];
  
  /* ---------- Bonus de tiempo por tipo de moneda ---------- */
  // (En segundos)
  export const COIN_BONUSES = {
    [COIN_TYPES.GREEN]:  1,   //
    [COIN_TYPES.BLUE]:   2,   //
    [COIN_TYPES.VIOLET]: 3,   //
    [COIN_TYPES.YELLOW]: 4,   // Ligeramente ajustado
    [COIN_TYPES.WHITE]:  5    // Ligeramente ajustado
  };
  
  /* ---------- Animaciones y UI ---------- */
  export const FLOATING_TEXT_DURATION_MS     = 1200; // Duración texto flotante (+1s, etc.)
  export const WELCOME_TRANSITION_DURATION_MS = 500;  // Duración fade out pantalla bienvenida
  export const HIT_EFFECT_DURATION_MS        = 300;  // Duración efecto shake/hit en contenedor
  export const JUMP_EFFECT_DURATION_MS       = 200;  // Duración clase .jumping en player
  export const COLLECT_EFFECT_DURATION_MS    = 200;  // Duración clase .collected en player
  
  /* ---------- Sonidos (rutas a los archivos) ---------- */
  // Crear una carpeta 'assets/sounds/' en tu proyecto.
  export const SOUND_JUMP_PATH = './assets/sounds/jump.wav';
  export const SOUND_DOUBLE_JUMP_PATH = './assets/sounds/double_jump.wav';
  export const SOUND_COIN_GREEN_PATH = './assets/sounds/coin_green.wav';
  export const SOUND_COIN_BLUE_PATH = './assets/sounds/coin_blue.wav';
  export const SOUND_COIN_VIOLET_PATH = './assets/sounds/coin_violet.wav';
  export const SOUND_COIN_YELLOW_PATH = './assets/sounds/coin_yellow.wav';
  export const SOUND_COIN_WHITE_PATH = './assets/sounds/coin_white.wav';
  export const SOUND_HIT_OBSTACLE_PATH = './assets/sounds/hit.wav';
  export const SOUND_LEVEL_UP_PATH = './assets/sounds/level_up.wav';
  export const SOUND_GAME_OVER_PATH = './assets/sounds/game_over.wav';
  export const SOUND_BUTTON_CLICK_PATH = './assets/sounds/button_click.wav';
  export const SOUND_POWERUP_GRANT_PATH = './assets/sounds/powerup_grant.wav'; // Al obtener un power-up
  export const SOUND_DASH_PATH = './assets/sounds/dash.wav'; // Al usar el Dash
  export const SOUND_AIR_COMBO_PATH = './assets/sounds/air_combo.wav'; // Al usar el Combo Aéreo
  
  export const MUSIC_BACKGROUND_PATH = './assets/music/theme.mp3';
  export const MUSIC_MENU_PATH = './assets/music/menu_theme.mp3';