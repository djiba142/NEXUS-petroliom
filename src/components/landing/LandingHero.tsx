import { Link } from 'react-router-dom';
import { ChevronRight, Globe, ShieldCheck, Radio, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export const LandingHero = () => {
    const { user } = useAuth();
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-blue-100/50 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-orange-50/50 rounded-full blur-3xl -z-10" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8 animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-100">
                            <Globe className="h-3 w-3" /> Souveraineté Energétique Nationale
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-[#111827] leading-[1.1] tracking-tight">
                            Zéro Rupture. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a8a] to-[#f97316]">
                                Visibilité Totale.
                            </span>
                        </h1>
                        <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
                            Le Système Intelligent des Hydrocarbures de Guinée (SIHG) centralise et automatise le suivi national des stocks pour garantir un approvisionnement continu sur tout le territoire.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button size="lg" className="bg-[#1e3a8a] text-white hover:bg-[#1e3a8a]/90 px-10 h-14 rounded-xl text-lg group" asChild>
                                <Link to={user ? "/panel" : "/auth"}>
                                    {user ? "Tableau de bord" : "Démarrer maintenant"} <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </Button>
                            <Button size="lg" variant="outline" className="px-10 h-14 rounded-xl border-slate-200 text-lg hover:bg-slate-50">
                                Découvrir la solution
                            </Button>
                        </div>
                        <div className="flex items-center gap-6 pt-4 text-slate-400">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5" /> <span className="text-sm font-medium">Régi par l'État</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Radio className="h-5 w-5" /> <span className="text-sm font-medium">IoT Temps Réel</span>
                            </div>
                        </div>
                    </div>

                    <div className="relative animate-pulse-glow">
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                            <img
                                src="/hero_sihg_primary.png"
                                alt="SIHG Technology"
                                className="w-full h-auto object-cover min-h-[400px]"
                                onError={(e) => {
                                    e.currentTarget.src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200&auto=format&fit=crop";
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1e3a8a]/40 to-transparent" />
                        </div>

                        <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 max-w-[240px] hidden sm:block">
                            <div className="flex items-center gap-4 mb-3">
                                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Zap className="h-5 w-5 text-[#f97316]" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">99.9%</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Disponibilité</div>
                                </div>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full w-[99%] bg-[#f97316]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
