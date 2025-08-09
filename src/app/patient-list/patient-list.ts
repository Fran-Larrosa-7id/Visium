import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { Patient } from '../models/patient.interface';

@Component({
  selector: 'app-patient-list',
  imports: [CommonModule],
  templateUrl: './patient-list.html',
  styleUrl: './patient-list.scss'
})
export class PatientList {
  patients = input.required<Patient[]>();
  selectedId = input<number | null>(null);
  select = output<number>();
  query = signal('');
  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.patients();
    return this.patients().filter(p =>
      p.nombre.toLowerCase().includes(q) || p.dni.includes(q)
    );
  });

  constructor() {
    // if (this.patients().length) {
    //   console.log(
    //     'PatientList initialized with patients:',
    //     this.filtered()
    //   );
    // }
  }

  ngAfterViewInit() {
    console.log(
      'PatientList initialized with patients:',
      this.filtered()
    );
  }
}
