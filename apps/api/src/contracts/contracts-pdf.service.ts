import { Injectable } from "@nestjs/common";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

interface ContractPdfData {
  organizationName: string;
  contractorName: string;
  missionTitre: string;
  briefTexte?: string | null;
  montant?: string | null;
  dateEcheance?: Date | null;
  clientFinal?: string | null;
}

@Injectable()
export class ContractsPdfService {
  async generate(data: ContractPdfData): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const drawLine = (text: string, options: { size?: number; useFont?: typeof font } = {}) => {
      const { size = 11, useFont = font } = options;
      page.drawText(text, { x: 50, y, size, font: useFont, color: rgb(0, 0, 0) });
      y -= size + 10;
    };

    drawLine("Bon de commande / Contrat de prestation", { size: 18, useFont: bold });
    y -= 10;
    drawLine(`Agence : ${data.organizationName}`, { useFont: bold });
    drawLine(`Prestataire : ${data.contractorName}`, { useFont: bold });
    if (data.clientFinal) drawLine(`Client final : ${data.clientFinal}`);
    y -= 10;
    drawLine(`Mission : ${data.missionTitre}`, { useFont: bold });
    if (data.montant) drawLine(`Montant convenu : ${data.montant} EUR`);
    if (data.dateEcheance) drawLine(`Échéance : ${data.dateEcheance.toLocaleDateString("fr-FR")}`);
    y -= 10;
    drawLine("Description du brief :", { useFont: bold });
    const brief = data.briefTexte ?? "(aucun brief détaillé fourni)";
    for (const line of wrapText(brief, 90)) {
      drawLine(line, { size: 10 });
    }

    const bytes = await doc.save();
    return Buffer.from(bytes);
  }
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}
