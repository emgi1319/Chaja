# Arquitectura

## Objetivo de diseño

El sistema lo usa un vendedor en el campo, sobre zonas de conectividad intermitente. La
restricción dominante no es el volumen de datos sino la **señal**: la aplicación debe permitir
cargar y consultar información sin conexión y sincronizar cuando la red vuelve, sin frenar al
usuario en ningún momento.

## Componentes

```
+-----------------------------+         +--------------------------+
|  App (Vite + React + TS)    |  HTTPS  |  API REST (PHP)          |
|  Capacitor 7 (Android)      | ------> |  X-Api-Key               |
|                             |         |                          |
|  Almacenamiento local       |         |  MySQL                   |
|  + cola de sincronización   | <------ |  (cartera, catálogo,     |
|                             |         |   procesos, auditoría)   |
+-----------------------------+         +--------------------------+
```

- **App cliente**: Vite + React 19 + TypeScript estricto + Tailwind + Zustand. Router en modo
  hash por compatibilidad con el WebView de Capacitor. Empaquetada con Capacitor para Android
  (base lista para iOS). La misma build corre en navegador para la vista de gerencia.
- **Backend**: PHP + MySQL sobre hosting. API REST autenticada con clave. Se eligió SQL sobre
  una base documental por los requisitos de agregación (comparativos entre vendedores, tableros
  de gerencia) e import/export Excel/CSV.

## Sincronización offline-first

Patrón de repositorio combinado:

1. Toda escritura (`save`) persiste **primero en el dispositivo** y marca el registro como
   `pendiente`.
2. Inmediatamente intenta subir al servidor. Si hay red, marca el registro como `sincronizado`.
3. Si no hay red, el registro queda pendiente; un sincronizador reintenta cuando
   `navigator.onLine` vuelve a ser verdadero.
4. La **lectura** se sirve siempre del almacenamiento local: el historial nunca depende de la
   conexión.

El catálogo de productos y la cartera asignada al vendedor se cachean localmente al iniciar
sesión con conexión, de modo que las pantallas de consulta funcionan sin señal.

### Resolución de conflictos

Estrategia inicial: último en escribir gana. Es suficiente porque cada vendedor opera sobre su
propia cartera y no hay edición concurrente del mismo registro por varios usuarios. Si el uso
real muestra concurrencia, se evaluará un motor de sincronización con control de versiones por
registro en una etapa posterior.

## Roles y permisos

| Rol | Alcance |
|---|---|
| Vendedor / ATC | Carga y edita su cartera: productores, unidades, cultivos, notas de campo, formularios, referidos. |
| Supervisor | Lo anterior + alertas y exportaciones. |
| Gerente | Todo + objetivos y campañas + tableros de análisis + auditoría de cambios. |

Los cambios sobre Valor Cliente y sobre estados del proceso quedan registrados en un log de
auditoría (usuario, rol, marca de tiempo, campo, valor anterior y nuevo).

## Integraciones

- **WhatsApp**: envío de notas y formularios mediante deeplink, sin dependencia de la API de
  WhatsApp Business en la primera versión.
- **Análisis con IA**: del lado servidor, sobre datos agregados; es una función de gerencia y
  requiere conexión.
- **Georreferenciación**: captura de coordenadas de unidades productivas con el GPS del
  dispositivo.
- **Excel/CSV**: importación y exportación de catálogo y cartera.

## Restricciones

- La función de análisis con IA y los tableros de gerencia son funciones en línea: no requieren
  operar sin señal porque se usan en oficina.
- La carga de campo (productores, notas, formularios) sí debe funcionar completamente sin
  conexión.
