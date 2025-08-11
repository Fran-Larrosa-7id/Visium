import { Component, effect, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatParserService } from '../services/data-parser.service';
import { AutoRefraction, Patient } from '../models/patient.interface';

@Component({
  selector: 'app-patient-detail',
  imports: [CommonModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetail {
  patient = input<Patient | null>(null);
  patientSignal = signal<Patient | null>(null);
  private parser = new DatParserService();
  busy = signal(false);

  loadPatient = effect(() => {
    this.patientSignal.set(this.patient());
  });


  async onFiles(files: FileList | null) {
    if (!files?.length || !this.patient()) return;
    this.busy.set(true);
    try {
      const refs: AutoRefraction[] = [];
      for (const f of Array.from(files)) {
        const text = await f.text();
        refs.push(this.parser.parseDat(text));
      }
      // max 2
      const merged = [...refs, ...(this.patient()!.autorefracciones || [])].slice(0, 2);
      // ojo: si preferís que lo nuevo quede primero:
      merged.sort((a, b) => (b?.fecha ?? '').localeCompare(a?.fecha ?? ''));

      // mutación simple (si el padre mantiene referencia, mejor emitir evento)
      this.patientSignal.set({
        ...(this.patientSignal() as Patient),
        autorefracciones: merged
      });

    } finally {
      this.busy.set(false);
    }
  }
  
  exportJSON() {
    const data = JSON.stringify(this.patient()?.autorefracciones ?? [], null, 2);
    this.downloadBlob(new Blob([data], { type: 'application/json' }), 'autorefracciones.json');
  }



  private downloadBlob(blob: Blob, filename: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }
}
