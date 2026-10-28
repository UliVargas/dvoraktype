# DvorakType ⌨️

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Framework: Qwik](https://img.shields.io/badge/Framework-Qwik-18B6F6.svg?logo=qwik&logoColor=white)

**DvorakType** es una aplicación web interactiva diseñada específicamente para ayudar a hispanohablantes a aprender y dominar la distribución de teclado **Dvorak en Español**. 

## 🚀 Características

- **Diseño Neobrutalista**: Interfaz moderna, limpia y rápida, libre de distracciones.
- **Motor de Tipeo Avanzado**: Cálculo en tiempo real de Palabras por Minuto (WPM), precisión y detección fluida de teclas muertas (acentos `´`, diéresis `¨`).
- **Tres Layouts Soportados**: 
  - `Dvorak Español (XKB)`: Basado en la distribución de Linux. Esta variante se utiliza como estándar actual, ¡pero próximamente se añadirán las variantes exactas nativas de Windows y macOS!
  - `Dvorak US Internacional`: Para quienes usan el layout americano pero necesitan tipear en español usando teclas muertas.
  - `Dvorak Latinoamérica (XKB)`: La variante latinoamericana de Linux. Las letras son las mismas que en el Dvorak español; cambia la puntuación: `¿` y `¡` junto al 0, y los acentos (`´`) y la diéresis (`¨`) como teclas muertas a la derecha de la L.
- **Lecciones Progresivas**: Ejercicios generados con palabras reales en español.
- **Práctica Libre**: Generador infinito de frases y citas célebres.
- **Buzón de Sugerencias**: Un sistema anónimo para recibir feedback de la comunidad directamente a la base de datos.
- **Sincronización de Progreso**: Persistencia del aprendizaje vinculada a sesiones anónimas mediante cookies seguras.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: [Qwik](https://qwik.builder.io/) - Framework de última generación, súper rápido gracias a su reanudabilidad (resumability).
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) - Arquitectura de utilidades con tokens nativos.
- **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) conectada a través de [Drizzle ORM](https://orm.drizzle.team/) y `postgres-js`.
- **Iconos**: [Lucide Icons](https://lucide.dev/).
- **Validación**: Zod.

## 💻 Desarrollo Local

### Prerrequisitos
Asegúrate de tener Node.js (v24+) y `pnpm` instalados en tu sistema.

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/UliVargas/dvoraktype.git
   cd dvoraktype
   ```

2. Instala las dependencias:
   ```bash
   pnpm install
   ```

3. Levanta PostgreSQL con Docker Compose y crea tu `.env` a partir del ejemplo (ya apunta a esa base de datos):
   ```bash
   docker compose up -d db
   cp .env.example .env
   ```

4. Aplica las migraciones a la base de datos local:
   ```bash
   pnpm db:migrate
   ```

5. Inicia el servidor de desarrollo:
   ```bash
   pnpm start
   ```

La aplicación estará corriendo en `http://localhost:5173`.

### Migraciones de base de datos

El esquema vive en `src/db/schema.ts` y las migraciones versionadas en `drizzle/`.

- Después de cambiar el esquema, genera una migración nueva y súbela al repositorio junto con el cambio:
  ```bash
  pnpm db:generate
  ```
- En producción el servidor aplica las migraciones pendientes al arrancar, antes de aceptar tráfico (`src/db/migrate.ts`). Si la base de datos ya tenía las tablas iniciales pero no tenía historial de migraciones (por ejemplo, porque se creó con `drizzle-kit push`), la migración inicial se registra como aplicada y solo se ejecutan las posteriores.
- No uses `drizzle-kit push` fuera de bases de datos desechables: modifica el esquema sin dejar historial, y así se ocultan migraciones que faltan.
- En producción `DATABASE_URL` es obligatoria: sin ella el servidor no arranca.

### Variables de entorno

| Variable | Obligatoria | Uso |
|---|---|---|
| `DATABASE_URL` | Sí, en producción | Conexión a PostgreSQL. |
| `ORIGIN` | No | Origen público para la protección CSRF (por ejemplo `https://dvoraktype.com`). Si no se define, se deriva de `X-Forwarded-Proto` y `X-Forwarded-Host`, que es lo que envía el proxy de Railway. |
| `PORT` | No | Puerto HTTP (por defecto `3000`). |

### Producción y Docker

- La imagen (`Dockerfile`) solo incluye dependencias de producción y arranca con `node server/entry.express`.
- `GET /health` responde `200` si la base de datos contesta y `503` si no (con un límite de 2 s). La imagen lo usa como `HEALTHCHECK`; en Railway puedes configurarlo como health check path.
- Al arrancar aplica las migraciones antes de aceptar tráfico. Los fallos transitorios se reintentan 7 veces con 45 s de espera en total: base de datos aún no disponible (cada conexión corta a los 10 s), un bloqueo de tabla ocupado por el tráfico (5 s por intento) u otra instancia migrando (hasta 60 s por intento). En el peor caso, el arranque puede tardar varios minutos.
- Ante `SIGTERM` (por ejemplo, en un deploy) deja de aceptar conexiones, termina las peticiones en curso y cierra la conexión a la base de datos.
- Para probar la imagen de producción en local: `docker compose up --build` (sirve en `http://localhost:3000`).

### Tests

```bash
pnpm test   # unitarios y de componentes
```

Los tests de base de datos se ejecutan si defines `TEST_DATABASE_URL` (por ejemplo, un Postgres desechable con Docker); en CI siempre se ejecutan.

## 🤝 Contribuciones

¡Las contribuciones son más que bienvenidas! Si notas que falta una tecla en el mapa interactivo de Dvorak, si quieres añadir más lecciones o simplemente optimizar el código:

1. Haz un *Fork* del proyecto.
2. Crea una nueva rama (`git switch -c feature/nueva-leccion`).
3. Haz tus cambios y *commits* (`git commit -m 'Añadida lección de acentos'`).
4. Haz *push* a tu rama (`git push origin feature/nueva-leccion`).
5. Abre un **Pull Request**.

Si no sabes cómo programar la solución pero tienes una idea genial, siéntete libre de usar el **Buzón de Sugerencias** integrado en la web.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE](LICENSE) para más detalles.

---
Hecho con ❤️ por [Ulises Vargas](https://github.com/ulivargas).
