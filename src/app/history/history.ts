import { Component, inject, signal, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../services/file.service';
import { DatParserService } from '../services/data-parser.service';
import { RefractionDataService } from '../services/refraction-data.service';
import { AutoRefraction } from '../models/patient.interface';

interface HistoryFile {
  name: string;
  lastModified: number;
  size: number;
  displayDate: string;
}

@Component({
  selector: 'app-history',
  imports: [CommonModule],
  templateUrl: './history.html',
  styleUrl: './history.scss'
})
export class History implements OnInit {
  private _fileSvc = inject(FileService);
  private parser = new DatParserService();
  private refractionDataSvc = inject(RefractionDataService);
  
  files = signal<HistoryFile[]>([]);
  loading = signal(false);
  selectedFile = signal<string | null>(null);

  async ngOnInit() {
    await this.loadHistoryFiles();
  }

  async loadHistoryFiles() {
    this.loading.set(true);
    try {
      const fileList = await this._fileSvc.getHistoryDatFiles();
      const historyFiles = fileList.map(file => ({
        ...file,
        displayDate: new Date(file.lastModified).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }));
      
      this.files.set(historyFiles);
    } catch (error) {
      console.error('Error loading history files:', error);
      this.files.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async onFileClick(filename: string) {
    try {
      const fileData = await this._fileSvc.readHistoryDatFile(filename);
      if (fileData) {
        const refraction = this.parser.parseDat(fileData.text);
        this.selectedFile.set(filename);
        
        // Enviar los datos al servicio compartido para que PatientDetail los muestre
        this.refractionDataSvc.setRefractionFromHistory(refraction);
        
        console.log('Archivo del historial cargado:', filename);
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  }

  // Método para refrescar manualmente la lista
  async refreshHistory() {
    await this.loadHistoryFiles();
  }
}
