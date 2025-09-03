// ...existing code...
import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatParserService } from '../services/data-parser.service';
import { AutoRefraction, PacienteAdmitido, PacienteActual, Patient } from '../models/patient.interface';
import { FileService } from '../services/file.service';
import { RefractionDataService } from '../services/refraction-data.service';
import { pacienteActualSignal } from '../mock/mock-patient';

const PATH = 'C:\\archivos\\dat';

@Component({
  selector: 'app-patient-detail',
  imports: [CommonModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetail implements OnInit {
  patient = input<PacienteAdmitido | null>(null);
  patientSignal = signal<PacienteAdmitido | null>(null);
  refracciones = signal<AutoRefraction[]>([]);
  private parser = new DatParserService();
  private _fileSvc = inject(FileService);
  private refractionDataSvc = inject(RefractionDataService);
  busy = signal(false);
  needsPermission = signal(false);
  linked = signal<FileSystemDirectoryHandle | null>(null);
  saveFolder = signal<FileSystemDirectoryHandle | null>(null); // Carpeta separada para guardado
  isDirectory = signal<boolean>(false);
  showMessage = signal<boolean>(false);
  showMessageSave = signal<boolean>(false);
  showModal = signal<{ title: string; content: string } | null>(null);
  showSecurityModal = signal<boolean>(false);
  showCopyMessage = signal<string | null>(null); // Para mostrar feedback de copiado
  name = signal<string>('');
  hc = signal<string>('');
  lastSelectedPatientHc = signal<string | null>(null); // Para trackear cambios
  
  // Para acceder al origin desde el template
  get currentOrigin(): string {
    return window.location.origin;
  }

  // Para debugging de seguridad
  get securityDebugInfo(): any {
    return this._fileSvc.getSecurityDebugInfo();
  }
  
  loadPatient = effect(() => {
    this.patientSignal.set(this.patient());
  });

  // Effect para autocompletar campos con paciente actual o seleccionado
  autoFillPatientData = effect(() => {
    const selectedPatient = this.patient();
    const currentPatient = pacienteActualSignal();

    // Prioridad: paciente seleccionado > paciente actual
    const patientToFill = selectedPatient || currentPatient;
    
    if (patientToFill) {
      const currentPatientHc = patientToFill.hc;
      
      // Si cambió el paciente seleccionado, actualizar siempre
      const hasPatientChanged = this.lastSelectedPatientHc() !== currentPatientHc;
      
      
        this.name.set(`${patientToFill.apellido}, ${patientToFill.nombre}`);
        this.hc.set(patientToFill.hc);
        this.lastSelectedPatientHc.set(currentPatientHc);
      
    }
  });

  // Efecto para escuchar datos del historial
  loadHistoryData = effect(() => {
    const historyRefraction = this.refractionDataSvc.currentRefraction();
    if (historyRefraction) {
      // Mostrar los datos del historial en la tabla
      this.refracciones.set([historyRefraction]);
      // Limpiar el servicio después de usar los datos
      this.refractionDataSvc.clearRefraction();
    }
  });


  async ngOnInit() {
    this.config();
  }

  private async config() {
    const dir = await this._fileSvc.restoreDirectory();
    const dirSave = await this._fileSvc.restoreSaveDirectory();
    if (!dir) return;
    this.isDirectory.set(true);
    this.linked.set(dir);
    this.saveFolder.set(dirSave);
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

  // Verificar si estamos en contexto inseguro
  isInsecureContext(): boolean {
    return this._fileSvc.isInsecureContext();
  }

  // Verificar si File System Access API está soportada
  isFileSystemAccessSupported(): boolean {
    return this._fileSvc.isFileSystemAccessSupported();
  }

  // Mostrar modal simplificado
  showSecurityConfigModal(): void {
    this.showSecurityModal.set(true);
    // Copiar automáticamente el origin al abrir el modal
    this.copyToClipboard(this.currentOrigin);
  }

  // Función para copiar texto al portapapeles
  async copyToClipboard(text: string): Promise<void> {
    try {
      let message = '';
      
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        console.log('Texto copiado al portapapeles:', text);
      } else {
        // Fallback para contextos inseguros
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        console.log('Texto copiado al portapapeles (fallback):', text);
      }
      
      // Determinar qué se copió para el mensaje
      if (text.includes('chrome://flags')) {
        message = '¡URL de Chrome flags copiada!';
      } else if (text === this.currentOrigin) {
        message = '¡Origin copiado!';
      } else {
        message = '¡Texto copiado!';
      }
      
      // Mostrar feedback visual
      this.showCopyMessage.set(message);
      
      // Ocultar el mensaje después de 2 segundos
      setTimeout(() => {
        this.showCopyMessage.set(null);
      }, 2000);
      
    } catch (err) {
      console.error('Error al copiar al portapapeles:', err);
      this.showCopyMessage.set('Error al copiar');
      setTimeout(() => {
        this.showCopyMessage.set(null);
      }, 2000);
    }
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
      if (latest === null) {
        this.refracciones.set([]);
        return;
      }
      const data = this.parser.parseDat(latest!.text);
      this.refracciones.set([data]);
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * show success message
   * @param blob 
   * @param filename 
   */
  showSuccessMessage() {
    this.showMessage.set(true);
    setTimeout(() => {
      this.showMessage.set(false);
    }, 2500);
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

  public async saveDatFile() {
    // Usar carpeta de guardado si está disponible, sino carpeta de lectura
    const saveDir = this.saveFolder();
    const dir = saveDir;

    if (!dir) {
      this.showModal.set({ title: 'Error', content: 'Primero debe vincular una carpeta' });
      return;
    }

    const r = this.refracciones()[0];
    if (!r) { this.showModal.set({ title: 'Error', content: 'No hay datos para guardar' }); return; }
    const patient = this.patientSignal();
    const filename = this.buildDatFilename(r, patient);
    const content = this.serializeDat(r);
    const perm = await this._fileSvc.verifyPermission(dir, true);
    if (!perm) { this.showModal.set({ title: 'Error', content: 'No hay permiso de escritura en la carpeta' }); return; }
    const fileHandle = await (dir as any).getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    // Notify that a file was saved for immediate change detection
    this.refractionDataSvc.notifyFileSaved();
    this.showMessageSave.set(true);
    setTimeout(() => this.showMessageSave.set(false), 2000);
  }

  private serializeDat(r: AutoRefraction): string {
    const lines = [];
    lines.push(r.fecha ?? '');
    lines.push(r.hora ?? '');
    lines.push(r.PD ?? '');
    lines.push(r.VD ?? '');
    lines.push(r.OD?.S ?? '');
    lines.push(r.OD?.C ?? '');
    lines.push(r.OD?.A ?? '');
    lines.push(r.se?.OD ?? '');
    lines.push(r.OI?.S ?? '');
    lines.push(r.OI?.C ?? '');
    lines.push(r.OI?.A ?? '');
    lines.push(r.se?.OI ?? '');
    if (r.kerato?.OD) {
      lines.push(r.kerato.OD.H.D ?? '');
      lines.push(r.kerato.OD.H.MM ?? '');
      lines.push(r.kerato.OD.H.A ?? '');
      lines.push(r.kerato.OD.V.D ?? '');
      lines.push(r.kerato.OD.V.MM ?? '');
      lines.push(r.kerato.OD.V.A ?? '');
      lines.push(r.kerato.OD.AVE.D ?? '');
      lines.push(r.kerato.OD.AVE.MM ?? '');
      lines.push(r.kerato.OD.AVE.A ?? '');
      lines.push(r.cyl?.OD ?? '');
    }
    if (r.kerato?.OI) {
      lines.push(r.kerato.OI.H.D ?? '');
      lines.push(r.kerato.OI.H.MM ?? '');
      lines.push(r.kerato.OI.H.A ?? '');
      lines.push(r.kerato.OI.V.D ?? '');
      lines.push(r.kerato.OI.V.MM ?? '');
      lines.push(r.kerato.OI.V.A ?? '');
      lines.push(r.kerato.OI.AVE.D ?? '');
      lines.push(r.kerato.OI.AVE.MM ?? '');
      lines.push(r.kerato.OI.AVE.A ?? '');
      lines.push(r.cyl?.OI ?? '');
    }
    if (r.device) lines.push(`${r.device.model}   ${r.device.fw ?? ''}`.trim());
    lines.push(r.workId ?? '');
    return lines.join('\n');
  }

  private buildDatFilename(r: AutoRefraction, patient: PacienteAdmitido | null): string {
    const model = r.device?.model ?? '----';
    const workId = r.workId ?? '----';
    let historia = patient?.hc ?? '----';
    let anio = '----', mes = '--', dia = '--', hora = '--', min = '--';
    if (r.fecha) {
      const f = r.fecha.split('_');
      if (f.length === 3) { anio = f[0]; mes = f[1]; dia = f[2]; }
    }
    if (r.hora) {
      const m = r.hora.match(/(AM|PM)?\s*(\d{2}):(\d{2})/i);
      if (m) { hora = m[2]; min = m[3]; }
    }
    if (this.hc()) {
      historia = this.hc().trim().toUpperCase();
    }

    let apellido = '----';
    if (patient?.apellido) {
      const parts = patient.apellido.split(',');
      if (parts.length > 0) {
        apellido = (parts[0].trim().toUpperCase() + '----').slice(0, 4);
      }
    } else if (this.name()) {
      apellido = (this.name().trim().toUpperCase() + '----').slice(0, 4);
    }
    return `${model}-${workId}-${anio}-${mes}-${dia}-${hora}-${min}-${historia}-${apellido}.dat`;
  }

  // Método para vincular carpeta de guardado
  async linkSaveFolder() {
    const dir = await this._fileSvc.pickSaveDirectory();
    if (dir) {
      this.saveFolder.set(dir);
      await this._fileSvc.saveSaveDirectory(dir); // Guardar en IndexedDB para persistencia
      // Muestra la lista de archivos guardados
      this.refractionDataSvc._firstTimeFilesSaved.set(true);
    }
  }

  // Verificar si la carpeta de guardado está vinculada
  isSaveFolderLinked(): boolean {
    return !!this.saveFolder();
  }
}
