import { PacienteActual, PacienteAdmitido } from "../models/patient.interface";

// Obtiene el paciente actual desde localStorage
export function getPacienteActual(): PacienteActual | null {
  const data = localStorage.getItem('pacienteActual');
  return data ? JSON.parse(data) as PacienteActual : null;
}

// Obtiene la lista de pacientes admitidos desde localStorage
export function getPacientesAdmitidos(): PacienteAdmitido[] {
  const data = localStorage.getItem('pacientesAdmitidos');
  return data ? JSON.parse(data) as PacienteAdmitido[] : [];
}