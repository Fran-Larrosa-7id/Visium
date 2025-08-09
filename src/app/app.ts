import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PatientDetail } from './patient-detail/patient-detail';
import { PatientList } from './patient-list/patient-list';
import { Patient } from './models/patient.interface';
import { MOCK_PATIENTS } from './mock/mock-patient';

@Component({
  selector: 'app-root',
  imports: [CommonModule, PatientList, PatientDetail],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('mockOjos');
   patients = signal<Patient[]>(MOCK_PATIENTS);
  selectedId = signal<number | null>(MOCK_PATIENTS[0]?.id ?? null);
  selected = computed(() => this.patients().find(p => p.id === this.selectedId()) ?? null);
  // onSelect = (id: any) => this.selectedId.set(id);
  constructor() {
    console.log(
      'App initialized with patients:',
      this.selected()
    );
  }
  onSelectPatient = (id:any) => {

    this.selectedId.set(id);
  };
}
