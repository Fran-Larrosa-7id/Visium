import { CommonModule } from '@angular/common';
import { afterEveryRender, afterNextRender, Component, input } from '@angular/core';
import { Patient } from '../models/patient.interface';

@Component({
  selector: 'app-patient-detail',
  imports: [CommonModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetail {
  patient = input<Patient | null>(null);
  p = () => this.patient() as Patient;
  constructor() {
    afterNextRender(() => {
      console.log('Se ejecuta una sola vez después del primer render');
    });

    afterEveryRender(() => {
      console.log('Se ejecuta después de cada render');
    });
  }


  ngAfterViewInit() {
    console.log(
      'PatientDetail initialized with patient:',
      this.patient()
    );
  }

  downloadDat() {
    if (!this.patient()) return;

    // Armamos contenido DAT (puede ser CSV-like, JSON, etc.)
    const p = this.patient()!;
    let content = `PACIENTE: ${p.nombre}\nDNI: ${p.dni}\nHC: ${p.hc}\n`;
    content += `Última visita: ${p.ultimaVisita}\n\nAUTOREFRACCIONES:\n`;

    p.autorefracciones.forEach((r, idx) => {
      content += `\n#${idx + 1} — Fecha: ${r.fecha} — DV: ${r.DV}\n`;
      content += `OD: S=${r.OD.S} C=${r.OD.C} A=${r.OD.A}\n`;
      content += `OI: S=${r.OI.S} C=${r.OI.C} A=${r.OI.A}\n`;
    });

    // Crear blob y disparar descarga
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.nombre.replace(/\\s+/g, '_')}.dat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

}
