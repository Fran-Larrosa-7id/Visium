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
      { fecha: '01-07-2025', DV: 60, OD: { S: '+0.00', C: '-0.50', A: '167°' }, OI: { S: '+1.00', C: '-0.50', A: '175°' } }
    ]
  },
  {
    id: 2,
    nombre: 'PÉREZ, Juan Carlos',
    dni: '20456789',
    hc: '845',
    telefono: '223 5557788',
    nacimiento: '04-03-1979',
    edad: 46,
    cobertura: 'OSDE 310',
    ultimaVisita: '15-06-2025',
    autorefracciones: [
      { fecha: '15-06-2025', DV: 62, OD: { S: '-1.25', C: '-0.75', A: '10°' }, OI: { S: '-1.00', C: '-0.50', A: '170°' } },
      { fecha: '10-06-2024', DV: 62, OD: { S: '-1.00', C: '-0.50', A: '15°' }, OI: { S: '-0.75', C: '-0.50', A: '172°' } }
    ]
  },
  {
    id: 3,
    nombre: 'SUÁREZ, María Florencia',
    dni: '30111222',
    hc: '392',
    telefono: '223 331122',
    nacimiento: '19-09-1990',
    edad: 34,
    cobertura: 'IOMA',
    ultimaVisita: '08-07-2025',
    autorefracciones: [
      { fecha: '08-07-2025', DV: 59, OD: { S: '+0.50', C: '-0.50', A: '150°' }, OI: { S: '+0.25', C: '-0.50', A: '20°' } }
    ]
  }
];
