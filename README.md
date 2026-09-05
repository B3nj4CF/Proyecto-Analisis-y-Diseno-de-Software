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

### Instrucciones para levantar el entorno local

1. Clonar este repositorio y abrir una terminal.
2. Posicionarse en el directorio raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`).
3. Ejecutar el siguiente comando para construir y levantar todos los servicios en segundo plano:
   ```bash
   docker compose up --build
   ```