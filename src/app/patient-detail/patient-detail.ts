import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatParserService } from '../services/data-parser.service';
import { AutoRefraction, Patient } from '../models/patient.interface';
import { FileService } from '../services/file.service';

const PATH = 'C:\\archivos\\dat';

@Component({
  selector: 'app-patient-detail',
  imports: [CommonModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetail implements OnInit {
  patient = input<Patient | null>(null);
  patientSignal = signal<Patient | null>(null);
  refracciones = signal<AutoRefraction[]>([]);
  private parser = new DatParserService();
  private _fileSvc = inject(FileService)
  busy = signal(false);
  needsPermission = signal(false);
  linked = signal<FileSystemDirectoryHandle | null>(null);
  isDirectory = signal<boolean>(false);
  loadPatient = effect(() => {
    this.patientSignal.set(this.patient());
  });


  async ngOnInit() {
    const dir = await this._fileSvc.restoreDirectory();
    if (!dir) return;
    this.isDirectory.set(true);
    this.linked.set(dir);
    const state = await this._fileSvc.queryPerm(dir, false); // solo consultar
    if (state === 'granted') {
      await this.loadLatestFrom(dir);
    } else {
      this.needsPermission.set(true); // mostrás CTA “Permitir acceso”
    }
  }

  // Botón "Vincular carpeta .dat" (primer uso)
  async linkFolder() {
    const dir = await this._fileSvc.pickDatDirectory();
    if (dir) await this.loadLatestFrom(dir);
    this.linked.set(dir);
    this.isDirectory.set(!!dir);
  }


  /**
   * Chequea desde un path absoluto si existe el archivo .dat y lee el ultimo
   * @param files 
   * @returns 
   */
  async checkFiles(files: FileList | null) {
    if (!files?.length) return;
    this.busy.set(true);
    try {
      const refs: AutoRefraction[] = [];
      for (const f of Array.from(files)) {
        const text = await f.text();
        refs.push(this.parser.parseDat(text));
      }
      // max 2
      const merged = [...refs, ...(this.refracciones() || [])].slice(0, 2);
      // ojo: si preferís que lo nuevo quede primero:
      merged.sort((a, b) => (b?.fecha ?? '').localeCompare(a?.fecha ?? ''));

      // mutación simple (si el padre mantiene referencia, mejor emitir evento)
      this.refracciones.set(merged);

    } finally {
      this.busy.set(false);
    }
  }

  // Botón que el usuario presiona (gesto) para otorgar permiso
  async grantAccess() {
    const dir = this.linked();
    if (!dir) return;
    const state = await this._fileSvc.requestPermWithUserGesture(dir, false); // CLICK REQUIRED
    if (state === 'granted') {
      this.needsPermission.set(false);
      await this.loadLatestFrom(dir);
    }
  }

  /** Carga la última refracción desde la carpeta vinculada */
  async loadLatestFrom(dir: FileSystemDirectoryHandle | null) {
    this.busy.set(true);
    try {
      const latest = await this._fileSvc.readLatestDatText(dir);
      if (!latest) return;
      const data = this.parser.parseDat(latest.text);
      this.refracciones.set([data]);
    } finally {
      this.busy.set(false);
    }
  }

  //TODO: A futuro
  // exportJSON() {
  //   const data = JSON.stringify(this.patient()?.autorefracciones ?? [], null, 2);
  //   this.downloadBlob(new Blob([data], { type: 'application/json' }), 'autorefracciones.json');
  // }



  private downloadBlob(blob: Blob, filename: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }
}
