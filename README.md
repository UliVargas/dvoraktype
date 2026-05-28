# DvorakType ⌨️

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Framework: Qwik](https://img.shields.io/badge/Framework-Qwik-18B6F6.svg?logo=qwik&logoColor=white)

**DvorakType** es una aplicación web interactiva diseñada específicamente para ayudar a hispanohablantes a aprender y dominar la distribución de teclado **Dvorak en Español**. 

## 🚀 Características

- **Diseño Neobrutalista**: Interfaz moderna, limpia y rápida, libre de distracciones.
- **Motor de Tipeo Avanzado**: Cálculo en tiempo real de Palabras por Minuto (WPM), precisión y detección fluida de teclas muertas (acentos `´`, diéresis `¨`).
- **Dos Layouts Soportados**: 
  - `Dvorak Español (XKB)`: Basado en la distribución de Linux. Esta variante se utiliza como estándar actual, ¡pero próximamente se añadirán las variantes exactas nativas de Windows y macOS!
  - `Dvorak US Internacional`: Para quienes usan el layout americano pero necesitan tipear en español usando teclas muertas.
- **Lecciones Progresivas**: Ejercicios generados con palabras reales en español.
- **Práctica Libre**: Generador infinito de frases y citas célebres.
- **Buzón de Sugerencias**: Un sistema anónimo para recibir feedback de la comunidad directamente a la base de datos.
- **Sincronización de Progreso**: Persistencia del aprendizaje vinculada a sesiones anónimas mediante cookies seguras.

## 🛠️ Tecnologías Utilizadas

- **Frontend**: [Qwik](https://qwik.builder.io/) - Framework de última generación, súper rápido gracias a su reanudabilidad (resumability).
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) - Arquitectura de utilidades con tokens nativos.
- **Base de Datos**: [Turso](https://turso.tech/) (SQLite distribuida) conectada a través de [Drizzle ORM](https://orm.drizzle.team/).
- **Iconos**: [Lucide Icons](https://lucide.dev/).
- **Validación**: Zod.

## 💻 Desarrollo Local

### Prerrequisitos
Asegúrate de tener Node.js (v24+) y `pnpm` instalados en tu sistema.

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/ulivargas/typing-test.git
   cd typing-test
   ```

2. Instala las dependencias:
   ```bash
   pnpm install
   ```

3. Configura las variables de entorno. Crea un archivo `.env` en la raíz del proyecto (basado en `.env.example` si existe) y añade la URL de tu base de datos Turso:
   ```env
   DATABASE_URL="file:./local.db" # Para desarrollo local con SQLite
   # O si usas Turso: DATABASE_URL="libsql://tu-db.turso.io"
   ```

4. Empuja el esquema a la base de datos local:
   ```bash
   pnpm drizzle-kit push
   ```

5. Inicia el servidor de desarrollo:
   ```bash
   pnpm start
   ```

La aplicación estará corriendo en `http://localhost:5173`.

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
