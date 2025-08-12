import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PatientDetail } from './patient-detail/patient-detail';
import { PatientList } from './patient-list/patient-list';
import { Patient } from './models/patient.interface';
import { MOCK_PATIENTS } from './mock/mock-patient';
import { History } from './history/history';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PatientList, PatientDetail, History],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('mockOjos');
  patients = signal<Patient[]>(MOCK_PATIENTS);
  selectedId = signal<number | null>(null);
  selected = computed(() => this.patients().find(p => p.id === this.selectedId()) ?? null);
  
  // Carpeta de guardado compartida entre componentes
  saveFolder = signal<FileSystemDirectoryHandle | null>(null);
  
  // Dark mode functionality
  isDarkMode = signal<boolean>(false);
  
  toggleDarkMode() {
    this.isDarkMode.update(current => !current);
    const newValue = this.isDarkMode();
    document.documentElement.classList.toggle('dark', newValue);
    localStorage.setItem('darkMode', newValue.toString());
  }
  constructor() {
    // Initialize dark mode based on user preference or system setting
    const isDark = localStorage.getItem('darkMode') === 'true' || 
                   (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    this.isDarkMode.set(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }
  
  onSelectPatient = (id:any) => {
    this.selectedId.set(id);
  };

  // Método para actualizar la carpeta de guardado desde patient-detail
  onSaveFolderChanged = (folder: FileSystemDirectoryHandle | null) => {
    this.saveFolder.set(folder);
  };
}
