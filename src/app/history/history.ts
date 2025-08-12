import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileService } from '../services/file.service';
import { DatParserService } from '../services/data-parser.service';
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
  
  files = signal<HistoryFile[]>([]);
  loading = signal(false);
  selectedFile = signal<string | null>(null);
  saveFolder = signal<FileSystemDirectoryHandle | null>(null);

  async ngOnInit() {
    await this.loadSaveFolderAndFiles();
    // Cargar archivos cada 5 segundos para detectar nuevos archivos guardados
    setInterval(() => this.loadHistoryFiles(), 5000);
  }

  async loadSaveFolderAndFiles() {
    const folder = await this._fileSvc.getCurrentSaveDirectory();
    if (folder) {
      this.saveFolder.set(folder);
      await this.loadHistoryFiles();
    }
  }

  async loadHistoryFiles() {
    const folder = this.saveFolder();
    if (!folder) {
      // Intentar cargar la carpeta de guardado si no está disponible
      const newFolder = await this._fileSvc.getCurrentSaveDirectory();
      if (newFolder) {
        this.saveFolder.set(newFolder);
        await this.loadHistoryFiles();
        return;
      }
      this.files.set([]);
      return;
    }

    this.loading.set(true);
    try {
      const fileList = await this._fileSvc.listAllDatFiles(folder);
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
    const folder = this.saveFolder();
    if (!folder) return;

    try {
      const fileData = await this._fileSvc.readSpecificDatFile(folder, filename);
      if (fileData) {
        const refraction = this.parser.parseDat(fileData.text);
        this.selectedFile.set(filename);
        
        // Por ahora mostramos en console - más adelante podemos emitir un evento
        console.log('Archivo seleccionado:', filename);
        console.log('Datos de refracción:', refraction);
        
        // Aquí puedes mostrar los datos en una modal o comunicar con otros componentes
        this.showRefractionData(refraction, filename);
      }
    } catch (error) {
      console.error('Error reading file:', error);
    }
  }

  private showRefractionData(refraction: AutoRefraction, filename: string) {
    // Por ahora solo mostramos una alerta con información básica
    const message = `
      Archivo: ${filename}
      Fecha: ${refraction.fecha || 'No disponible'}
      Hora: ${refraction.hora || 'No disponible'}
      OD: S${refraction.OD?.S || '?'} C${refraction.OD?.C || '?'} A${refraction.OD?.A || '?'}
      OI: S${refraction.OI?.S || '?'} C${refraction.OI?.C || '?'} A${refraction.OI?.A || '?'}
      Equipo: ${refraction.device?.model || 'No disponible'}
    `;
    alert(message);
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
