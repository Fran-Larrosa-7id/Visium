import { Patient } from "../models/patient.interface";


export const MOCK_PATIENTS: Patient[] = [
  {
    id: 1,
    nombre: 'GATTO, Marta Elena',
    dni: '16588427',
    hc: '201',
    telefono: '223 4219999',
    nacimiento: '21-12-1952',
    edad: 71,
    cobertura: 'PAMI (Plan AA EMA)',
    ultimaVisita: '21-11-2023',
    autorefracciones: [
      {
        fecha: '01-07-2025',
        hora: null,          
        PD: null,            
        VD: 60,

        OD: { S: '+0.00', C: '-0.50', A: '167°' },
        OI: { S: '+1.00', C: '-0.50', A: '175°' },

        kerato: {
          OD: {
            H: { D: 43.25, MM: 7.82, A: 84 },
            V: { D: 44.75, MM: 7.54, A: 174 },
            AVE: { D: 44.00, MM: 7.68, A: 84 },
          },
          OI: {
            H: { D: 43.75, MM: 7.70, A: 42 },
            V: { D: 44.25, MM: 7.62, A: 132 },
            AVE: { D: 44.00, MM: 7.66, A: 42 },
          }
        },

        se: { OD: '1.00', OI: '0.75' },
        cyl: { OD: '-1.50', OI: '-0.50' },
        device: undefined     // opcional
      }
    ]
  }
]