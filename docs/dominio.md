# Modelo de dominio

Entidades del negocio derivadas de los requisitos y planillas del cliente. Las unidades
monetarias son U$S. Las coordenadas se almacenan como `[longitude, latitude]`.

## Usuario

Acceso por usuario con rol. Cada acción relevante registra el autor.

- `id`, `nombre`, `usuario`, `rol` (`vendedor` | `supervisor` | `gerente`).

## Producto y servicio

Catálogo cargado por administración. Se cachea localmente para consulta sin conexión.

- `id`, `codigo`
- `nombre`
- `empresa` (laboratorio / marca)
- `principio_activo`
- `presentacion`
- `precio_1`, `precio_2`, `precio_3` (listas de precio)
- `stock`

## Productor (cliente)

Ficha principal de la cartera. La carga el vendedor.

### Datos de la empresa

- `razon_social`, `cuit_rut`
- `direccion`, `localidad`, `cp`, `departamento`, `pais`
- `telefono`, `celular`, `email`, `redes`, `web`
- `anio_inicio_actividades`
- `zonas_produccion`
- `credito_acordado`

### Contactos asociados

Varios contactos por productor, cada uno con su perfil. Roles observados: contacto principal,
administrador, asistente, influenciador 1, influenciador 2.

- `nombre`, `dni`, `telefono`, `celular`, `direccion`, `email`
- `fecha_nacimiento`
- `preferencias_deportivas`, `hobbys`, `situacion_familiar`
- `redes`, `perfil_personal`, `otros_datos`

### Clasificación comercial

- `potencial_pct`
- `fidelidad`, `liderazgo`, `referidor`
- `propietario_o_arrendatario`
- `codigo_clasificacion`
- `scoring_crediticio`

### Facturación histórica

- `facturacion_2023`, `facturacion_2024`, `facturacion_2025`

### Valor Cliente (derivado)

- `valor_cliente_total`: se calcula a partir de las unidades productivas. Ver
  [valor-cliente.md](valor-cliente.md).

## Unidad productiva

Un productor tiene una o más unidades productivas.

- `id`, `productor_id`
- `georreferencia` (`[longitude, latitude]`)
- `cultivos`: lista de cultivos.

## Cultivo

- `id`, `unidad_id`
- `cultivo` (ej. Maíz, Soja, Trigo)
- `variedad`
- `superficie_ha`
- `otros`
- `insumos`: líneas de inversión del calculador de Valor Cliente.
- `valor_cultivo` (derivado), `facturacion_ciclo_anterior`, `diferencia` (derivados).

## Línea de insumo (Valor Cliente)

Cada cultivo lista insumos: Semilla, Herbicidas, Plaguicidas, Fertilizantes, Otros.

- `producto` (o categoría), `codigo`
- `unidad` (bolsa, litro, etc.)
- `unidad_x_ha`
- `usd_x_unidad`
- `total_inversion` (derivado: `superficie_ha * unidad_x_ha * usd_x_unidad`)
- `facturacion_ciclo_anterior`
- `diferencia` (derivado: `total_inversion - facturacion_ciclo_anterior`)

## Objetivo y campaña

Lo carga la gerencia.

- `objetivo_usd_por_campania_cultivo`
- `objetivo_usd_por_producto`
- `ventana_campania` / `ventana_precampania` (fechas). Alimenta el semáforo de tiempos.

## Nota de campo

Registro de contacto comercial. Debe poder cargarse sin conexión.

- `id`, `fecha_contacto`, `productor_id`, `cultivo`
- `actividad`: estado del proceso (ver [proceso-comercial.md](proceso-comercial.md)).
- `nota_visita`: texto libre, con opción de envío al cliente.
- `creado_por`, `sincronizado`.

## Proceso comercial

Seguimiento por productor a lo largo de varios contactos.

- `productor_id`
- `contactos[]`: hasta varios contactos, cada uno con `fecha`, `medio_lugar`
  (Email | Campo | Agronomía | Oficina cliente | Otro), `estado`, `valor_cliente_usd`,
  `valor_operacion_real_usd`, `objetivo_usd`.
- `productos[]`: por producto, `estimado` vs `logrado`.

## Referido

Prospecto captado por recomendación.

- `id`, `nombre`, `email`, `movil`, `referidor`
- `proceso` (estado del referido)
- `hobbys`, `deportes`, `estado_civil`, `edad_aprox`, `preferencias`
- `observaciones`, `fecha_alta`, `fecha_nacimiento`
- `valor_cliente` (estimado).

## Informe semanal

- `semana_proxima[]`: `cliente`, `objetivo_reunion`, `estrategia`, `usd_operacion`, `fecha`.
- `semana_pasada[]`: `cliente`, `objetivo_reunion`, `objetivo_logrado`, `usd_operacion`, `fecha`.

## Auditoría

Log de cambios sobre Valor Cliente y estados del proceso.

- `timestamp`, `usuario`, `rol`, `accion` (`ALTA` | `EDICION` | `CAMBIO_ESTADO`)
- `id_registro`, `campo`, `valor_anterior`, `valor_nuevo`.
