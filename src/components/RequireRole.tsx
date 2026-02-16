import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, AppRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireRoleProps {
    allowedRoles: AppRole[];
}

export function RequireRole({ allowedRoles }: RequireRoleProps) {
    const { user, role, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (!role) {
        // User is logged in but has no role (or role fetch failed/is null)
        // Redirect to Access Denied to avoid infinite loop with /auth
        return <Navigate to="/acces-refuse" replace />;
    }

    if (!allowedRoles.includes(role)) {
        // Redirect to the appropriate dashboard based on their actual role
        // This prevents "Access Denied" page if they just hit the wrong URL, 
        // effectively guiding them back to their lane.
        // Or we can show Access Denied. The user asked for "Strict restriction".
        // Let's redirect to Access Denied for clarity, or their own dashboard.
        // Dashboard is better UX.

        return <Navigate to="/acces-refuse" replace />;
    }

    return <Outlet />;
}
