# HU-09 — Validación y demostración

## Pruebas automatizadas incluidas

Desde `API_VALIDACIONES`: `node --test test/*.test.js`.

Cobertura: cálculos 85/90 → 87, 78/82 → 80, 75/27 → 56, límites 0/100, rechazo de enteros fuera de rango, decimales y cadenas. Además `cierreHu09.test.js` agrega cuatro pruebas: rechazo HTTP 403 a Secretaría, rechazo a otros roles, no implementación de cierre real en HU-09 y validación de la entrada.

## Escenario de prueba a ejecutar con el frontend

1. Crear una propuesta nueva como Memorista, con su PDF y antecedentes.
2. Debe completarse **HU-08** para que la propuesta pase al estado `Habilitado para Defensa`. Esta transición **no** está incluida en HU-09; no manipular la base de datos en el código final.
3. Entrar como Secretaría desde el simulador de roles del proyecto y seleccionar la memoria habilitada.
4. Ingresar dos notas enteras 85 y 90; confirmar en la interfaz el resultado 87.
5. Guardar notas; generar reporte; descargar PDF; comprobar que aparecen antecedentes, notas, historial de entregables y evaluaciones existentes.
6. Cambiar notas a 78 y 82; comprobar resultado 80, estado del reporte no emitido y necesidad de regenerarlo.
7. Probar rechazo al ingresar una nota decimal o fuera de rango y al elegir una propuesta en revisión.
8. Verificar desde una prueba HTTP automatizada, fuera de la interfaz de usuario, que el backend rechaza el cierre solicitado por Secretaría con HTTP 403, menciona la exclusividad del Jefe de Carrera y conserva el estado de la memoria.
9. Confirmar también desde PowerShell que el endpoint `PATCH /api/procesos/:id/estado` rechaza el intento y no altera los datos (ver bloque de evidencia abajo).

## Evidencia reproducible del criterio 3 (Windows PowerShell 5.1)

Ejecutar con una propuesta ya existente (sustituir el ID 1 si corresponde):

```powershell
$id = 1
$antes = Invoke-RestMethod -Uri "http://localhost:3002/api/propuestas/$id"
try {
    Invoke-RestMethod -Uri "http://localhost:8081/api/procesos/$id/estado" `
        -Method PATCH -Headers @{ 'X-Demo-Role' = 'secretaria' } `
        -ContentType 'application/json' -Body '{"estado":"Cerrado"}'
    throw 'ERROR: el servidor acepto el intento de cierre.'
} catch {
    if ($_.Exception.Message -like 'ERROR:*') { throw }
    $codigo = [int]$_.Exception.Response.StatusCode
    $detalle = $_.ErrorDetails.Message
    Write-Host "HTTP de rechazo: $codigo"
    Write-Host "Mensaje: $detalle"
    if ($codigo -ne 403 -or $detalle -notmatch 'Jefe de Carrera') { throw 'El rechazo no cumple el criterio 3.' }
}
$despues = Invoke-RestMethod -Uri "http://localhost:3002/api/propuestas/$id"
if ($antes.estado -ne $despues.estado) { throw 'ERROR: cambio el estado de la memoria.' }
Write-Host "Estado antes y despues: $($despues.estado)"
Write-Host 'CRITERIO HU-09-3 APROBADO: cierre rechazado, estado intacto.'
```

Para capturas de pantalla, mostrar la interfaz habitual de Secretaría (memoria, notas y reporte) y, como evidencia técnica separada, la respuesta HTTP 403 de PowerShell o de las pruebas. El rechazo se prueba contra la API, no mediante un botón artificial en la interfaz ni ejecutando HU-10.

## Comprobaciones técnicas antes de una MR

```powershell
cd C:\Users\Usuario\INF236-HU09-HITO4
node --test API_VALIDACIONES/test/notas.test.js API_VALIDACIONES/test/cierreHu09.test.js
docker compose up -d --build
docker compose exec -T frontend npm run build
git diff --check
git status --short
```

Importante: `docker compose down` **sin** `-v` evita eliminar volúmenes existentes. Los nombres fijos de contenedores impiden levantar dos copias simultáneamente; detener la copia anterior antes de levantar la nueva. El modo de prueba Hito 4 depende de la memoria habilitada por HU-08.
