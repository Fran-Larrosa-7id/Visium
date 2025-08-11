export interface EyeValues { S: string | null; C: string | null; A: string | null; }
export interface KValue { D: number | null; MM: number | null; A: number | null; }
export interface KeratoEye { H: KValue; V: KValue; AVE: KValue; }

export interface AutoRefraction {
  fecha: string | null;     // '2024_07_04'
  hora: string | null;      // 'AM 01:32'
  PD: number | null;        // 60.0
  VD: number | null;        // 12.00
  OD: EyeValues;            // Refracción S/C/A
  OI: EyeValues;
  se: { OD: string | null; OI: string | null };
  kerato?: { OD: KeratoEye; OI: KeratoEye }; // opcional si no vino
  cyl: { OD: string | null; OI: string | null };
  device?: { model?: string; fw?: string; rawTail?: string }; // “KR-8900 021.12”, etc.
}



export interface Patient {
  id: number; nombre: string; dni: string; hc: string;
  telefono: string; nacimiento: string; edad: number;
  cobertura: string; ultimaVisita: string;
  autorefracciones: AutoRefraction[]; // 1 o 2
}