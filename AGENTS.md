# Instrucciones para desarrolladores

Este archivo describe las normas básicas para modificar el código de CUBONEON ARENA.

## Estilo de código

- Usa indentación de **cuatro espacios**.
- Finaliza las sentencias con **punto y coma**.
- Los comentarios y nombres de variables deben escribirse en **español**.
- Mantén la estructura de módulos ES (import/export) existente.

## Pruebas rápidas

Antes de enviar cambios ejecuta el siguiente comando para comprobar la sintaxis de los archivos JavaScript modificados:

```bash
node --check nombreDeArchivo.js
```

Para verificar el juego manualmente, inicia un servidor estático desde la raíz del repositorio y abre `index.html` en tu navegador:

```bash
python3 -m http.server
```

Con el juego abierto, revisa la consola del navegador y asegúrate de que no existan errores.

## Commits

Describe los cambios de manera breve pero clara. Utiliza español para los mensajes de commit.
