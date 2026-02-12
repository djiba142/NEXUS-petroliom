import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Entreprise, Station } from '@/types';

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

export function generateEntrepriseReportPDF(
  entreprise: Entreprise,
  stations: Station[]
): void {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('SIHG - République de Guinée', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text(`Fiche Entreprise - ${entreprise.sigle}`, 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(
    `Généré le: ${new Date().toLocaleDateString('fr-FR')}`,
    105,
    40,
    { align: 'center' }
  );

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 47, 190, 47);

  // Entreprise details
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text('Informations générales', 20, 58);

  doc.setFontSize(10);
  const baseY = 65;
  const lineHeight = 6;

  doc.text(`Nom complet : ${entreprise.nom}`, 20, baseY);
  doc.text(`Sigle : ${entreprise.sigle}`, 20, baseY + lineHeight);
  doc.text(
    `Type : ${entreprise.type === 'compagnie' ? 'Compagnie importatrice' : 'Distributeur'}`,
    20,
    baseY + 2 * lineHeight
  );
  doc.text(`Région : ${entreprise.region}`, 20, baseY + 3 * lineHeight);
  doc.text(`N° d'agrément : ${entreprise.numeroAgrement}`, 20, baseY + 4 * lineHeight);
  doc.text(
    `Statut : ${entreprise.statut === 'actif' ? 'Actif' : entreprise.statut === 'suspendu' ? 'Suspendu' : 'Fermé'}`,
    20,
    baseY + 5 * lineHeight
  );
  doc.text(
    `Nombre de stations : ${entreprise.nombreStations}`,
    20,
    baseY + 6 * lineHeight
  );

  // Contact
  const contactY = baseY + 8 * lineHeight;
  doc.setFontSize(12);
  doc.text('Contact principal', 20, contactY);
  doc.setFontSize(10);
  doc.text(`Nom : ${entreprise.contact.nom}`, 20, contactY + lineHeight);
  doc.text(`Téléphone : ${entreprise.contact.telephone}`, 20, contactY + 2 * lineHeight);
  doc.text(`Email : ${entreprise.contact.email}`, 20, contactY + 3 * lineHeight);

  // Stations table
  const startTableY = contactY + 5 * lineHeight;
  doc.setFontSize(12);
  doc.text('Stations rattachées', 20, startTableY);

  const tableData =
    stations.length > 0
      ? stations.map((s) => [
          s.nom,
          s.ville,
          s.code,
          s.statut === 'ouverte'
            ? 'Ouverte'
            : s.statut === 'fermee'
            ? 'Fermée'
            : s.statut === 'en_travaux'
            ? 'En travaux'
            : 'En attente',
          s.stockActuel.essence.toLocaleString('fr-FR'),
          s.stockActuel.gasoil.toLocaleString('fr-FR'),
        ])
      : [['Aucune station enregistrée', '', '', '', '', '']];

  // Table
  doc.autoTable({
    startY: startTableY + 5,
    head: [[
      'Station',
      'Ville',
      'Code',
      'Statut',
      'Stock Essence (L)',
      'Stock Gasoil (L)',
    ]],
    body: tableData,
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
    columnStyles: {
      4: { halign: 'right' },
      5: { halign: 'right' },
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

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`Fiche_Entreprise_${entreprise.sigle}_${dateStr}.pdf`);
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

export function generateCustomReportPDF(options: {
  type: string;
  title?: string;
  dateDebut?: string;
  dateFin?: string;
  regionLabel?: string;
}): void {
  const doc = new jsPDF();

  const humanTitle =
    options.title ??
    ({
      'stock-national': 'Rapport Stock National',
      stock: 'Rapport Stock National',
      consommation: 'Rapport de Consommation',
      alertes: 'Rapport des Alertes',
      importations: 'Rapport des Importations',
      prix: 'Rapport de Conformité des Prix',
    } as Record<string, string>)[options.type] ??
    'Rapport SIHG';

  // Header
  doc.setFontSize(20);
  doc.setTextColor(33, 37, 41);
  doc.text('SIHG - République de Guinée', 105, 20, { align: 'center' });

  doc.setFontSize(16);
  doc.text(humanTitle, 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  const today = new Date().toLocaleDateString('fr-FR');
  doc.text(`Généré le: ${today}`, 105, 40, { align: 'center' });

  // Line separator
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 47, 190, 47);

  // Filters / metadata
  let y = 60;
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  doc.text('Période analysée', 20, y);

  doc.setFontSize(10);
  y += 7;
  const periode =
    options.dateDebut && options.dateFin
      ? `Du ${options.dateDebut} au ${options.dateFin}`
      : 'Non spécifiée';
  doc.text(periode, 20, y);

  y += 7;
  const regionLabel = options.regionLabel ?? 'Toutes les régions';
  doc.text(`Région : ${regionLabel}`, 20, y);

  y += 12;
  doc.setFontSize(12);
  doc.text('Résumé', 20, y);
  doc.setFontSize(10);
  y += 7;
  doc.text(
    "Ce rapport est un modèle de démonstration généré à partir de données d'exemple du SIHG.",
    20,
    y
  );

  // Simple placeholder table
  const tableStartY = y + 10;
  doc.autoTable({
    startY: tableStartY,
    head: [['Indicateur', 'Valeur']],
    body: [
      ['Type de rapport', humanTitle],
      ['Période', periode],
      ['Région', regionLabel],
      ["Source des données", 'Données de démonstration'],
    ],
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

  const safeTitle = humanTitle.replace(/\s+/g, '_');
  const dateSuffix = today.replace(/\//g, '-');
  doc.save(`${safeTitle}_${dateSuffix}.pdf`);
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
