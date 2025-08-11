export interface EyeValues { S: string | null; C: string | null; A: string | null; }
export interface KValue { D: number | null; MM: number | null; A: number | null; }
export interface KeratoEye { H: KValue; V: KValue; AVE: KValue; }

export interface AutoRefraction {
  fecha: string | null;
  hora: string | null;
  PD: number | null;      // ~50–70
  VD: number | null;      // ~10–15
  OD: EyeValues; OI: EyeValues;
  se: { OD: string | null; OI: string | null };
  kerato?: { OD: KeratoEye; OI: KeratoEye };
  cyl: { OD: string | null; OI: string | null };
  device?: { model?: string; fw?: string; rawTail?: string };
  host?: string | null;     // KR-8900 (igual que device.model)
  workId?: string | null;   // p. ej. "0895"
}



export interface Patient {
  id: number; nombre: string; dni: string; hc: string;
  telefono: string; nacimiento: string; edad: number;
  cobertura: string; ultimaVisita: string;
  autorefracciones: AutoRefraction[]; // 1 o 2
}