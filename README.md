# GRUPO13-2026-PROYINF

Este es el repositorio del grupo 13, cuyos integrantes son:

- Benjamín Campos - ROL: 202473094-0
- Joaquín Hormaechea - ROL: 202473133-5
- Renato Lazilotta - ROL: 202203041-0
- Jesús Bustamante - ROL: 201941079-2
- **Ayudante:** Cristóbal Córdova

# Enlace Wiki

- [Enlace Wiki](https://gitlab.inf.utfsm.cl/inf236-cc-2026-2/grupo13-2026-proyinf/-/wikis/home)

# Video de Demostración (Hito 3)

- [Video Funcionamiento](https://drive.google.com/drive/folders/1QaGmgNgGHjxJYAIH3kwpRbMmupVrKQQ0?usp=sharing)

## Tecnologías y Ejecución

El proyecto está construido utilizando las siguientes tecnologías:

- **Frontend:** React (v18.3.1) con Vite (v5.4.1) bajo entorno Node.js.
- **Backend:** API desarrolladas con Node.js y Express, separadas en microservicios.
- **Base de Datos:** PostgreSQL 15 (`postgres:15-alpine`).
- **Contenedores y Orquestación:** Docker y Docker Compose.

## Requisitos previos (dependencias)

1. **Docker Desktop** (incluye Docker Engine y Docker Compose).
   - [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Git** (para clonar el repositorio).
   - [Descargar Git](https://git-scm.com/downloads)

## Instrucciones para levantar el entorno local

### 1. Clonar el repositorio

Abrir una terminal, clonar el repositorio y luego ubicarse en el directorio raíz del proyecto:

```bash
git clone https://gitlab.inf.utfsm.cl/inf236-cc-2026-2/grupo13-2026-proyinf.git
cd grupo13-2026-proyinf
```

### 2. Iniciar el motor de contenedores

Abra **Docker Desktop** y espere a que indique **"Engine running"** antes de continuar.

### 3. Construir y levantar el proyecto

Desde la raíz del proyecto, donde se encuentra `docker-compose.yml`, ejecute:

```bash
docker compose up --build
```

**Importante:** al levantar el proyecto por primera vez, las bases de datos deben inicializarse, por lo que el proceso puede tomar unos segundos adicionales.

Si algún servicio no logra conectarse durante el primer inicio, puede detener el proceso y volver a levantar los contenedores:

```bash
Ctrl + C
docker compose up
```

### 4. Verificación del entorno

Cuando los contenedores estén levantados, verifique el funcionamiento desde el navegador:

- **Frontend:** <http://localhost:5173>
- **API Entregables:** <http://localhost:3001>
- **API Tramitación:** <http://localhost:3002>
- **API Validaciones:** <http://localhost:8081>

### 5. Detener y limpiar recursos

Para finalizar las pruebas, apagar los contenedores y eliminar los volúmenes de datos:

```bash
docker compose down -v
```

Esto elimina también los datos almacenados en PostgreSQL.

Si solo se desea apagar los contenedores conservando los datos:

```bash
docker compose down
```

---

## Solución de problemas que pueden aparecer

| Problema | Posible causa | Solución |
|---|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop no está abierto | Abra Docker Desktop y espere a que indique "Engine running". |
| `port is already allocated` | Otro programa o contenedor utiliza alguno de los puertos necesarios | Cierre el programa correspondiente o detenga los contenedores anteriores. |
| Los cambios en el código no se reflejan | Problema de caché de los contenedores | Ejecute `docker compose down` y vuelva a levantar el proyecto con `docker compose up --build`. |
| La base de datos guarda información antigua | Los volúmenes locales conservan los datos | Ejecute `docker compose down -v` para comenzar con bases de datos limpias. **Atención:** esto elimina todos los datos de prueba. |

---

## Prueba de HU-09 - Generar reporte de estado

La HU-09 permite que Secretaría registre las calificaciones finales de una memoria, calcule la nota final ponderada y genere el reporte de estado en formato PDF.

Para utilizar esta funcionalidad, la memoria debe encontrarse previamente en estado `Habilitado para Defensa`.

Esta condición corresponde al flujo académico previo. Si se desea probar HU-09 de forma aislada y la memoria todavía no se encuentra en dicho estado, puede prepararse temporalmente desde la base de datos local:

```bash
docker exec db_tramitacion psql -U postgres -d tramitacion_db -c "UPDATE propuestas SET estado='Habilitado para Defensa' WHERE id=<ID_MEMORIA>;"
```

> **Importante:** este comando se utiliza únicamente para pruebas locales de HU-09. En el funcionamiento normal del sistema, Secretaría no debe utilizar consola ni modificar directamente la base de datos.

Una vez que la memoria se encuentre habilitada para defensa:

1. Ingrese a <http://localhost:5173>.
2. Seleccione el rol **Secretaría**.
3. Ingrese a la sección **Reportes**.
4. Seleccione la memoria correspondiente.
5. Ingrese la nota escrita y la nota oral.
6. Presione **Guardar notas** y verifique el cálculo de la nota final.
7. Presione **Generar reporte**.
8. Utilice **Descargar PDF** y verifique que el documento contenga los antecedentes, calificaciones e historial disponible de la memoria.