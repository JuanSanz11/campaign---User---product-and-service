# User, Product & Service REST API

Este proyecto es una REST API desarrollada en Node.js con Express, que incluye integración con Prisma, Autenticación mediante Google OAuth2, mensajería de eventos con Redpanda (Kafka) y flujos de trabajo automatizados con n8n (node node automation). Está preparada para ejecutarse localmente o mediante Docker.

## Características Principales

*   **API REST**: Implementación de operaciones CRUD para Usuarios, Productos y Servicios.
*   **Base de Datos**: PostgreSQL containerizado, gestionado mediante Prisma ORM.
*   **Autenticación**: Integración con Google OAuth2 para el registro y login de usuarios (contraseñas encriptadas con bcrypt).
*   **Mensajería de Eventos (Redpanda)**: Emisión de eventos de auditoría cuando ocurren cambios en las entidades (creación, actualización, eliminación) mediante un Productor y un Consumidor de Kafka.
*   **Automatización (n8n)**: Integración con flujos de trabajo de n8n mediante Webhooks.
*   **Documentación**: Interfaz interactiva de Swagger (OpenAPI 3.0) para interactuar con la API.
*   **Docker Compose**: Todo el entorno (PostgreSQL, Redpanda, Consola de Redpanda) se levanta fácilmente mediante Docker Compose.

## Requisitos Previos

*   [Node.js](https://nodejs.org/) (v18 o superior recomendado)
*   [Docker](https://www.docker.com/) y Docker Compose (requeridos para levantar PostgreSQL y Redpanda)
*   Cuenta de Google Cloud para obtener credenciales de OAuth2.
*   Instancia de n8n ejecutándose (opcional, para flujos de trabajo).

## Configuración del Entorno

1. Renombra el archivo `.env.example` a `.env` (si existe, o simplemente edita el `.env` provisto) y configura las variables necesarias:

```env
# Database (PostgreSQL containerizado)
DATABASE_URL="postgresql://user:password@localhost:5432/user_product_db?schema=public"

# App
PORT=3000

# Google OAuth2
GOOGLE_CLIENT_ID="TU_CLIENT_ID"
GOOGLE_CLIENT_SECRET="TU_CLIENT_SECRET"
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
SESSION_SECRET="un_secreto_para_la_sesion"

# Redpanda / Kafka
REDPANDA_BROKERS="localhost:19092"

# n8n
# Importante: para envíos automáticos desde el backend a través de N8N, el workflow debe estar publicado/activado.
# Usa la URL de producción del webhook (por ejemplo http://localhost:5678/webhook/<tu-webhook-id>)
# Para envíos manuales la API usa un webhook separado. Configura la URL del webhook manual igual que la del webhook de campaña.
# Si el webhook manual no está disponible, el backend intentará automáticamente reenviar al webhook normal.
# Si sólo quieres probar en modo interactivo, puedes utilizar webhook-test, pero en ese caso debes ejecutar el workflow manualmente desde el editor.
N8N_WEBHOOK_URL="http://localhost:5678/webhook/<tu-webhook-id>"
N8N_MANUAL_WEBHOOK_URL="http://localhost:5678/webhook/manual-send"
```

## Instalación y Ejecución Local

1. Instala las dependencias:
   ```bash
   npm install
   ```

2. Levanta los servicios de infraestructura (PostgreSQL y Redpanda) usando Docker Compose:
   ```bash
   docker compose up -d
   ```
   *(Nota: Puedes acceder a la consola de Redpanda en `http://localhost:8080`)*

3. Ejecuta las migraciones de Prisma para configurar la base de datos PostgreSQL:
   ```bash
   npm run prisma:migrate
   ```

4. Genera el cliente de Prisma:
   ```bash
   npm run prisma:generate
   ```

5. Inicia el servidor de Node.js en modo desarrollo:
   ```bash
   npm run dev
   ```

## Documentación de la API (Swagger)

Una vez que el servidor esté en ejecución, puedes acceder a la documentación interactiva de la API en la siguiente ruta:

👉 **`http://localhost:3000/api-docs`**

## Scripts Disponibles

*   `npm run dev`: Inicia la aplicación con `nodemon` para recarga automática.
*   `npm run prisma:migrate`: Aplica las migraciones de Prisma a la base de datos (usando `npx prisma migrate dev`).
*   `npm run prisma:generate`: Genera los artefactos del cliente de Prisma.

## Estructura del Proyecto

*   `/src/prisma`: Schema y migraciones de la base de datos.
*   `/src/routes`: Definición de los endpoints HTTP.
*   `/src/controllers`: Lógica de negocio y manejo de peticiones para los CRUDs.
*   `/src/middleware`: Validaciones y verificación de autenticación.
*   `/src/auth`: Estrategia y rutas para Google OAuth2.
*   `/src/redpanda`: Scripts para el Productor y Consumidor de eventos.
*   `/src/n8n`: Funciones de integración con n8n.
*   `/src/app.js`: Configuración principal de Express y Swagger.

## Integraciones

### Redpanda
La API enviará mensajes al broker configurado en `REDPANDA_BROKERS` al interactuar con las entidades principales. El consumidor interno leerá estos tópicos y podrá desencadenar otras acciones.

### n8n
Se pueden configurar flujos de trabajo (workflows) en n8n para reaccionar a los eventos del sistema.


solución real es usar una cuenta oficial de Ngrok: simplemente ngrok que quedó en tu carpeta es el programa oficial de Ngrok (conocido técnicamente como un "archivo binario" o ejecutable).

Piénsalo como si fuera una aplicación (como Google Chrome o n8n), pero en lugar de tener una ventana gráfica bonita con la que haces clic, es una aplicación "sin rostro" diseñada para correr silenciosamente desde la terminal.

DOMAIN 
./iniciar-tunel.sh

La forma Hacker (Terminal): Escribe el comando pkill -f ngrok. Esto elimina cualquier archivo en tu compu llamado ngrok.



1. Preparar tu aplicación:

2. Elegir un proveedor de nube:
   - AWS (Amazon Web Services): EC2, Elastic Beanstalk, o Lambda.
   -  Vercel serverless
3. Configurar el servidor:
   - Crear una instancia: Si usas AWS, Google Cloud o DigitalOcean, crea una máquina virtual (VPS).

4. Ejecutar la aplicación:
5. Configurar un dominio (opcional):# campaign---User---product-and-service
