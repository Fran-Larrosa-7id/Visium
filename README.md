# Visium

Visium es una aplicación Angular para la gestión y visualización de datos de auto-refracción oftalmológica que opera completamente a través de HTTP, eliminando la necesidad de permisos de sistema de archivos y configuraciones complejas.

## 🚀 Características principales

- **Lectura automática**: Carga automáticamente el último archivo .dat disponible desde el servidor
- **Interfaz simplificada**: Sin configuraciones complejas ni permisos de carpetas
- **Visualización completa**: Tablas de keratometría, datos de refracción y información del paciente
- **Guardado en servidor**: Los archivos se guardan directamente en el servidor web
- **Historial integrado**: Acceso a todos los archivos guardados desde el panel lateral
- **Responsive design**: Optimizada para monitores y dispositivos de escritorio

## 🏗️ Arquitectura HTTP

### Estructura de directorios del servidor
```
servidor_web/
└── treelan/
    ├── datLectura/          # Archivos originales del equipo
    │   └── archivo_equipo.dat
    └── datDownload/         # Archivos procesados y guardados
        ├── upload.php       # Script de guardado
        └── archivo_guardado.dat
```

### Flujo de datos
1. **Lectura**: La aplicación lee automáticamente desde `datLectura/`
2. **Procesamiento**: El usuario puede editar información del paciente
3. **Guardado**: Los datos se envían via POST a `datDownload/upload.php`
4. **Historial**: Se accede a archivos guardados desde `datDownload/`

## 📁 Formato de archivo .dat

Los archivos se guardan con el siguiente formato de nombre:
```
Modelo-WorkID-AAAA-MM-DD-HH-MM-HistoriaClinica-APEL.dat
```

**Ejemplo:**
```
KR8900-0893-2024-07-04-12-47-8237-RODR.dat
```

## 🔧 Configuración del servidor (Apache/XAMPP)

### 1. Estructura de carpetas
Crear en el directorio web (ej: `C:/xampp/htdocs/`):
```
treelan/
├── datLectura/
└── datDownload/
    └── upload.php
```

### 2. Script PHP de guardado (`upload.php`)
```php
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $filename = $_POST['filename'] ?? '';
    $content = $_POST['content'] ?? '';
    
    if (empty($filename) || empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Filename and content are required']);
        exit();
    }
    
    if (!str_ends_with($filename, '.dat')) {
        http_response_code(400);
        echo json_encode(['error' => 'Only .dat files are allowed']);
        exit();
    }
    
    if (file_put_contents($filename, $content)) {
        http_response_code(200);
        echo json_encode(['success' => true, 'message' => 'Archivo guardado exitosamente']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Error al guardar archivo']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
}
?>
```

### 3. Configuración de URLs
En `src/app/services/file.service.ts`:
```typescript
private readonly BASE_URL = 'http://localhost/treelan/datLectura/';
private readonly DOWNLOAD_URL = 'http://localhost/treelan/datDownload/';
private readonly UPLOAD_SCRIPT = 'http://localhost/treelan/datDownload/upload.php';
```

## 💻 Instalación y uso

### Prerequisitos
- Node.js y npm
- Angular CLI
- Servidor web (Apache/XAMPP/NGINX)

### Instalación
```bash
# Clonar repositorio
git clone <repository-url>
cd mockOjos

# Instalar dependencias
npm install

# Ejecutar en desarrollo
ng serve
```

### Acceso
La aplicación estará disponible en: `http://localhost:4200/treelan/Visium`

## 🎯 Uso de la aplicación

1. **Inicio automático**: Al abrir, carga automáticamente el último archivo .dat disponible
2. **Actualizar datos**: Usar el botón "Actualizar" para cargar el archivo más reciente
3. **Editar información**: Completar nombre y historia clínica del paciente
4. **Guardar archivo**: El botón "Guardar" almacena el archivo en el servidor
5. **Acceder al historial**: Panel derecho muestra todos los archivos guardados

## 🏢 Estructura del proyecto

```
src/
├── app/
│   ├── services/
│   │   ├── file.service.ts          # Gestión HTTP de archivos
│   │   ├── data-parser.service.ts   # Parseo de archivos .dat
│   │   └── refraction-data.service.ts
│   ├── patient-detail/              # Componente principal
│   ├── patient-list/                # Lista de pacientes
│   ├── history/                     # Panel de historial
│   └── models/                      # Interfaces TypeScript
├── assets/                          # Recursos gráficos
└── styles.scss                     # Estilos globales
```

## 🚫 Eliminado en esta versión

- ❌ File System Access API
- ❌ Configuración de Chrome flags
- ❌ Permisos de carpetas locales
- ❌ IndexedDB para persistencia
- ❌ Problemas de contexto seguro
- ❌ Botones de vinculación de carpetas
- ❌ Modales de configuración complejos

## ✅ Beneficios del nuevo enfoque

- **Simplicidad**: Sin configuraciones complejas para el usuario final
- **Compatibilidad**: Funciona en cualquier navegador moderno
- **Centralización**: Todos los archivos en el servidor
- **Colaboración**: Múltiples usuarios pueden acceder a los mismos datos
- **Mantenimiento**: Fácil gestión desde el servidor


---

## 📝 Notas de versión

**v2.0** - Migración a arquitectura HTTP
- Eliminación completa de File System Access API
- Implementación de lectura/escritura HTTP
- Simplificación radical de la interfaz de usuario
- Separación clara entre archivos de lectura y guardado


