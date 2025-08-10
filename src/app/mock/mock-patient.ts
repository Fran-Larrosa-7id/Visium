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
        DV: 60,
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
        cyl: { OD: '-1.50', OI: '-0.50' }
      }
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
      {
        fecha: '01-07-2025',
        DV: 60,
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
        cyl: { OD: '-1.50', OI: '-0.50' }
      }
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
      {
        fecha: '01-07-2025',
        DV: 60,
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
        cyl: { OD: '-1.50', OI: '-0.50' }
      }
    ]
  },
  {
    id: 4,
    nombre: 'LOPEZ, Ana María',
    dni: '27890123',
    hc: '410',
    telefono: '223 4445566',
    nacimiento: '12-05-1965',
    edad: 59,
    cobertura: 'Swiss Medical',
    ultimaVisita: '10-05-2025',
    autorefracciones: [
      {
        fecha: '01-07-2025',
        DV: 60,
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
        cyl: { OD: '-1.50', OI: '-0.50' }
      }
    ]
  },
  {
    id: 5,
    nombre: 'FERNÁNDEZ, Pablo Andrés',
    dni: '31234567',
    hc: '512',
    telefono: '223 6677889',
    nacimiento: '23-08-1982',
    edad: 41,
    cobertura: 'OSDE 210',
    ultimaVisita: '22-03-2025',
    autorefracciones: [
      {
        fecha: '01-07-2025',
        DV: 60,
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
        cyl: { OD: '-1.50', OI: '-0.50' }
      }
    ]
  },
]