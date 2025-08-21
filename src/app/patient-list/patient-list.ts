import { CommonModule } from '@angular/common';
import { Component, computed, ElementRef, input, output, signal, ViewChild } from '@angular/core';
import { PacienteAdmitido, PacienteActual } from '../models/patient.interface';
@Component({
  selector: 'app-patient-list',
  imports: [CommonModule],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss'
})
export class PatientList {
  patients = input.required<PacienteAdmitido[]>();
  selectedHc = input<string>('');
  pacienteActual = input<PacienteActual | null>(null);
  select = output<string>();
  query = signal('');
  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.patients();
    return this.patients().filter(p =>
      p.nombre.toLowerCase().includes(q) || p.apellido.toLowerCase().includes(q)
    );
  });
  
  @ViewChild('scrollPane') scrollPane!: ElementRef<HTMLElement>;

  topFade = signal(false);
  bottomFade = signal(false);
  
  // TrackBy function for better performance
  trackByPatientId(index: number, patient: PacienteAdmitido): string {
    return patient.hc;
  }
  
  constructor() {
  }
}
