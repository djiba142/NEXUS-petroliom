import { useState } from 'react';
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  AlertCircle,
  Info,
  Fuel,
  Truck,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  icon: 'alert' | 'fuel' | 'truck' | 'info';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Rupture imminente',
    message: 'Shell Cosa - Stock essence à 6%',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    read: false,
    icon: 'alert',
  },
  {
    id: '2',
    type: 'critical',
    title: 'Rupture imminente',
    message: 'Shell Cosa - Stock gasoil à 8%',
    timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 min ago
    read: false,
    icon: 'alert',
  },
  {
    id: '3',
    type: 'warning',
    title: 'Stock bas',
    message: 'TotalEnergies Kaloum - Essence à 10%',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    read: false,
    icon: 'fuel',
  },
  {
    id: '4',
    type: 'info',
    title: 'Livraison programmée',
    message: 'Camion en route vers TMI Kagbelen',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    read: true,
    icon: 'truck',
  },
  {
    id: '5',
    type: 'success',
    title: 'Livraison confirmée',
    message: 'Star Oil Aéroport - 45 000L essence',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    read: true,
    icon: 'truck',
  },
];

const iconMap = {
  alert: AlertCircle,
  fuel: Fuel,
  truck: Truck,
  info: Info,
};

const typeStyles = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
  success: 'bg-green-50 border-green-200 text-green-700',
};

const iconStyles = {
  critical: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
  success: 'text-green-500',
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [open, setOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-stock-critical text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs gap-1"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.icon];
                
                return (
                  <div 
                    key={notification.id}
                    className={cn(
                      "p-4 hover:bg-muted/50 transition-colors cursor-pointer relative",
                      !notification.read && "bg-primary/5"
                    )}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        typeStyles[notification.type]
                      )}>
                        <Icon className={cn("h-4 w-4", iconStyles[notification.type])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn(
                              "text-sm",
                              !notification.read && "font-medium"
                            )}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {notification.message}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {formatDistanceToNow(notification.timestamp, { 
                            addSuffix: true, 
                            locale: fr 
                          })}
                        </p>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        <div className="p-3 border-t bg-muted/30">
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Voir toutes les notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
