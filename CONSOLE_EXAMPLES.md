# Ejemplos para usar en la consola del navegador

## Actualizar paciente actual
```javascript
// Cambiar el paciente actual (esto actualizará automáticamente la UI)
localStorage.setItem('pacienteActual', JSON.stringify({
  nombre: "Juan",
  apellido: "Pérez", 
  hc: "9876543"
}));

// Disparar evento storage manualmente (para simular cambio desde otra pestaña)
window.dispatchEvent(new StorageEvent('storage', {
  key: 'pacienteActual',
  newValue: localStorage.getItem('pacienteActual'),
  oldValue: null
}));
```

## Actualizar lista de pacientes
```javascript
// Agregar un nuevo paciente a la lista
let pacientes = JSON.parse(localStorage.getItem('pacientesAdmitidos') || '[]');
pacientes.push({
  nombre: "María",
  apellido: "González",
  hc: "5555555"
});
localStorage.setItem('pacientesAdmitidos', JSON.stringify(pacientes));

// Disparar evento storage
window.dispatchEvent(new StorageEvent('storage', {
  key: 'pacientesAdmitidos',
  newValue: localStorage.getItem('pacientesAdmitidos'),
  oldValue: null
}));
```

## Usando las funciones del servicio (desde el contexto de Angular)
```javascript
// Si tienes acceso al contexto de Angular, puedes usar:
// setPacienteActual({ nombre: "Carlos", apellido: "López", hc: "1111111" });
// setPacientesAdmitidos([...pacientes, nuevoPaciente]);
```

La aplicación ahora escuchará automáticamente los cambios en localStorage y actualizará la UI en tiempo real.
