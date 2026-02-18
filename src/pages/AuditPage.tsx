import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { fetchAuditLogs } from '@/lib/auditLog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type AuditRowData = {
  id?: string;
  user_email?: string;
  action_type?: string;
  resource_type?: string;
  resource_name?: string;
  details?: Record<string, any>;
  status?: string;
  error_message?: string;
  created_at?: string;
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    userEmail: '',
    actionType: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await fetchAuditLogs({
        userEmail: filters.userEmail || undefined,
        actionType: filters.actionType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 100
      });

      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setError('Erreur lors du chargement des logs. Vérifiez que la migration SQL a été exécutée.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const exportToCSV = () => {
    if (logs.length === 0) {
      alert('Aucune donnée à exporter');
      return;
    }

    const headers = ['Date', 'Utilisateur', 'Action', 'Ressource', 'Statut'];
    const rows = logs.map(log => [
      log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : '',
      log.user_email || '',
      log.action_type || '',
      log.resource_name || '',
      log.status || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const getActionBadgeColor = (action?: string) => {
    const colors: Record<string, string> = {
      'LOGIN': 'bg-blue-100 text-blue-800',
      'VIEW': 'bg-gray-100 text-gray-800',
      'CREATE': 'bg-green-100 text-green-800',
      'UPDATE': 'bg-yellow-100 text-yellow-800',
      'DELETE': 'bg-red-100 text-red-800',
      'EXPORT': 'bg-purple-100 text-purple-800',
      'DOWNLOAD': 'bg-indigo-100 text-indigo-800',
    };
    return colors[action || ''] || 'bg-gray-100 text-gray-800';
  };

  const getStatusBadgeColor = (status?: string) => {
    return status === 'success'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  return (
    <DashboardLayout
      title="Journaux d'Audit"
      subtitle="Historique complet des connexions et actions des utilisateurs"
    >
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Configuration Alert */}
      <Alert className="mb-6 bg-blue-50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          Le système d'audit enregistrera automatiquement toutes les connexions et actions une fois la migration SQL activée.
        </AlertDescription>
      </Alert>

      {/* Filters Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres de recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email utilisateur</label>
              <Input
                placeholder="Rechercher par email"
                value={filters.userEmail}
                onChange={(e) => handleFilterChange('userEmail', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type d'action</label>
              <Select value={filters.actionType} onValueChange={(value) => handleFilterChange('actionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tous les types</SelectItem>
                  <SelectItem value="LOGIN">Connexion</SelectItem>
                  <SelectItem value="VIEW">Consultation</SelectItem>
                  <SelectItem value="CREATE">Création</SelectItem>
                  <SelectItem value="UPDATE">Modification</SelectItem>
                  <SelectItem value="DELETE">Suppression</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                  <SelectItem value="DOWNLOAD">Téléchargement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date début</label>
              <Input
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date fin</label>
              <Input
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={loadLogs} disabled={loading}>
              {loading ? 'Chargement...' : 'Rechercher'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setFilters({ userEmail: '', actionType: '', startDate: '', endDate: '' });
                setError(null);
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Logs d'audit</CardTitle>
            <CardDescription>
              {loading ? 'Chargement des enregistrements...' : `${logs.length} enregistrement${logs.length !== 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          <Button
            onClick={exportToCSV}
            disabled={logs.length === 0 || loading}
            className="gap-2"
          >
            <Download size={16} />
            Exporter CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement des logs d'audit...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Aucun log d'audit trouvé. Les enregistrements apparaîtront une fois la migration activée.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date/Heure</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Ressource</TableHead>
                    <TableHead>Détails</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">
                        {log.created_at ? new Date(log.created_at).toLocaleString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell className="text-sm">{log.user_email || '-'}</TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action_type)}>
                          {log.action_type || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{log.resource_name || log.resource_type || '-'}</TableCell>
                      <TableCell className="text-xs text-gray-600">
                        {log.error_message ? (
                          <span className="text-red-600 font-medium">{log.error_message}</span>
                        ) : (
                          <span>{log.details ? JSON.stringify(log.details).substring(0, 40) + '...' : '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(log.status)}>
                          {log.status === 'success' ? '✓ Succès' : '✗ Erreur'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
