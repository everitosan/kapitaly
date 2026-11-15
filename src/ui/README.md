# src/ui

Sistema de diseño A-1 Duotono: tokens, tema y componentes base.

## Reglas de interacción

- **Cancelar a la izquierda, confirmar a la derecha o abajo.** La acción que cancela, cierra o
  pospone ("Cancelar", "Cerrar", "Posponer") va siempre a la izquierda. La que confirma va a la
  derecha, o abajo a todo lo ancho cuando hay más de dos acciones. En las hojas modales,
  "Cancelar" o "Cerrar" va en la barra superior izquierda (`SheetLayout`). En las alertas,
  "Cancelar" va primero en el arreglo de botones con `style: 'cancel'`.
- **Rojo para lo que pide atención.** El rojo sólido (`danger`) se reserva para errores y para
  eliminar. Los avisos que piden atención sin ser un error, como la campana de pendientes, usan
  el tinte suave `alertBg` con `alertInk`.
