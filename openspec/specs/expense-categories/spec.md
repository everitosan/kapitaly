# expense-categories Specification

## Purpose

Clasifica cada gasto en una categoría de un catálogo con categorías de inicio compartidas por la suite Kapitaly y categorías personalizadas del usuario, para poder agrupar los gastos en los balances.

## Requirements

### Requirement: Categorías de inicio
La app SHALL incluir desde la primera apertura, sin conexión, las categorías Hogar, Comida, Transporte, Servicios, Suscripciones, Salud, Entretenimiento y Otro. Cada categoría de inicio SHALL tener un identificador fijo, el mismo en todas las instalaciones y apps de la suite, y un ícono predeterminado.

#### Scenario: Primera apertura
- **WHEN** el usuario abre la app por primera vez
- **THEN** la pantalla Categorías muestra las 8 categorías de inicio, cada una con su ícono

#### Scenario: Mismo identificador en otra instalación
- **WHEN** se instala la app en otro teléfono
- **THEN** la categoría Comida tiene el mismo identificador que en el primero

### Requirement: Categoría "Otro" fija
La categoría "Otro" SHALL existir siempre: no SHALL poder renombrarse, ocultarse, borrarse ni cambiar de ícono.

#### Scenario: Otro no ofrece acciones de edición
- **WHEN** el usuario abre "Otro" en la pantalla Categorías
- **THEN** no hay opciones para renombrarla, ocultarla, borrarla ni cambiar su ícono

### Requirement: Ocultar una categoría de inicio
El usuario SHALL poder ocultar y volver a mostrar cualquier categoría de inicio distinta de "Otro", y cambiar su ícono. No SHALL poder renombrarla ni borrarla. Una categoría oculta no SHALL ofrecerse para gastos nuevos, y los gastos que ya la tienen SHALL conservarla y mostrarla.

#### Scenario: Ocultar Salud
- **WHEN** el usuario oculta "Salud" y existe el gasto "Farmacia" con esa categoría
- **THEN** "Salud" no aparece en el selector al crear un gasto, y "Farmacia" sigue mostrándose con "Salud"

#### Scenario: Volver a mostrarla
- **WHEN** el usuario vuelve a mostrar "Salud"
- **THEN** "Salud" vuelve a ofrecerse en el selector de categoría

#### Scenario: Sin renombrar
- **WHEN** el usuario abre "Comida"
- **THEN** puede cambiar su ícono y ocultarla, pero no cambiar su nombre ni borrarla

### Requirement: Categorías personalizadas
El usuario SHALL poder crear categorías con un nombre y un ícono del set de la app, y renombrarlas o cambiar su ícono después. El nombre SHALL ser obligatorio y no SHALL repetir, sin distinguir mayúsculas ni acentos, el de otra categoría vigente.

#### Scenario: Crear Gimnasio
- **WHEN** el usuario crea la categoría "Gimnasio" con un ícono del set
- **THEN** "Gimnasio" aparece en la pantalla Categorías y en el selector del formulario de gasto

#### Scenario: Nombre repetido
- **WHEN** el usuario intenta crear la categoría "comida"
- **THEN** no se guarda y se indica que ya existe una categoría con ese nombre

#### Scenario: Nombre vacío
- **WHEN** el usuario intenta guardar una categoría sin nombre
- **THEN** no se guarda y se indica que el nombre es obligatorio

### Requirement: Borrar una categoría personalizada
El usuario SHALL poder borrar una categoría personalizada previa confirmación. Los gastos que la tenían SHALL mostrarse y contarse como "Otro". La categoría SHALL conservarse internamente marcada como eliminada con su fecha de eliminación.

#### Scenario: Borrar Gimnasio con gastos
- **WHEN** el usuario borra "Gimnasio" y confirma, y el gasto recurrente "Smart Fit" la tenía
- **THEN** "Gimnasio" deja de aparecer en Categorías y en el selector, y "Smart Fit" se muestra con "Otro"

### Requirement: Íconos de categoría consistentes entre plataformas
Cada categoría SHALL mostrarse con un ícono elegido de un set fijo de la app, que se ve igual en Android, iOS y web. El usuario no SHALL poder usar emojis ni subir imágenes como ícono.

#### Scenario: Elegir ícono
- **WHEN** el usuario crea o edita una categoría
- **THEN** elige su ícono de una cuadrícula con los íconos del set

### Requirement: Metadatos de las categorías
Cada categoría personalizada SHALL tener un identificador único global generado en el dispositivo. Toda categoría SHALL tener fecha de creación inmutable y fecha de última actualización que cambia con cada edición, ocultamiento o eliminación.

#### Scenario: Renombrar conserva la identidad
- **WHEN** el usuario renombra "Gimnasio" a "Deporte"
- **THEN** su identificador y su fecha de creación no cambian y su fecha de última actualización es posterior a la anterior
