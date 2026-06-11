# Proceso comercial

Describe el embudo de estados, los medios de contacto, la agenda con semáforo y el seguimiento
de referidos.

## Estados del proceso (embudo)

El avance comercial de cada productor (y de cada nota de campo) atraviesa estos estados:

1. Inicio de contacto
2. Completar datos
3. Agenda de visita
4. Visita a campo
5. Reunión en oficina
6. Asesoría
7. Presupuesto
8. En proceso
9. Negociación
10. Venta
11. No venta
12. Facturación
13. Cobranza
14. Otros

Estos estados alimentan los tableros de cumplimiento por vendedor y los comparativos de
gerencia.

## Medios y lugar de contacto

Cada contacto registra dónde ocurrió: Email, Campo, Agronomía, Oficina del cliente, Otro.

## Seguimiento por contacto

Por productor se registran sucesivos contactos. En cada uno:

- `fecha`, `medio_lugar`, `estado`
- `valor_cliente_usd` (potencial), `valor_operacion_real_usd` (lo concretado), `objetivo_usd`
- por producto: `estimado` vs `logrado`

## Agenda y semáforo de tiempos

La agenda relaciona cada actividad con las ventanas de campaña y precampaña definidas por
gerencia. Un semáforo indica el estado temporal de cada gestión:

- En término — dentro de la ventana.
- Por vencer — se acerca el cierre de la ventana.
- Vencido — fuera de la ventana sin avance.

El semáforo se usa tanto en la vista del vendedor (sus pendientes) como en la de gerencia
(control del equipo).

## Notas de campo

Registro rápido de cada contacto, cargable sin conexión:

- `fecha_contacto`, `productor`, `cultivo`
- `actividad`: uno de los estados del embudo
- `nota_visita`: texto libre, con opción de envío al cliente por WhatsApp

## Referidos

Sistema de captación de nuevos prospectos a partir de recomendaciones. Cada referido tiene su
propio embudo:

1. Envié email
2. Envié WhatsApp
3. No contesta
4. Respondido
5. Visita
6. Presupuesto
7. En proceso
8. No venta
9. Venta

Campos: nombre, email, móvil, referidor, hobbys, deportes, estado civil, edad aproximada,
observaciones, preferencias y valor cliente estimado.

## Informe semanal

Cierre y planificación del trabajo del vendedor:

- **Semana próxima**: por cliente, objetivo de reunión, estrategia, U$S de operación, fecha.
- **Semana pasada**: por cliente, objetivo de reunión, objetivo logrado, U$S de operación,
  fecha.
