import { Injectable, signal } from '@angular/core';
import { AutoRefraction } from '../models/patient.interface';

@Injectable({ providedIn: 'root' })
export class RefractionDataService {
  // Signal compartido para los datos de refracción
  private _currentRefraction = signal<AutoRefraction | null>(null);
  
  // Signal para notificar cuando se guarda un archivo nuevo
  private _filesSaved = signal<number>(0);

  // Signal boolean que muestra archivos guardados la primera ves que se vincula la carpeta descargas
  _firstTimeFilesSaved = signal<boolean>(false);

  // Getter público para los datos
  get currentRefraction() {
    return this._currentRefraction.asReadonly();
  }

  // Getter para detectar cuando se guardan archivos
  get filesSaved() {
    return this._filesSaved.asReadonly();
  }

  // Método para actualizar los datos desde el historial
  setRefractionFromHistory(refraction: AutoRefraction) {
    this._currentRefraction.set(refraction);
  }

  // Método para limpiar los datos
  clearRefraction() {
    this._currentRefraction.set(null);
  }

  // Método para notificar que se guardó un archivo
  notifyFileSaved() {
    this._filesSaved.update(count => count + 1);
  }
}
