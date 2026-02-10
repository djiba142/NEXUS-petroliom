import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const LandingNavbar = () => {
    const { user } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                ? "bg-white/80 backdrop-blur-md border-b border-slate-200 py-4"
                : "bg-transparent py-6"
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <img
                            src="/src/assets/logo.png"
                            alt="NEXUS Logo"
                            className={`transition-all duration-300 ${scrolled ? "h-12" : "h-16"} w-auto`}
                        />
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#" className={`text-sm font-semibold transition-colors ${scrolled ? "text-slate-900 hover:text-[#f97316]" : "text-white hover:text-white/80"}`}>Accueil</a>
                        <a href="#features" className={`text-sm font-semibold transition-colors ${scrolled ? "text-slate-900 hover:text-[#f97316]" : "text-white hover:text-white/80"}`}>Fonctionnalités</a>
                        <a href="#services" className={`text-sm font-semibold transition-colors ${scrolled ? "text-slate-900 hover:text-[#f97316]" : "text-white hover:text-white/80"}`}>Services</a>
                        <a href="#contact" className={`text-sm font-semibold transition-colors ${scrolled ? "text-slate-900 hover:text-[#f97316]" : "text-white hover:text-white/80"}`}>Contact</a>
                        <Button className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white rounded-full px-8 shadow-lg shadow-blue-900/20" asChild>
                            <Link to={user ? "/panel" : "/auth"}>
                                {user ? "Tableau de bord" : "Se connecter"}
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

