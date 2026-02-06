import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => jsPDF;
  }
}

interface ReportData {
  title: string;
  subtitle?: string;
  date: string;
  data: Record<string, unknown>[];
  columns: { header: string; dataKey: string }[];
}

export function generateStockReport(data: ReportData): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('SIHG - République de Guinée', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(108, 117, 125);
  doc.text(data.title, 105, 30, { align: 'center' });
  
  if (data.subtitle) {
    doc.setFontSize(12);
    doc.text(data.subtitle, 105, 38, { align: 'center' });
  }
  
  doc.setFontSize(10);
  doc.text(`Généré le: ${data.date}`, 105, 48, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, 190, 55);
  
  // Table
  doc.autoTable({
    startY: 60,
    head: [data.columns.map(col => col.header)],
    body: data.data.map(row => 
      data.columns.map(col => String(row[col.dataKey] ?? ''))
    ),
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} sur ${pageCount} - Système d'Information des Hydrocarbures de Guinée`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Save
  doc.save(`${data.title.replace(/\s+/g, '_')}_${data.date.replace(/\//g, '-')}.pdf`);
}

export function generateOrdresLivraisonPDF(ordres: {
  id: string;
  station: string;
  carburant: string;
  quantite: number;
  priorite: string;
  statut: string;
  date: string;
}[]): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('SIHG - République de Guinée', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Ordres de Livraison', 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 40, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 47, 190, 47);
  
  // Table
  doc.autoTable({
    startY: 52,
    head: [['Station', 'Carburant', 'Quantité (L)', 'Priorité', 'Statut', 'Date']],
    body: ordres.map(o => [
      o.station,
      o.carburant,
      o.quantite.toLocaleString(),
      o.priorite,
      o.statut,
      o.date,
    ]),
    theme: 'striped',
    headStyles: {
      fillColor: [220, 53, 69],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      2: { halign: 'right' },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} sur ${pageCount} - SGP - Société Guinéenne des Pétroles`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`Ordres_Livraison_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateNationalStockPDF(stats: {
  entreprises: { nom: string; sigle: string; stockEssence: number; stockGasoil: number; stations: number }[];
  totals: { essence: number; gasoil: number; stations: number };
  autonomieEssence: number;
  autonomieGasoil: number;
}): void {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('SIHG - République de Guinée', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Rapport Stock National', 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 105, 40, { align: 'center' });
  
  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 47, 190, 47);
  
  // Summary boxes
  doc.setFillColor(59, 130, 246);
  doc.roundedRect(20, 52, 80, 25, 3, 3, 'F');
  doc.setTextColor(255);
  doc.setFontSize(12);
  doc.text('Autonomie Essence', 60, 62, { align: 'center' });
  doc.setFontSize(16);
  doc.text(`${stats.autonomieEssence} jours`, 60, 72, { align: 'center' });
  
  doc.setFillColor(34, 197, 94);
  doc.roundedRect(110, 52, 80, 25, 3, 3, 'F');
  doc.text('Autonomie Gasoil', 150, 62, { align: 'center' });
  doc.setFontSize(16);
  doc.text(`${stats.autonomieGasoil} jours`, 150, 72, { align: 'center' });
  
  // Table
  doc.autoTable({
    startY: 85,
    head: [['Entreprise', 'Sigle', 'Stock Essence (L)', 'Stock Gasoil (L)', 'Stations']],
    body: stats.entreprises.map(e => [
      e.nom,
      e.sigle,
      e.stockEssence.toLocaleString(),
      e.stockGasoil.toLocaleString(),
      e.stations.toString(),
    ]),
    foot: [[
      'TOTAL',
      '',
      stats.totals.essence.toLocaleString(),
      stats.totals.gasoil.toLocaleString(),
      stats.totals.stations.toString(),
    ]],
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [33, 37, 41],
      textColor: 255,
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'center' },
    },
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Page ${i} sur ${pageCount} - SONAP / DNH - Direction Nationale des Hydrocarbures`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  doc.save(`Stock_National_${new Date().toISOString().split('T')[0]}.pdf`);
}
