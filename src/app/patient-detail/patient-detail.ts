import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatParserService } from '../services/data-parser.service';
import { AutoRefraction, PacienteAdmitido, PacienteActual, Patient } from '../models/patient.interface';
import { FileService } from '../services/file.service';
import { RefractionDataService } from '../services/refraction-data.service';
import { pacienteActualSignal } from '../mock/mock-patient';

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
  showMessage = signal<string | null>(null);  // Cambiado de boolean a string
  showModal = signal<{ title: string; content: string } | null>(null);
  
  name = signal<string>('');
  hc = signal<string>('');
  lastSelectedPatientHc = signal<string | null>(null); // Para trackear cambios
  
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
      
      if (hasPatientChanged) {
        this.name.set(`${patientToFill.apellido}, ${patientToFill.nombre}`);
        this.hc.set(patientToFill.hc);
        this.lastSelectedPatientHc.set(currentPatientHc);
      }
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
    // Cargar automáticamente el último archivo .dat al inicializar
    await this.loadLatestDat();
  }

  /**
   * Carga el último archivo .dat disponible desde el servidor
   */
  async loadLatestDat() {
    this.busy.set(true);
    try {
      const latest = await this._fileSvc.readLatestDatText();
      if (latest === null) {
        this.refracciones.set([]);
        console.warn('No se encontraron archivos .dat en el servidor');
        return;
      }
      const data = this.parser.parseDat(latest.text);
      this.refracciones.set([data]);
      console.log('Archivo .dat cargado:', latest.name);
    } catch (error) {
      console.error('Error cargando archivo .dat:', error);
      this.showModal.set({ 
        title: 'Error', 
        content: 'No se pudo cargar el archivo .dat desde el servidor. Verifique la conexión.' 
      });
    } finally {
      this.busy.set(false);
    }
  }

  /**
   * Actualiza/refresca el último archivo .dat (botón actualizar)
   */
  async refreshData() {
    await this.loadLatestDat();
    this.showSuccessMessage('Datos actualizados correctamente');
  }

  /**
   * show success message with custom text
   */
  showSuccessMessage(message: string) {
    this.showMessage.set(message);
    setTimeout(() => {
      this.showMessage.set(null);
    }, 2500);
  }

  /**
   * Guarda el archivo .dat actual en el servidor
   */
  async saveDatFile() {
    const r = this.refracciones()[0];
    if (!r) { 
      this.showModal.set({ title: 'Error', content: 'No hay datos para guardar' }); 
      return; 
    }
    
    this.busy.set(true);
    try {
      const patient = this.patientSignal();
      const filename = this.buildDatFilename(r, patient);
      const content = this.serializeDat(r);
      
      // Guardar en el servidor usando HTTP POST
      const success = await this._fileSvc.saveDatFile(filename, content);
      
      if (success) {
        // Mostrar mensaje de éxito
        this.showSuccessMessage('Archivo guardado exitosamente');
        console.log('Archivo guardado en el servidor:', filename);
      } else {
        this.showModal.set({ 
          title: 'Error', 
          content: 'No se pudo guardar el archivo en el servidor. Verifique la conexión.' 
        });
      }
    } catch (error) {
      console.error('Error guardando archivo:', error);
      this.showModal.set({ 
        title: 'Error', 
        content: 'Error inesperado al guardar el archivo.' 
      });
    } finally {
      this.busy.set(false);
    }
  }

  private downloadBlob(blob: Blob, filename: string) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 500);
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
}