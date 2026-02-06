import { useState } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  Loader2
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { generateNationalStockPDF, generateOrdresLivraisonPDF } from '@/lib/pdfExport';

const reportTypes = [
  {
    id: 'stock-national',
    title: 'Rapport Stock National',
    description: 'Vue consolidée des stocks par région et entreprise',
    icon: BarChart3,
    frequency: 'Quotidien',
    lastGenerated: '01/02/2026',
  },
  {
    id: 'consommation',
    title: 'Rapport de Consommation',
    description: 'Analyse des ventes et tendances de consommation',
    icon: TrendingUp,
    frequency: 'Hebdomadaire',
    lastGenerated: '27/01/2026',
  },
  {
    id: 'alertes',
    title: 'Rapport des Alertes',
    description: 'Historique des ruptures et situations critiques',
    icon: PieChart,
    frequency: 'Mensuel',
    lastGenerated: '01/01/2026',
  },
  {
    id: 'importations',
    title: 'Rapport des Importations',
    description: 'Suivi des cargaisons et déchargements au port',
    icon: FileSpreadsheet,
    frequency: 'Hebdomadaire',
    lastGenerated: '28/01/2026',
  },
];

const recentReports = [
  { id: 1, name: 'Stock_National_2026-02-01.pdf', date: '01/02/2026', size: '2.4 MB', type: 'stock-national' },
  { id: 2, name: 'Alertes_Janvier_2026.pdf', date: '31/01/2026', size: '1.8 MB', type: 'alertes' },
  { id: 3, name: 'Consommation_S04_2026.xlsx', date: '27/01/2026', size: '3.2 MB', type: 'consommation' },
  { id: 4, name: 'Importations_S04_2026.pdf', date: '27/01/2026', size: '1.1 MB', type: 'importations' },
];

export default function RapportsPage() {
  const { toast } = useToast();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [generating, setGenerating] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('');

  return (
    <DashboardLayout 
      title="Rapports" 
      subtitle="Génération et historique des rapports"
    >
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reportTypes.map((report) => (
          <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <report.icon className="h-8 w-8 text-primary" />
                <Badge variant="secondary" className="text-[10px]">
                  {report.frequency}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm mb-1">{report.title}</CardTitle>
              <CardDescription className="text-xs mb-3">
              {report.description}
              </CardDescription>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Dernier: {report.lastGenerated}
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs gap-1"
                  disabled={generating === report.id}
                  onClick={() => {
                    setGenerating(report.id);
                    setTimeout(() => {
                      if (report.id === 'stock-national') {
                        generateNationalStockPDF({
                          entreprises: [
                            { nom: 'TotalEnergies Guinée', sigle: 'TOTAL', stockEssence: 120000, stockGasoil: 95000, stations: 15 },
                            { nom: 'Shell Guinée', sigle: 'SHELL', stockEssence: 85000, stockGasoil: 72000, stations: 12 },
                            { nom: 'Kamsar Petroleum', sigle: 'KP', stockEssence: 45000, stockGasoil: 38000, stations: 8 },
                            { nom: 'Trade Market Int.', sigle: 'TMI', stockEssence: 35000, stockGasoil: 28000, stations: 6 },
                            { nom: 'Star Oil Guinée', sigle: 'STAR', stockEssence: 25000, stockGasoil: 18000, stations: 4 },
                          ],
                          totals: { essence: 310000, gasoil: 251000, stations: 45 },
                          autonomieEssence: 12,
                          autonomieGasoil: 15,
                        });
                      }
                      toast({
                        title: "Rapport généré",
                        description: `Le ${report.title} a été téléchargé.`,
                      });
                      setGenerating(null);
                    }, 1000);
                  }}
                >
                  {generating === report.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  Générer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate Custom Report */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rapport Personnalisé
            </CardTitle>
            <CardDescription>
              Générer un rapport sur une période spécifique
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type de rapport</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock">Stock National</SelectItem>
                  <SelectItem value="consommation">Consommation</SelectItem>
                  <SelectItem value="alertes">Alertes</SelectItem>
                  <SelectItem value="importations">Importations</SelectItem>
                  <SelectItem value="prix">Conformité des Prix</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin</Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Région (optionnel)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les régions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les régions</SelectItem>
                  <SelectItem value="conakry">Conakry</SelectItem>
                  <SelectItem value="kindia">Kindia</SelectItem>
                  <SelectItem value="boke">Boké</SelectItem>
                  <SelectItem value="mamou">Mamou</SelectItem>
                  <SelectItem value="labe">Labé</SelectItem>
                  <SelectItem value="faranah">Faranah</SelectItem>
                  <SelectItem value="kankan">Kankan</SelectItem>
                  <SelectItem value="nzerekore">Nzérékoré</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1 gap-2">
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" className="flex-1 gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rapports Récents</CardTitle>
                <CardDescription>
                  Historique des derniers rapports générés
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filtrer
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div 
                  key={report.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.date} • {report.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
