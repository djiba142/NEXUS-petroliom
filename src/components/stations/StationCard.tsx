import { MapPin, Phone, User, Fuel, Clock, ChevronRight } from 'lucide-react';
import { Station } from '@/types';
import { StockIndicator, StockBadge } from '@/components/dashboard/StockIndicator';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface StationCardProps {
  station: Station;
}

const typeLabels = {
  urbaine: 'Urbaine',
  routiere: 'Routière',
  depot: 'Dépôt'
};

const statusStyles = {
  ouverte: 'bg-emerald-100 text-emerald-700',
  fermee: 'bg-red-100 text-red-700',
  en_travaux: 'bg-amber-100 text-amber-700',
  attente_validation: 'bg-blue-100 text-blue-700'
};

const statusLabels = {
  ouverte: 'Ouverte',
  fermee: 'Fermée',
  en_travaux: 'En travaux',
  attente_validation: 'En attente'
};

function calculatePercentage(current: number, capacity: number): number {
  return Math.round((current / capacity) * 100);
}

export function StationCard({ station }: StationCardProps) {
  const essencePercent = calculatePercentage(station.stockActuel.essence, station.capacite.essence);
  const gasoilPercent = calculatePercentage(station.stockActuel.gasoil, station.capacite.gasoil);

  const hasCritical = essencePercent < 10 || gasoilPercent < 10;
  const hasWarning = !hasCritical && (essencePercent < 25 || gasoilPercent < 25);

  return (
    <Link
      to={`/stations/${station.id}`}
      className={cn(
        "block stat-card group transition-all duration-200",
        hasCritical && "border-red-200 hover:border-red-300 bg-red-50/30",
        hasWarning && !hasCritical && "border-amber-200 hover:border-amber-300 bg-amber-50/30",
        !hasCritical && !hasWarning && "hover:border-primary/30"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {station.nom}
            </h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium",
              statusStyles[station.statut]
            )}>
              {statusLabels[station.statut]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono text-xs bg-secondary px-1.5 py-0.5 rounded">
              {station.code}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {station.ville}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StockBadge percentage={Math.min(essencePercent, gasoilPercent)} />
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </div>
      </div>

      {/* Stock Levels */}
      <div className="space-y-3 mb-4">
        <StockIndicator
          percentage={essencePercent}
          label="Essence"
          size="sm"
        />
        <StockIndicator
          percentage={gasoilPercent}
          label="Gasoil"
          size="sm"
        />
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          {station.gestionnaire.nom}
        </span>
        {station.derniereLivraison && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {new Date(station.derniereLivraison.date).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    </Link>
  );
}
