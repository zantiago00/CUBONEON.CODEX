# CUBONEON ARENA

CUBONEON ARENA es un sencillo juego de plataformas y esquiva desarrollado solo con HTML, CSS y JavaScript moderno. Todo el código se organiza mediante módulos ESM, sin herramientas de build ni dependencias externas.

## Estructura

- `index.html` – Entrada principal del juego.
- `styles.css` – Estilos y animaciones.
- `config.js` – Parámetros globales como gravedad, velocidades y rutas de sonido.
- `main.js` – Punto de arranque que inicializa los demás módulos.
- `gameLoop.js`, `playerController.js`, `coinManager.js`, etc. – Lógica de juego dividida en módulos.

## Ejecución local

No se necesita proceso de compilación. Para probar el juego basta con servir la carpeta mediante un servidor estático y abrir `index.html` en el navegador:

```bash
python3 -m http.server
```

Tras ejecutar el comando, abre `http://localhost:8000/` y verifica la consola del navegador por si aparecen errores.

## Contribución

- Mantén los comentarios y mensajes de commit en español.
- Utiliza sangría de cuatro espacios y finaliza las líneas con punto y coma, siguiendo el estilo actual.
- Comprueba la sintaxis de los archivos modificados con:

```bash
node --check archivo.js
```

Revisa también `AGENTS.md` para conocer lineamientos específicos antes de realizar cambios.
