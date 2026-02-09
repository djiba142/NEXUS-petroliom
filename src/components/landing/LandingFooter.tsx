import { Link } from 'react-router-dom';
import { Mail, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LandingFooter = () => {
    return (
        <footer id="contact" className="bg-[#1e3a8a] pt-20 pb-10 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
                    <div className="space-y-6">
                        <div className="flex items-center">
                            <img
                                src="/src/assets/logo.png"
                                alt="NEXUS Logo"
                                className="h-20 w-auto"
                            />
                        </div>
                        <p className="text-blue-200">
                            Système Intégré des Hydrocarbures de Guinée.
                            Une initiative pour la sécurité énergétique.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6">Liens Rapides</h4>
                        <ul className="space-y-4 text-blue-200">
                            <li><a href="#" className="hover:text-white transition-colors">Accueil</a></li>
                            <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
                            <li><a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a></li>
                            <li><Link to="/auth" className="hover:text-white transition-colors">Connexion</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6">Contact</h4>
                        <ul className="space-y-4 text-blue-200">
                            <li className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#f97316]" /> contact@sihg-guinee.gn</li>
                            <li>Conakry, République de Guinée</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-lg mb-6">Newsletter</h4>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Email" className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#f97316]" />
                            <Button className="bg-[#f97316] hover:bg-orange-600"><ChevronRight /></Button>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/10 text-center text-blue-300 text-sm">
                    <p>© {new Date().getFullYear()} SIHG - République de Guinée. Tous droits réservés.</p>
                </div>
            </div>
        </footer>
    );
};
