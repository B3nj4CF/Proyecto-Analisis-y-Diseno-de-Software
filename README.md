# GRUPO13-2026-PROYINF

Este es el repositorio del grupo 13, cuyos integrantes son:

- Benjamín Campos       - ROL: 202473094-0
- Joaquín Hormaechea    - ROL: 202473133-5
- Renato Lazilotta      - ROL: 202203041-0
- Jesús Bustamante      - ROL: 201941079-2
- **Ayudante**: Cristóbal Córdova

# Enlace Wiki

* [Enlace Wiki](https://gitlab.inf.utfsm.cl/inf236-cc-2026-2/grupo13-2026-proyinf/-/wikis/home)

# Video de Demostración (Hito 3)

* [Video Funcionamiento](https://drive.google.com/drive/folders/1QaGmgNgGHjxJYAIH3kwpRbMmupVrKQQ0?usp=sharing)


## Tecnologías y Ejecución

El proyecto está construido utilizando las siguientes tecnologías:

* **Frontend:** React (v18.3.1) con Vite (v5.4.1) bajo entorno Node.js (v18-alpine).
* **Backend:** FastAPI (Python 3.11-slim) con SQLAlchemy como ORM.
* **Base de Datos:** PostgreSQL 15 (postgres:15-alpine).
* **Contenedores y Orquestación:** Docker (29.7.2) y Docker Compose (v5.5.0).

## Requisitos previos (dependencias)

1. **Docker Desktop** (incluye Docker Engine `29.7.2` y Docker Compose `v5.5.0` o superior).
   - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Git** (para clonar el repositorio).
   - [Descargar Git](https://git-scm.com/downloads)

## Instrucciones para levantar el entorno local

### 1. Clonar el repositorio

Abrir una terminal, clone el repositorio y luego ubíquese en el directorio raíz del proyecto:

```bash
git clone https://gitlab.inf.utfsm.cl/inf236-cc-2026-2/grupo13-2026-proyinf.git
cd grupo13-2026-proyinf
```

### 2. Iniciar el motor de contenedores

Abra **Docker Desktop** y espere a que indique **"Engine running"** antes de continuar.

### 3. Construir y levantar el proyecto

Desde la raíz del proyecto en la terminal (donde está `docker-compose.yml`), ejecute en la terminal:

```bash
docker compose up --build
```

Importante: Al levantar el proyecto por primera vez, el contenedor de la base de datos debe inicializarse, lo que toma unos segundos extra. Es posible que el backend no logre conectarse en este primer intento. Si el sistema falla o se queda pegado en la primera ejecución realiza lo siguiente desde la terminal:

```bash
Ctrl + C
docker compose up
```

### 4. Verificación del entorno

Cuando la terminal confirme que los contenedores están listos, verifique el funcionamiento desde su navegador web:

- **Frontend (Interfaz de Usuario):** Ingrese a <http://localhost:5173> (Debería ver la pantalla de inicio de Vite + React).
- **Backend (Documentación API):** Ingrese a <http://localhost:8000/docs> (Debería ver la interfaz de Swagger UI generada automáticamente por FastAPI).

### 5. Detener y limpiar recursos

Para finalizar las pruebas, apagar los contenedores y eliminar los volúmenes de datos (para borrar la base de datos temporal), ejecute en la misma terminal:

```bash
docker compose down -v
```

Si solo se desea apagar los contenedores conservando los datos, use `docker compose down`.

---

## Solución de problemas que pueden aparecer

| Problema | Posible causa | Solución |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop no está abierto | Abra Docker Desktop y espere a que indique "Engine running". |
| Puerto ocupado (`port is already allocated`) | Otro programa usa los puertos 8000, 5173 o 5432 | Cierre el programa que lo usa (como otro proyecto local o base de datos) o detenga otros contenedores activos. |
| Los cambios en el código no se reflejan | Problema de caché de los contenedores | Baje los contenedores usando `docker compose down` y vuelva a levantarlos forzando la reconstrucción: `docker compose up --build`. |
| La base de datos guarda información antigua | Los volúmenes locales conservan datos | Ejecute `docker compose down -v` para destruir el volumen de PostgreSQL y empezar con una base de datos limpia. **Atención:** Esto borrará todos los datos de prueba. |

test