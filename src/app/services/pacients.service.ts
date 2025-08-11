import { Injectable, signal } from "@angular/core";
import { Patient } from "../models/patient.interface";

@Injectable({
  providedIn: "root"
})
export class PacientsService {
    private patients = signal<Patient[]>([]);
}