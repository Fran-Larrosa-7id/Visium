import { CommonModule } from '@angular/common';
import { afterEveryRender, afterNextRender, Component, input } from '@angular/core';
import { Patient } from '../models/patient.interface';

@Component({
  selector: 'app-patient-detail',
  imports: [CommonModule],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.scss'
})
export class PatientDetail {
 patient = input<Patient | null>(null);
  p = () => this.patient() as Patient;
  constructor() {
    afterNextRender(() => {
      console.log('Se ejecuta una sola vez después del primer render');
    });

    afterEveryRender(() => {
      console.log('Se ejecuta después de cada render');
    });
  }
    

  ngAfterViewInit() {
    console.log(
      'PatientDetail initialized with patient:',
      this.patient()
    );
  }
}
