# Visium

Visium es una aplicación Angular para la gestión y visualización de datos de auto-refracción oftalmológica.

## Características principales
- Visualización de datos de auto-refracción de pacientes.
- Vinculación de una carpeta local para guardar y leer archivos .dat.
- Guardado de resultados en formato .dat con nombre personalizado según modelo, fecha, hora, historia clínica y apellido.
- Interfaz moderna y responsive, optimizada para monitores y escritorio.
- Listado de pacientes y selección rápida.
- Visualización de tablas de keratometría y cards informativas.
- Permite actualizar y guardar los datos fácilmente.

## Formato de archivo .dat
El archivo .dat se guarda con el siguiente formato de nombre:
```
Modelo - id de trabajo - Anio - Mes - Dia - Hora - minutos - historia clinica - 4 letras del apellido.dat
```
Si no hay paciente seleccionado, se usan guiones en nombre e historia clínica.

## Uso
1. Vincula una carpeta local usando el botón "Vincular carpeta .dat".
2. Selecciona un paciente y visualiza sus datos.
3. Guarda los resultados usando el botón "Guardar". El archivo se guardará en la carpeta vinculada.
4. Puedes actualizar los datos con el botón "Actualizar".

## Requisitos
- Node.js y npm
- Angular CLI

## Instalación
```sh
npm install
```

## Ejecución
```sh
ng serve
```

## Estructura del proyecto
- `src/app/` - Componentes principales, servicios y modelos.
- `src/assets/` - Imágenes y recursos gráficos.
- `public/` - Archivos públicos.

## Autor
Fran Larrosa


