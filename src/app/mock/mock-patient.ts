import { signal, effect } from "@angular/core";
import { PacienteActual, PacienteAdmitido } from "../models/patient.interface";

// Obtiene el paciente actual desde localStorage
export function getPacienteActual(): PacienteActual | null {
  try {
    const data = localStorage.getItem('pacienteActual');
    if (!data) return null;
    
    // Intentar parsear como JSON
    const parsed = JSON.parse(data);
    
    // Validar que tenga las propiedades necesarias
    if (parsed && typeof parsed === 'object' && parsed.nombre && parsed.apellido && parsed.hc) {
      return parsed as PacienteActual;
    } else {
      console.warn('pacienteActual malformado, limpiando localStorage');
      localStorage.removeItem('pacienteActual');
      return null;
    }
  } catch (error) {
    console.error('Error parsing pacienteActual from localStorage:', error);
    console.warn('Limpiando pacienteActual corrupto');
    localStorage.removeItem('pacienteActual');
    return null;
  }
}

// Obtiene la lista de pacientes admitidos desde localStorage
export function getPacientesAdmitidos(): PacienteAdmitido[] {
  try {
    const data = localStorage.getItem('pacientesAdmitidos');
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    
    // Validar que sea un array
    if (Array.isArray(parsed)) {
      // Filtrar solo objetos válidos
      const validPatients = parsed.filter(p => 
        p && typeof p === 'object' && p.nombre && p.apellido && p.hc
      );
      return validPatients as PacienteAdmitido[];
    } else {
      console.warn('pacientesAdmitidos malformado, limpiando localStorage');
      localStorage.removeItem('pacientesAdmitidos');
      return [];
    }
  } catch (error) {
    console.error('Error parsing pacientesAdmitidos from localStorage:', error);
    console.warn('Limpiando pacientesAdmitidos corrupto');
    localStorage.removeItem('pacientesAdmitidos');
    return [];
  }
}

// Signal reactivo para el paciente actual
export const pacienteActualSignal = signal<PacienteActual | null>(null);

// Signal reactivo para la lista de pacientes admitidos
export const pacientesAdmitidosSignal = signal<PacienteAdmitido[]>([]);

// Función para inicializar los signals desde localStorage
export function initializeFromLocalStorage() {
  const pacientes = getPacientesAdmitidos();
  const pacienteActual = getPacienteActual();
  
  // Si no hay pacientes, crear datos por defecto
  if (pacientes.length === 0) {
    const defaultPatients: PacienteAdmitido[] = [
      { nombre: "TEST", apellido: "Prueba", hc: "1234567" },
      { nombre: "Ana", apellido: "García", hc: "2345678" },
      { nombre: "Luis", apellido: "Martínez", hc: "3456789" }
    ];
    setPacientesAdmitidos(defaultPatients);
  } else {
    pacientesAdmitidosSignal.set(pacientes);
  }
  
  pacienteActualSignal.set(pacienteActual);
}

// Función para actualizar el paciente actual
export function setPacienteActual(paciente: PacienteActual | null) {
  if (paciente) {
    localStorage.setItem('pacienteActual', JSON.stringify(paciente));
  } else {
    localStorage.removeItem('pacienteActual');
  }
  pacienteActualSignal.set(paciente);
}

// Función para actualizar la lista de pacientes admitidos
export function setPacientesAdmitidos(pacientes: PacienteAdmitido[]) {
  localStorage.setItem('pacientesAdmitidos', JSON.stringify(pacientes));
  pacientesAdmitidosSignal.set(pacientes);
}

// Listener para cambios en localStorage desde otras pestañas/ventanas
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'pacienteActual') {
      pacienteActualSignal.set(getPacienteActual());
    }
    if (e.key === 'pacientesAdmitidos') {
      pacientesAdmitidosSignal.set(getPacientesAdmitidos());
    }
  });
}