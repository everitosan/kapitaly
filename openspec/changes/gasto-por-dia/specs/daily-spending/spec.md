# Spec Delta

## Purpose

Muestra en Análisis cuánto se gasta cada día, sobre todo en gastos únicos, que es lo que se decide día a día, para que la persona sea consciente de sus hábitos de gasto y no solo los registre.

## ADDED Requirements

### Requirement: Tarjeta Gasto del día a día
La vista Análisis SHALL mostrar la tarjeta "Gasto del día a día" al final, después de "Por método", en el mes actual y en meses pasados, con el mismo formato que "Por categoría": tarjeta sin color de fondo y encabezado con el nombre del mes. En un mes futuro no SHALL mostrarse. La tarjeta SHALL aclarar qué cuenta: "Solo gastos únicos: lo que decides cada día" o, con domiciliados, "Gastos únicos y domiciliados".

#### Scenario: Mes actual
- **WHEN** hoy es 21/11/2026 y el usuario abre Análisis de noviembre 2026
- **THEN** "Gasto del día a día" es la última sección, después de "Por método", con "noviembre" en su encabezado

#### Scenario: Mes futuro
- **WHEN** hoy es 21/11/2026 y el usuario avanza a diciembre 2026 en Análisis
- **THEN** no aparece la tarjeta "Gasto del día a día"

### Requirement: Incluir domiciliados
La tarjeta SHALL tener un switch "Incluir domiciliados", apagado por omisión. Su valor SHALL guardarse en el teléfono y conservarse entre aperturas de la app y al cambiar de mes.

#### Scenario: Por omisión
- **WHEN** el usuario abre Análisis por primera vez
- **THEN** "Incluir domiciliados" está apagado y la tarjeta solo cuenta gastos únicos

#### Scenario: Se recuerda
- **WHEN** el usuario enciende "Incluir domiciliados", cierra la app y la vuelve a abrir
- **THEN** el switch sigue encendido

### Requirement: Qué gastos cuenta cada día
Con el switch apagado, la tarjeta SHALL contar solo los gastos únicos vigentes del mes, en su fecha y con su monto. Con el switch encendido, SHALL sumar además los cobros recurrentes del mes en su fecha: los cobrados, con el monto confirmado; y los por confirmar, con el monto de la regla. Los marcados como no cobrados no SHALL contar. Los por cobrar no SHALL sumar en las cifras, pero sí SHALL verse en la gráfica.

#### Scenario: Recurrentes fuera por omisión
- **WHEN** el switch está apagado y en noviembre 2026 hay Renta mensual ($1,500.00, día 20) y el único "Tacos" ($250.00, 10/11/2026)
- **THEN** la barra del 20 de noviembre está vacía y la del 10 suma $250.00

#### Scenario: Únicos del mismo día
- **WHEN** el 07/11/2026 hay los únicos "Súper" ($350.00) y "Uber" ($70.00)
- **THEN** la barra del 7 de noviembre suma $420.00

#### Scenario: Con domiciliados
- **WHEN** hoy es 21/11/2026, el switch está encendido, Netflix ($219.00, día 15) se confirmó como cobrado con $239.00 y el único "Cine" ($180.00) es del 15/11/2026
- **THEN** la barra del 15 de noviembre suma $419.00: $180.00 de únicos y $239.00 de domiciliados

#### Scenario: Domiciliado por confirmar y no cobrado
- **WHEN** hoy es 21/11/2026, el switch está encendido, la Renta ($1,500.00, día 20) no se ha confirmado y el Gym ($500.00, día 18) se marcó como no cobrado
- **THEN** la barra del 20 suma $1,500.00 de domiciliados y la del 18 no suma nada por el Gym

### Requirement: Cifras del mes
La tarjeta SHALL mostrar, en tres recuadros del mismo tamaño, el total del mes ("$995 en el mes", en pesos sin centavos), el promedio por día ("~$47 al día") y los días sin registros. El promedio SHALL ser el total entre los días transcurridos, redondeado a pesos. En el mes actual, los días transcurridos van del inicio del mes hasta hoy, inclusive. En un mes pasado, es el mes completo. En ambos, si el primer registro en la app es posterior al inicio del mes, se cuenta desde ese día.

#### Scenario: Promedio en el mes actual
- **WHEN** hoy es 21/11/2026, la app se usa desde octubre, el switch está apagado y los únicos de noviembre suman $995.00
- **THEN** la tarjeta muestra "$995" en el mes y "~$47" al día

#### Scenario: Promedio con domiciliados
- **WHEN** en el mismo caso el switch está encendido y los domiciliados cobrados o por confirmar de noviembre suman $1,739.00
- **THEN** la tarjeta muestra "$2,734" en el mes y "~$130" al día

#### Scenario: Mes pasado
- **WHEN** el usuario consulta octubre 2026 con el switch apagado, con únicos que suman $3,100.00
- **THEN** la tarjeta muestra "~$100" al día

#### Scenario: Empezó a usar la app a mitad de mes
- **WHEN** el primer registro en la app fue el 11/11/2026, hoy es 20/11/2026, el switch está apagado y los únicos de noviembre suman $500.00
- **THEN** la tarjeta muestra "~$50" al día

### Requirement: Días sin registros
La tarjeta SHALL contar los días del mes sin ningún gasto único registrado ("15 días sin registros", "1 día sin registros"), sin importar el switch: los domiciliados no SHALL contar como registro. Solo SHALL contar días ya terminados (en el mes actual, hasta ayer) y posteriores o iguales al primer registro en la app. Con cero días, SHALL mostrar "Registraste todos los días".

#### Scenario: Días sin registros en el mes actual
- **WHEN** hoy es 21/11/2026, la app se usa desde octubre y hay únicos los días 3, 7, 8, 10 y 15 de noviembre
- **THEN** la tarjeta muestra 15 días sin registros

#### Scenario: Un domiciliado no es un registro
- **WHEN** en el mismo caso el switch está encendido y la Renta se cobra el 20 de noviembre
- **THEN** la tarjeta sigue mostrando 15 días sin registros

#### Scenario: Hoy no cuenta todavía
- **WHEN** hoy es 21/11/2026 y aún no hay únicos del 21
- **THEN** el 21 de noviembre no cuenta como día sin registros

#### Scenario: Antes de usar la app
- **WHEN** el primer registro en la app fue el 11/11/2026, hoy es 14/11/2026 y hay únicos el 11 y el 13
- **THEN** la tarjeta muestra 1 día sin registros

#### Scenario: Todos los días
- **WHEN** todos los días terminados del mes tienen al menos un único
- **THEN** la tarjeta muestra "Registraste todos los días"

### Requirement: Gráfica de barras por día
La tarjeta SHALL mostrar una barra por cada día del mes, en el color de la tinta, con altura proporcional al gasto del día respecto al día mayor del mes, y el día del mes debajo, al menos cada 5 días. La barra del día seleccionado SHALL llevar el degradado azul-violeta de la app. Los días posteriores a hoy SHALL verse punteados. Un día sin gasto no SHALL tener barra.

#### Scenario: Escala por el día mayor
- **WHEN** el día de mayor gasto en noviembre es el 7, con $420.00, y el 10 tiene $210.00
- **THEN** la barra del 10 mide la mitad que la del 7

#### Scenario: Días por venir
- **WHEN** hoy es 21/11/2026 y el switch está apagado
- **THEN** los días del 22 al 30 de noviembre se ven punteados

#### Scenario: Mes sin gastos
- **WHEN** noviembre 2026 no tiene nada que contar según el switch
- **THEN** la tarjeta muestra "$0" en el mes y un texto que invita a registrar, sin barras

### Requirement: Domiciliados apilados en la gráfica
Con el switch encendido, la parte de domiciliados de cada día SHALL apilarse encima de la de únicos en un tono neutro, y una leyenda SHALL nombrar "Únicos" y "Domiciliados". Un domiciliado por cobrar SHALL verse como contorno punteado de su altura. Con el switch apagado no SHALL haber leyenda.

#### Scenario: Apilado con domiciliados
- **WHEN** el switch está encendido y el 15 de noviembre tiene $180.00 de únicos y $239.00 de domiciliados
- **THEN** la barra del 15 tiene abajo una parte de $180.00 y encima una neutra de $239.00

#### Scenario: Domiciliado por cobrar
- **WHEN** hoy es 21/11/2026, el switch está encendido e Internet ($450.00) se cobra el 28/11/2026
- **THEN** el 28 de noviembre muestra un contorno punteado de la altura de $450.00 que no suma en el total

### Requirement: Elegir un día
El usuario SHALL poder elegir un día tocando la gráfica o deslizando el dedo sobre ella: el día elegido SHALL seguir al dedo, con una vibración leve en cada cambio de día. Junto a la fecha del día elegido SHALL haber flechas para ir al día anterior y al siguiente, deshabilitadas en el primer y el último día del mes. La barra elegida SHALL mostrar un globo con el monto del día. En el mes actual SHALL abrir con hoy elegido; en un mes pasado, sin día elegido.

#### Scenario: Deslizar el dedo
- **WHEN** el usuario toca el día 5 y desliza el dedo hasta el 7
- **THEN** el día elegido pasa por el 5, el 6 y el 7, vibra al entrar a cada uno y termina en el 7 con el globo "$420.00"

#### Scenario: Flechas
- **WHEN** el 7 de noviembre está elegido y el usuario toca la flecha del día siguiente
- **THEN** queda elegido el 8 de noviembre

#### Scenario: Límite del mes
- **WHEN** el 30 de noviembre está elegido
- **THEN** la flecha del día siguiente está deshabilitada

#### Scenario: Apertura en el mes actual
- **WHEN** hoy es 21/11/2026 y el usuario abre Análisis
- **THEN** el 21 de noviembre aparece elegido

#### Scenario: Apertura en un mes pasado
- **WHEN** el usuario retrocede a octubre 2026
- **THEN** ningún día aparece elegido y no se muestra la lista del día

### Requirement: Lista del día elegido
Debajo de la gráfica SHALL aparecer la fecha del día elegido con el día de la semana, su total y la lista de lo que lo forma (concepto y monto). Primero van los únicos, por hora de registro; con el switch encendido, después van los domiciliados con la marca "DOMICILIADO", o "POR COBRAR" si aún no llega su fecha.

#### Scenario: Día con únicos
- **WHEN** el usuario elige el 7 de noviembre, con "Súper" ($350.00) y "Uber" ($70.00)
- **THEN** debajo aparecen "Sábado 7 nov", "$420.00", "Súper $350.00" y "Uber $70.00"

#### Scenario: Día con domiciliado
- **WHEN** el switch está encendido y el usuario elige el 15 de noviembre
- **THEN** debajo aparecen "Cine $180.00" y "Netflix $239.00" con la marca "DOMICILIADO"

#### Scenario: Día sin registros
- **WHEN** el usuario elige el 12 de noviembre, que no tiene gastos
- **THEN** debajo aparece "Jueves 12 nov" con el texto "Sin registros este día"

### Requirement: Gráfica accesible
Para el lector de pantalla, la gráfica SHALL ser un solo elemento ajustable que anuncia el día elegido con su fecha y monto ("7 de noviembre, $420.00", "12 de noviembre, sin registros" o, con domiciliados, "15 de noviembre, $419.00, $239.00 domiciliado"). Las acciones de aumentar y disminuir SHALL pasar al día siguiente y al anterior. Las flechas y el switch SHALL tener etiquetas accesibles. La gráfica SHALL ser legible en claro y oscuro.

#### Scenario: Lector de pantalla en la gráfica
- **WHEN** el 7 de noviembre está elegido y TalkBack llega a la gráfica
- **THEN** anuncia "7 de noviembre, $420.00" como elemento ajustable

#### Scenario: Ajustar con el lector de pantalla
- **WHEN** TalkBack está en la gráfica con el 7 elegido y el usuario desliza hacia arriba para aumentar
- **THEN** queda elegido el 8 de noviembre y se anuncia "8 de noviembre, $100.00"
