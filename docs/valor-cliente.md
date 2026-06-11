# Valor Cliente

Es el núcleo del método de Agroventa de Precisión. Mide el **potencial total de compra** de un
productor a lo largo de su campaña y lo compara contra lo que efectivamente nos compró el ciclo
anterior. La diferencia es la oportunidad de venta concreta.

## Cálculo

Para cada cultivo de una unidad productiva se cargan sus insumos (semilla, herbicidas,
plaguicidas, fertilizantes, otros). Por cada línea de insumo:

```
total_inversion = superficie_ha * unidad_x_ha * usd_x_unidad
diferencia      = total_inversion - facturacion_ciclo_anterior
```

Agregaciones:

```
valor_cultivo        = Σ total_inversion de los insumos del cultivo
diferencia_cultivo   = Σ diferencia de los insumos del cultivo
valor_cliente_total  = Σ valor_cultivo de todos los cultivos del productor
diferencia_total     = Σ diferencia_cultivo de todos los cultivos
```

- `valor_cultivo` / `valor_cliente_total`: lo que el productor invierte (su potencial).
- `diferencia`: lo que invierte pero **no** nos compra. Es la oportunidad sobre la que trabaja
  el equipo comercial.

## Ejemplo

Productor con tres cultivos:

| Cultivo | Superficie | Insumo | Unidad/ha | U$S/unidad | Inversión | Fact. anterior | Diferencia |
|---|---:|---|---:|---:|---:|---:|---:|
| Maíz | 300 ha | Semilla | 1 | 300 | 90.000 | 70.000 | 20.000 |
| Maíz | 300 ha | Glifosato | 10 | 4,5 | 13.500 | 9.000 | 4.500 |
| Soja | 150 ha | Semilla | 1 | 180 | 27.000 | 24.000 | 3.000 |
| Soja | 150 ha | Herbicida | 10 | 4,5 | 6.750 | 0 | 6.750 |
| Trigo | 150 ha | Semilla | 1 | 180 | 27.000 | 23.000 | 4.000 |
| Trigo | 150 ha | Herbicida | 10 | 4,5 | 6.750 | 0 | 6.750 |

Totales del ejemplo (con las líneas completas de cada cultivo):

| | Valor cultivo | Diferencia |
|---|---:|---:|
| Cultivo 1 (Maíz) | 103.500 | 24.500 |
| Cultivo 2 (Soja) | 33.750 | 9.750 |
| Cultivo 3 (Trigo) | 33.750 | 10.750 |
| **Total cliente** | **171.000** | **45.000** |

Interpretación: el productor tiene un potencial de U$S 171.000 por campaña; U$S 45.000 de ese
potencial hoy no nos los compra. Ese es el objetivo comercial concreto.

## Alertas

Cuando la facturación del ciclo anterior supera la inversión calculada (diferencia negativa),
significa una caída respecto al ciclo previo: el sistema lo marca como alerta para la gerencia.

## Auditoría

Toda alta o modificación de un Valor Cliente y todo cambio de estado quedan registrados
(usuario, rol, marca de tiempo, valor anterior y nuevo), para que la gerencia siga la evolución
de cada cuenta.
