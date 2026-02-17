import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => jsPDF;
  }
}

export async function generateNationalStockPDF(stats: {
  entreprises: { nom: string; sigle: string; stockEssence: number; stockGasoil: number; stations: number }[];
  totals: { essence: number; gasoil: number; stations: number };
  autonomieEssence: number;
  autonomieGasoil: number;
  isPrinting?: boolean;
}): Promise<void> {
  const doc = new jsPDF();

  // ────────────────────────────────────────────────
  // Ton code de génération du PDF (header, summary, table, etc.)
  // ────────────────────────────────────────────────
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('SIHG - République de Guinée', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text('Rapport Stock National', 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 40, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 47, 190, 47);

  // Exemple rapide de contenu (tu peux remettre ton code complet ici)
  doc.setFontSize(12);
  doc.text('Autonomie Essence : ' + stats.autonomieEssence + ' jours', 20, 60);
  doc.text('Autonomie Gasoil : ' + stats.autonomieGasoil + ' jours', 20, 70);

  // Tableau simple pour tester
  doc.autoTable({
    startY: 80,
    head: [['Entreprise', 'Essence (L)', 'Gasoil (L)', 'Stations']],
    body: stats.entreprises.map(e => [e.nom, e.stockEssence, e.stockGasoil, e.stations]),
    theme: 'striped',
  });

  // ────────────────────────────────────────────────
  // PARTIE CRITIQUE : Téléchargement / Impression
  // ────────────────────────────────────────────────
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  if (stats.isPrinting) {
    // Impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Pop-up bloqué ! Autorisez les pop-ups pour ce site.");
      URL.revokeObjectURL(pdfUrl);
      return;
    }

    printWindow.document.write(`
      <html>
        <head><title>Impression Rapport SIHG</title></head>
        <body style="margin:0;">
          <embed width="100%" height="100%" src="${pdfUrl}" type="application/pdf">
        </body>
      </html>
    `);
    printWindow.document.close();

    // Attendre chargement puis imprimer
    printWindow.onload = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (e) {
          console.warn("Impossible d'imprimer auto", e);
        }
      }, 1500);
    };
  } else {
    // Téléchargement normal
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `Rapport_Stock_National_${new Date().toISOString().split('T')[0]}.pdf`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Nettoyage
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 200);
  }
}

export function generateCustomReportPDF(options: {
  type: string;
  title?: string;
  dateDebut?: string;
  dateFin?: string;
}): void {
  const doc = new jsPDF();

  const title = options.title || 'Rapport SIHG';

  doc.setFontSize(20);
  doc.text('SIHG - République de Guinée', 105, 20, { align: 'center' });
  doc.setFontSize(16);
  doc.text(title, 105, 30, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 40, { align: 'center' });

  doc.setDrawColor(200, 200, 200);
  doc.line(20, 47, 190, 47);

  doc.setFontSize(12);
  doc.text('Type : ' + options.type, 20, 60);
  if (options.dateDebut && options.dateFin) {
    doc.text(`Période : ${options.dateDebut} → ${options.dateFin}`, 20, 70);
  }

  // Sauvegarde avec méthode fiable
  const pdfBlob = doc.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(pdfUrl), 200);
}