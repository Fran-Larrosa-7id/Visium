export interface EyeValues { S: string; C: string; A: string; }

export interface KValue { D: string | number; MM: string | number; A: string | number; }
export interface KeratoEye { H: KValue; V: KValue; AVE: KValue; }

export interface AutoRefraction {
  fecha: string;
  DV: number | string;
  OD: EyeValues;   // Refracción: S/C/A
  OI: EyeValues;
  kerato: {        // Queratometría por ojo
    OD: KeratoEye;
    OI: KeratoEye;
  };
  se: { OD: string; OI: string };     // Esfera equivalente
  cyl: { OD: string; OI: string };    // Cilindro final mostrado
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
  autorefracciones: AutoRefraction[]; // 1 o 2
}
