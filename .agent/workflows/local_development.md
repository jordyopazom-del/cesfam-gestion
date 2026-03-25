---
description: Regla de desarrollo local estricta
---

# Desarrollo Local Estricto

1.  **Prioridad Local**: Todos los cambios deben realizarse y probarse exclusivamente en el entorno local (`localhost:3000`).
2.  **Prohibición de Deploy Automático**: No realizar `git push`, `git commit` o `vercel --prod` sin una instrucción EXPLÍCITA del usuario que diga algo como "sube los cambios" o "despliega en producción".
3.  **Verificación**: Antes de cualquier acción de subida, confirmar siempre con el usuario si es el momento adecuado para hacerlo.
