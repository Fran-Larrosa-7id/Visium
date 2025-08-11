import { AutoRefraction } from "../models/patient.interface";

export class DatParserService {
  private cleanLines(text: string): string[] {
    return text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length && l !== '...');
  }
  private toNum(s: string | null | undefined): number | null {
    if (!s) return null;
    const n = Number(s.replace(',', '.').replace(/\s+/g, ''));
    return Number.isFinite(n) ? n : null;
  }
  private next<T = string>(q: string[], asNumber = false): any {
    const v = q.shift() ?? null;
    return asNumber ? this.toNum(v) : v;
  }

  parseDat(content: string): AutoRefraction {
    const lines = this.cleanLines(content);
    // Clonamos para ir consumiendo sin perder el tail
    const q = [...lines];

    const fecha = this.next(q) ?? null;    // ej: 2024_07_04
    const hora  = this.next(q) ?? null;    // ej: AM 01:32

    // En algunos .dat viene primero PD y luego VD; en otros al revés.
    // Tomamos los próximos dos números y los asignamos por rango típico.
    const n1 = this.toNum(q[0]); if (n1 !== null) q.shift();
    const n2 = this.toNum(q[0]); if (n2 !== null) q.shift();
    let PD: number | null = null, VD: number | null = null;
    const pick = (a: number | null, b: number | null) => ({ a, b });
    const pdLikely = (n: number) => n >= 50 && n <= 75;
    const vdLikely = (n: number) => n >= 8 && n <= 18;

    if (n1 !== null && n2 !== null) {
      if (pdLikely(n1) && vdLikely(n2)) { PD = n1; VD = n2; }
      else if (vdLikely(n1) && pdLikely(n2)) { VD = n1; PD = n2; }
      else { // fallback: conservar orden
        PD = n1; VD = n2;
      }
    } else if (n1 !== null) {
      if (pdLikely(n1)) PD = n1; else if (vdLikely(n1)) VD = n1;
    }

    // OD S/C/A/SE
    const OD_S  = this.next(q) ?? null;
    const OD_C  = this.next(q) ?? null;
    const OD_A  = this.next(q) ?? null;
    const OD_SE = this.next(q) ?? null;

    // OI S/C/A/SE
    const OI_S  = this.next(q) ?? null;
    const OI_C  = this.next(q) ?? null;
    const OI_A  = this.next(q) ?? null;
    const OI_SE = this.next(q) ?? null;

    // KRT OD (H, V, AVE) D/MM/A
    const OD_H_D=this.next(q,true), OD_H_MM=this.next(q,true), OD_H_A=this.next(q,true);
    const OD_V_D=this.next(q,true), OD_V_MM=this.next(q,true), OD_V_A=this.next(q,true);
    const OD_AV_D=this.next(q,true),OD_AV_MM=this.next(q,true),OD_AV_A=this.next(q,true);
    const OD_CYL = this.next(q) ?? null;

    // KRT OI
    const OI_H_D=this.next(q,true), OI_H_MM=this.next(q,true), OI_H_A=this.next(q,true);
    const OI_V_D=this.next(q,true), OI_V_MM=this.next(q,true), OI_V_A=this.next(q,true);
    const OI_AV_D=this.next(q,true),OI_AV_MM=this.next(q,true),OI_AV_A=this.next(q,true);
    const OI_CYL = this.next(q) ?? null;

    // Tail: normalmente penúltima línea => "KR-8900   021.12"
    //       última línea => WorkId (p.ej. "0895")
    let host: string | null = null;
    let fw: string | undefined;
    let workId: string | null = null;
    if (lines.length >= 2) {
      const tail1 = lines[lines.length - 2]; // modelo + fw
      const tail2 = lines[lines.length - 1]; // workId (o algo)
      const parts = tail1.split(/\s+/).filter(Boolean);
      if (parts.length >= 1) host = parts[0] ?? null;       // KR-8900
      if (parts.length >= 2) fw   = parts[1];               // 021.12
      // workId: numérico o alfanumérico
      workId = tail2 || null;
    }

    const hasKerato =
      [OD_H_D, OD_V_D, OD_AV_D, OI_H_D, OI_V_D, OI_AV_D].some(v => v !== null);

    return {
      fecha, hora, PD, VD,
      OD: { S: OD_S, C: OD_C, A: OD_A },
      OI: { S: OI_S, C: OI_C, A: OI_A },
      se: { OD: OD_SE, OI: OI_SE },
      kerato: hasKerato ? {
        OD: { H:{D:OD_H_D,MM:OD_H_MM,A:OD_H_A}, V:{D:OD_V_D,MM:OD_V_MM,A:OD_V_A}, AVE:{D:OD_AV_D,MM:OD_AV_MM,A:OD_AV_A} },
        OI: { H:{D:OI_H_D,MM:OI_H_MM,A:OI_H_A}, V:{D:OI_V_D,MM:OI_V_MM,A:OI_V_A}, AVE:{D:OI_AV_D,MM:OI_AV_MM,A:OI_AV_A} },
      } : undefined,
      cyl: { OD: OD_CYL, OI: OI_CYL },
      device: host ? { model: host, fw, rawTail: `${host} ${fw ?? ''}`.trim() } : undefined,
      host,
      workId
    };
  }
}
