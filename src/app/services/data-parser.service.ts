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
    // Dividir en líneas SIN filtrar vacías - mantener posiciones absolutas
    const allLines = content.split(/\r?\n/).map(l => l.trim());
    
    const fecha = allLines[0] && allLines[0].trim() ? allLines[0].trim() : null;
    const hora = allLines[1] && allLines[1].trim() ? allLines[1].trim() : null;

    // PD y VD pueden estar ausentes o en diferentes posiciones
    let PD: number | null = null, VD: number | null = null;
    const pdLikely = (n: number) => n >= 50 && n <= 75;
    const vdLikely = (n: number) => n >= 8 && n <= 18;

    // Buscar PD y VD en las líneas 2 y 3, manejando líneas vacías
    const line2 = allLines[2] && allLines[2].trim() ? this.toNum(allLines[2]) : null;
    const line3 = allLines[3] && allLines[3].trim() ? this.toNum(allLines[3]) : null;

    // Lógica para asignar PD y VD basado en contenido y rangos típicos
    if (line2 !== null && line3 !== null) {
      if (pdLikely(line2) && vdLikely(line3)) { PD = line2; VD = line3; }
      else if (vdLikely(line2) && pdLikely(line3)) { VD = line2; PD = line3; }
      else { PD = line2; VD = line3; } // Fallback al orden original
    } else if (line2 !== null) {
      if (pdLikely(line2)) PD = line2; 
      else if (vdLikely(line2)) VD = line2;
      else PD = line2; // Asumir PD si no está claro
    } else if (line3 !== null) {
      if (vdLikely(line3)) VD = line3;
      else if (pdLikely(line3)) PD = line3;
      else VD = line3; // Asumir VD si no está claro
    }

    // OD S/C/A/SE (líneas 4-7, pueden estar vacías)
    const OD_S  = allLines[4] && allLines[4].trim() ? allLines[4].trim() : null;
    const OD_C  = allLines[5] && allLines[5].trim() ? allLines[5].trim() : null;
    const OD_A  = allLines[6] && allLines[6].trim() ? allLines[6].trim() : null;
    const OD_SE = allLines[7] && allLines[7].trim() ? allLines[7].trim() : null;

    // OI S/C/A/SE (líneas 8-11, pueden estar vacías)
    const OI_S  = allLines[8] && allLines[8].trim() ? allLines[8].trim() : null;
    const OI_C  = allLines[9] && allLines[9].trim() ? allLines[9].trim() : null;
    const OI_A  = allLines[10] && allLines[10].trim() ? allLines[10].trim() : null;
    const OI_SE = allLines[11] && allLines[11].trim() ? allLines[11].trim() : null;

    // KERATOMETRÍA: usar posiciones fijas absolutas desde línea 12
    // KRT OD (H, V, AVE) D/MM/A
    const OD_H_D  = this.toNum(allLines[12]);  // línea 12
    const OD_H_MM = this.toNum(allLines[13]);  // línea 13  
    const OD_H_A  = this.toNum(allLines[14]);  // línea 14
    const OD_V_D  = this.toNum(allLines[15]);  // línea 15
    const OD_V_MM = this.toNum(allLines[16]);  // línea 16
    const OD_V_A  = this.toNum(allLines[17]);  // línea 17
    const OD_AV_D = this.toNum(allLines[18]);  // línea 18
    const OD_AV_MM= this.toNum(allLines[19]);  // línea 19
    const OD_AV_A = this.toNum(allLines[20]);  // línea 20
    const OD_CYL  = allLines[21] && allLines[21].trim() ? allLines[21].trim() : null; // línea 21

    // KRT OI 
    const OI_H_D  = this.toNum(allLines[22]);  // línea 22
    const OI_H_MM = this.toNum(allLines[23]);  // línea 23
    const OI_H_A  = this.toNum(allLines[24]);  // línea 24
    const OI_V_D  = this.toNum(allLines[25]);  // línea 25
    const OI_V_MM = this.toNum(allLines[26]);  // línea 26
    const OI_V_A  = this.toNum(allLines[27]);  // línea 27
    const OI_AV_D = this.toNum(allLines[28]);  // línea 28
    const OI_AV_MM= this.toNum(allLines[29]);  // línea 29
    const OI_AV_A = this.toNum(allLines[30]);  // línea 30
    const OI_CYL  = allLines[31] && allLines[31].trim() ? allLines[31].trim() : null; // línea 31

    // Tail: device info y workId al final
    let host: string | null = null;
    let fw: string | undefined;
    let workId: string | null = null;
    
    const nonEmptyLines = allLines.filter(l => l && l.trim());
    if (nonEmptyLines.length >= 2) {
      const tail1 = nonEmptyLines[nonEmptyLines.length - 2]; // modelo + fw
      const tail2 = nonEmptyLines[nonEmptyLines.length - 1]; // workId
      const parts = tail1.split(/\s+/).filter(Boolean);
      if (parts.length >= 1) host = parts[0] ?? null;
      if (parts.length >= 2) fw = parts[1];
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
