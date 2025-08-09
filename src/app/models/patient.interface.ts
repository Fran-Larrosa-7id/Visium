export interface EyeValues { S: string; C: string; A: string; }
export interface AutoRefraction {
  fecha: string;          // ej: '01-07-2025'
  DV: number | string;    // Distancia vértice
  OD: EyeValues;          // Ojo derecho
  OI: EyeValues;          // Ojo izquierdo
}

export interface Patient {
  id: number;
  nombre: string;
  dni: string;
  hc: string;
  telefono: string;
  nacimiento: string;
  edad: number;
  cobertura: string;
  ultimaVisita: string;
  autorefracciones: AutoRefraction[]; // 1 o 2 items
}
