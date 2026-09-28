# GRUPO13-2026-PROYINF

Este es el repositorio del grupo 13, cuyos integrantes son:

- Benjamín Campos       - ROL: 202473094-0
- Joaquín Hormaechea    - ROL: 202473133-5
- Renato Lazilotta      - ROL: 202203041-0
- Jesús Bustamante      - ROL: 201941079-2
- **Ayudante**: Cristóbal Córdova

# INF236-2026-2-Proyecto Base

# Enlace Wiki

* [Enlace Wiki](https://gitlab.inf.utfsm.cl/inf236-cc-2026-2/grupo13-2026-proyinf/-/wikis/home)


## Tecnologías y Ejecución

El proyecto base está construido bajo una arquitectura orientada a microservicios utilizando las siguientes tecnologías:
* **Entorno de ejecución:** Node.js (v18.20.8)
* **Base de Datos:** MySQL (26.7.0)
* **Contenedores y Orquestación:** Docker (29.7.2) y Docker Compose (v5.5.0)

## Requisitos previos (dependencias)

1. **Docker Desktop** (incluye Docker Engine `29.7.2` y Docker Compose `v5.5.0` o superior).
   - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Git** (para clonar el repositorio).
   - [Descargar Git](https://git-scm.com/downloads)

## Instrucciones para levantar el entorno local

### 1. Clonar el repositorio

Abra una terminal, clone el repositorio y ubíquese en el directorio raíz del proyecto:

```bash
git clone https://gitlab.inf.utfsm.cl/inf236-cc-2026-2/grupo13-2026-proyinf.git
cd grupo13-2026-proyinf
```

### 2. Iniciar el motor de contenedores

Abra **Docker Desktop** y espere a que indique **"Engine running"** antes de continuar.

### 3. Construir y levantar el proyecto

Desde la raíz del proyecto (donde está `docker-compose.yml`), ejecute en la terminal:

```bash
docker compose up --build
```

Este comando construye las imágenes y levanta todas las APIs y la base de datos. Para dejarlas corriendo en segundo plano, agregue la opción `-d`:

```bash
docker compose up --build -d
```

### 4. Verificación del entorno

Cuando la terminal confirme que los contenedores están listos, verifique el funcionamiento desde el navegador o Postman. Por ejemplo, para la API de ejemplo:

- Ingrese a: <http://localhost:8082>
- Es normal recibir la respuesta `Cannot GET /`: confirma que el servidor de Node.js está escuchando correctamente en el puerto.

### 5. Detener y limpiar recursos

Para finalizar las pruebas, apagar los contenedores y eliminar los volúmenes de datos (borra la base de datos temporal), ejecute en la misma terminal:

```bash
docker compose down -v
```

Si solo desea apagar los contenedores conservando los datos, use `docker compose down`.

---

## Solución de problemas que pueden aparecer

| Problema | Posible causa | Solución |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop no está abierto | Abra Docker Desktop y espere a "Engine running". |
| Puerto ocupado (`port is already allocated`) | Otro programa usa el puerto | Cierre el programa que lo usa o cambie el puerto en `docker-compose.yml`. |
| Error de conexión a la base de datos | `.env` ausente o con valores incorrectos | Revise el paso 2. |
| `init.sql` no se ejecutó | La base de datos ya existía de una ejecución previa | Ejecute `docker compose down -v` y vuelva a levantar el proyecto. |
