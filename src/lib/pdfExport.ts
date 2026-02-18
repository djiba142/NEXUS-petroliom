import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';
import nexusLogo from '@/assets/logo.png';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

// Helper to add Logo and QR Code
const addHeaderWithLogoAndQR = async (doc: jsPDF, title: string) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Colors (Professional Blue & Orange Scheme)
  const primaryColor = [41, 128, 185]; // Nice Blue
  const secondaryColor = [230, 126, 34]; // Orange for accent
  const darkText = [44, 62, 80];
  const lightText = [127, 140, 141];

  // 0. Add Colored Header Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, 25, 'F'); // Top bar

  // 1. Add Logo (Left)
  try {
    // Assuming nexusLogo is a URL or base64. If it's a URL, we might need to fetch it.
    // However, if imported via Vite/Webpack, it might be a URL.
    // If it's a URL, addImage often works if it's same-origin or base64.
    // For local dev, let's try adding it directly.

    // Create an image element to ensure we have data
    const img = new Image();
    img.src = nexusLogo;

    // We need to wait for image to load if we don't have base64
    // But addImage can take a URL in some versions. 
    // Safer way: fetch and convert to base64 if it's a url.

    // For simplicity in this environment, we try adding the imported string.
    doc.addImage(nexusLogo, 'PNG', 10, 2, 20, 20);
  } catch (err) {
    console.warn("Logo Error", err);
    // Fallback text if logo fails
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text("NEXUS", 14, 15);
  }

  // 2. Add QR Code (Right)
  try {
    const qrData = JSON.stringify({
      report: title,
      date: new Date().toISOString(),
      id: Math.random().toString(36).substring(7)
    });
    const qrDataUrl = await QRCode.toDataURL(qrData);
    doc.addImage(qrDataUrl, 'PNG', pageWidth - 25, 2, 20, 20);
  } catch (err) {
    console.error("QR Env Error", err);
  }

  // 3. Center Title (White on Blue Header)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('SIHG - République de Guinée', pageWidth / 2, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.text('Système Intégré de Gestion des Hydrocarbures', pageWidth / 2, 18, { align: 'center' });

  // 4. Report Metadata (Below Header)
  doc.setTextColor(darkText[0], darkText[1], darkText[2]);
  doc.setFontSize(16);
  doc.text(title, pageWidth / 2, 35, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(lightText[0], lightText[1], lightText[2]);
  doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, 42, { align: 'center' });

  // 5. Decorative Line
  doc.setDrawColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.setLineWidth(1);
  doc.line(20, 48, pageWidth - 20, 48);

  // 6. Add Footer (Page Numbers)
  // 6. Add Footer (Page Numbers)
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('NEXUS Petroliom - Document Confidentiel', 20, pageHeight - 10);
  }
};

export async function generateNationalStockPDF(stats: {
  entreprises: { nom: string; sigle: string; stockEssence: number; stockGasoil: number; stations: number }[];
  totals: { essence: number; gasoil: number; stations: number };
  autonomieEssence: number;
  autonomieGasoil: number;
  isPrinting?: boolean;
}): Promise<void> {
  const doc = new jsPDF();

  await addHeaderWithLogoAndQR(doc, 'Rapport Stock National');

  // Content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  // Summary Box
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(20, 55, 170, 25, 3, 3, 'F');

  doc.setFontSize(11);
  doc.text('Résumé Global', 25, 62);
  doc.setFontSize(10);
  doc.text(`Autonomie Essence: ${stats.autonomieEssence} jours`, 25, 70);
  doc.text(`Autonomie Gasoil: ${stats.autonomieGasoil} jours`, 100, 70);

  // Tableau with styling
  doc.autoTable({
    startY: 90,
    head: [['Entreprise', 'Essence (L)', 'Gasoil (L)', 'Stations']],
    body: stats.entreprises.map(e => [
      e.nom,
      e.stockEssence.toLocaleString('fr-FR'),
      e.stockGasoil.toLocaleString('fr-FR'),
      e.stations
    ]),
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [240, 248, 255] },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // Footer for totals
  // Footer for totals (Handle potential null lastAutoTable)
  const finalY = (doc.lastAutoTable?.finalY || 100) + 10;
  doc.setFontSize(11);
  doc.text('Totaux Nationaux:', 20, finalY);
  doc.text(`Essence: ${stats.totals.essence.toLocaleString('fr-FR')} L`, 60, finalY);
  doc.text(`Gasoil: ${stats.totals.gasoil.toLocaleString('fr-FR')} L`, 130, finalY);


  // Download / Print Logic
  if (stats.isPrinting) {
    doc.autoPrint();
    window.open(doc.output('bloburl'), '_blank');
  } else {
    doc.save(`Rapport_Stock_National_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}

export async function generateCustomReportPDF(options: {
  type: string;
  title?: string;
  dateDebut?: string;
  dateFin?: string;



  data?: any;
  isPrinting?: boolean;
}): Promise<void> {
  const doc = new jsPDF();
  const title = options.title || 'Rapport SIHG';

  await addHeaderWithLogoAndQR(doc, title);

  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  let currentY = 55;
  doc.text('Type : ' + options.type.toUpperCase(), 20, currentY);
  currentY += 7;

  if (options.dateDebut && options.dateFin) {
    doc.text(`Période : ${options.dateDebut} → ${options.dateFin}`, 20, currentY);
    currentY += 10;
  }

  if (options.data && Array.isArray(options.data) && options.data.length > 0) {
    const keys = Object.keys(options.data[0]).filter(k => k !== 'id' && !k.endsWith('_id') && k !== 'created_at');

    // Format data for display
    const data = options.data.map((item: any) => keys.map(key => {
      const val = item[key];
      if (typeof val === 'object' && val !== null) {
        if (val.nom) return val.nom; // expand simple relations
        return JSON.stringify(val);
      }
      if (typeof val === 'boolean') return val ? 'Oui' : 'Non';
      if (typeof val === 'number') return val.toLocaleString('fr-FR');
      // Format dates if string looks like date
      if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
        return new Date(val).toLocaleDateString('fr-FR');
      }
      return val;
    }));

    // Generate nicer columns labels
    const headers = keys.map(k => k.replace(/_/g, ' ').toUpperCase());

    doc.autoTable({
      startY: currentY + 5,
      head: [headers],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 248, 255] },
      styles: { fontSize: 8, overflow: 'linebreak', cellPadding: 2 },
    });
  } else {
    doc.text("Aucune donnée disponible pour ce rapport.", 20, currentY + 10);
  }

  // Download / Print Logic
  if (options.isPrinting) {
    doc.autoPrint();
    const blobUrl = doc.output('bloburl');
    window.open(blobUrl, '_blank');
  } else {
    doc.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
