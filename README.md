# QuestLab · Retos de inglés

Prototipo de una plataforma de actividades gamificadas para clases de inglés (nivel A1).

**Aprender y practicar**
- **Flashcards**: tarjetas con audio en inglés (voz del navegador); las que no sabes se repiten.
- **Relaciona**: une palabras con su pareja; las falladas vuelven en otra ronda.
- **Ordena las letras**: forma la palabra que falta en una oración.
- **Ordena la oración**: construye oraciones tocando las palabras en orden.
- **Completa la frase**: escribe la palabra que falta, con respuestas alternativas y pistas.

**Retos con puntos**
- **Pregunta rápida**: opción múltiple con tiempo, puntos por rapidez y rachas.
- **Sopa de letras**: generada al azar, se arrastra o se toca inicio y fin.

**Juegos elaborados**
- **Escape room**: historia con candados, reloj, pistas con penalización y código final.
- **Carrera por equipos**: tablero con dado, preguntas, robo de turno y casillas especiales.

Incluye panel del docente con editores, ejemplos de nivel A1 y progreso por estudiante.

Hecho con Svelte 5, Vite y Tailwind CSS v4. Los datos se guardan en el navegador (localStorage).

## Ejecutar en tu computadora

```bash
npm install
npm run dev
```

## Publicación

Cada `git push` a `main` construye el sitio y lo publica en GitHub Pages mediante `.github/workflows/deploy.yml`.
