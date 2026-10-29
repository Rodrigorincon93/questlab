# QuestLab · Retos de inglés

Prototipo de una plataforma de actividades gamificadas para clases de inglés (nivel A1).

- **Pregunta rápida**: opción múltiple con tiempo, puntos por rapidez y rachas.
- **Relaciona**: une palabras con su pareja; las falladas se repiten hasta dominarlas.
- Panel del docente con editor, lista de actividades y progreso por estudiante.

Hecho con Svelte 5, Vite y Tailwind CSS v4. Los datos se guardan en el navegador (localStorage).

## Ejecutar en tu computadora

```bash
npm install
npm run dev
```

## Publicación

Cada `git push` a `main` construye el sitio y lo publica en GitHub Pages mediante `.github/workflows/deploy.yml`.
