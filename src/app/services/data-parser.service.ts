import { AutoRefraction } from "../models/patient.interface";

export class DatParserService {
  private cleanLines(text: string): string[] {
    return text.split(/\r?\n/).map(l => l.trim()).filter(l => l && l !== '...');
  }
  private toNum(s: string | null | undefined): number | null {
    if (!s) return null;
    const n = Number(s.replace(',', '.').replace(/\s+/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  private next(q: string[], asNumber = false): any {
    const v = q.shift() ?? null;
    return asNumber ? this.toNum(v) : v;
  }

  parseDat(content: string): AutoRefraction {
    const q = this.cleanLines(content);

    const fecha = this.next(q) ?? null;       // ej 2024_07_04
    const hora  = this.next(q) ?? null;       // ej AM 01:32
    // PD y VD si estuvieran
    let PD = this.toNum(q[0]); if (PD !== null) q.shift();
    let VD = this.toNum(q[0]); if (VD !== null) q.shift();

    // OD S/C/A/SE
    const OD_S = this.next(q) ?? null;
    const OD_C = this.next(q) ?? null;
    const OD_A = this.next(q) ?? null;
    const OD_SE = this.next(q) ?? null;

    // OI S/C/A/SE
    const OI_S = this.next(q) ?? null;
    const OI_C = this.next(q) ?? null;
    const OI_A = this.next(q) ?? null;
    const OI_SE = this.next(q) ?? null;

    // Kerato OD: H, V, AVE (D, MM, A)
    const OD_H_D=this.next(q,true), OD_H_MM=this.next(q,true), OD_H_A=this.next(q,true);
    const OD_V_D=this.next(q,true), OD_V_MM=this.next(q,true), OD_V_A=this.next(q,true);
    const OD_AV_D=this.next(q,true),OD_AV_MM=this.next(q,true),OD_AV_A=this.next(q,true);
    const OD_CYL = this.next(q) ?? null;

    // Kerato OI: H, V, AVE
    const OI_H_D=this.next(q,true), OI_H_MM=this.next(q,true), OI_H_A=this.next(q,true);
    const OI_V_D=this.next(q,true), OI_V_MM=this.next(q,true), OI_V_A=this.next(q,true);
    const OI_AV_D=this.next(q,true),OI_AV_MM=this.next(q,true),OI_AV_A=this.next(q,true);
    const OI_CYL = this.next(q) ?? null;

    // Footer (equipo) opcional
    const tail1 = q.shift() ?? null;
    const tail2 = q.shift() ?? null;
    const device = tail1?.match(/KR-|AKR|RM|NIDEK|TOPCON|HUVITZ/i)
      ? { model: tail1.split(/\s+/)[0], fw: tail1.split(/\s+/)[1], rawTail: [tail1, tail2].filter(Boolean).join(' ') }
      : undefined;

    const hasKerato = [OD_H_D, OD_V_D, OD_AV_D, OI_H_D, OI_V_D, OI_AV_D].some(v => v !== null);

    return {
      fecha, hora, PD: PD ?? null, VD: VD ?? null,
      OD: { S: OD_S, C: OD_C, A: OD_A },
      OI: { S: OI_S, C: OI_C, A: OI_A },
      se: { OD: OD_SE, OI: OI_SE },
      kerato: hasKerato ? {
        OD: { H:{D:OD_H_D,MM:OD_H_MM,A:OD_H_A}, V:{D:OD_V_D,MM:OD_V_MM,A:OD_V_A}, AVE:{D:OD_AV_D,MM:OD_AV_MM,A:OD_AV_A} },
        OI: { H:{D:OI_H_D,MM:OI_H_MM,A:OI_H_A}, V:{D:OI_V_D,MM:OI_V_MM,A:OI_V_A}, AVE:{D:OI_AV_D,MM:OI_AV_MM,A:OI_AV_A} },
      } : undefined,
      cyl: { OD: OD_CYL, OI: OI_CYL },
      device
    };
  }
}
