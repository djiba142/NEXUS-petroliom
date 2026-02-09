import { ShieldCheck, Activity, Globe, BarChart3, ChevronRight } from 'lucide-react';

export const LandingServices = () => {
    return (
        <>
            {/* Solutions & Presentation (Merged into Services) */}
            <section id="services" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-6">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="relative order-2 lg:order-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4 pt-12">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <ShieldCheck className="h-10 w-10 text-[#1e3a8a] mb-4" />
                                        <h4 className="font-bold mb-2">Sécurité</h4>
                                        <p className="text-xs text-slate-500">Protection des données stratégiques nationales.</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <Activity className="h-10 w-10 text-[#f97316] mb-4" />
                                        <h4 className="font-bold mb-2">Temps Réel</h4>
                                        <p className="text-xs text-slate-500">Mise à jour instantanée des niveaux de stock.</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                                        <Globe className="h-10 w-10 text-emerald-600 mb-4" />
                                        <h4 className="font-bold mb-2">National</h4>
                                        <p className="text-xs text-slate-500">Couverture complète du territoire guinéen.</p>
                                    </div>
                                    <div className="bg-[#1e3a8a] p-6 rounded-2xl shadow-xl text-white">
                                        <BarChart3 className="h-10 w-10 text-orange-400 mb-4" />
                                        <h4 className="font-bold mb-2">Aide à la Décision</h4>
                                        <p className="text-xs text-blue-200">Tableaux de bord destinés aux décideurs du MEHH.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 order-1 lg:order-2">
                            <h2 className="text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                                Une solution de <span className="text-[#1e3a8a]">Souveraineté</span> numérique unique en Guinée.
                            </h2>
                            <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
                                <p>
                                    Le SIHG est né d'une volonté de moderniser le secteur des hydrocarbures. En centralisant les flux de données entre l'État, la SONAP et les distributeurs, nous éliminons l'opacité et l'instabilité.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Élimination des ruptures de stock récurrentes",
                                        "Transparence totale sur la distribution nationale",
                                        "Optimisation de la logistique d'approvisionnement",
                                        "Contrôle rigoureux des prix au consommateur"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3 text-base font-medium text-slate-800">
                                            <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-[#f97316]">
                                                <ChevronRight className="h-4 w-4" />
                                            </div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Actors Grid */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                        <h2 className="text-[#f97316] font-bold tracking-widest text-sm uppercase">Services & Acteurs</h2>
                        <p className="text-4xl font-bold tracking-tight text-slate-900">Un écosystème interconnecté</p>
                        <p className="text-slate-600 text-lg">Chaque acteur bénéficie d'outils dédiés pour une synergie nationale optimale.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "État / MEHH", role: "Supervision Stratégique", desc: "Vision globale pour anticiper les crises et orienter les décisions de haut niveau." },
                            { title: "DNH", role: "Régulation Technique", desc: "Contrôle opérationnel, suivi des inspecteurs et validation des flux." },
                            { title: "SONAP / SGP", role: "Logistique & Import", desc: "Optimisation des commandes et planification des sorties de dépôts." },
                            { title: "Distributeurs", role: "Suivi Commercial", desc: "Gestion simplifiée des stations et reporting automatique vers l'État." }
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all">
                                <h4 className="font-black text-[#1e3a8a] text-lg mb-1">{s.title}</h4>
                                <div className="text-[#f97316] text-xs font-bold uppercase tracking-wider mb-4">{s.role}</div>
                                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};
