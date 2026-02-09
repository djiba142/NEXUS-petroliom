import { Radio, BarChart3, Layers, Zap, ShieldCheck } from 'lucide-react';

export const LandingFeatures = () => {
    return (
        <>
            {/* Features Detail Section */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
                        <h2 className="text-[#f97316] font-bold tracking-widest text-sm uppercase">Innovation IoT</h2>
                        <p className="text-4xl font-bold tracking-tight text-slate-900">Une gestion moderne & automatisée</p>
                        <p className="text-slate-600 text-lg">Finis les relevés manuels imprécis. SIHG utilise des capteurs de pointe pour une transparence absolue.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Radio className="h-8 w-8" />,
                                title: "Capteurs IoT",
                                desc: "Mesure automatique par ultrasons des niveaux de cuve en temps réel.",
                                color: "bg-blue-50 text-blue-600"
                            },
                            {
                                icon: <BarChart3 className="h-8 w-8" />,
                                title: "Analyse Prédictive",
                                desc: "Anticipation des ruptures grâce à l'analyse intelligente des seuils critiques.",
                                color: "bg-orange-50 text-orange-600"
                            },
                            {
                                icon: <Layers className="h-8 w-8" />,
                                title: "Vue Nationale",
                                desc: "Tableaux de bord consolidés pour une supervision d'État centralisée.",
                                color: "bg-emerald-50 text-emerald-600"
                            }
                        ].map((f, i) => (
                            <div key={i} className="p-8 rounded-3xl border border-slate-100 hover:border-[#f97316]/20 hover:shadow-xl hover:shadow-orange-900/5 transition-all group">
                                <div className={`w-16 h-16 ${f.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* AI Features Section */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="lg:w-1/2 space-y-8">
                            <h2 className="text-4xl font-bold tracking-tight leading-tight">
                                L'Intelligence Artificielle au service de <span className="text-orange-400">l'Energie</span>.
                            </h2>
                            <div className="grid gap-6">
                                {[
                                    { icon: <Zap className="h-6 w-6" />, title: "Alertes Intelligentes", desc: "Notification automatique dès qu'une station descend sous le seuil critique." },
                                    { icon: <BarChart3 className="h-6 w-6" />, title: "Prévisions de Consommation", desc: "Algorithmes basés sur l'historique pour prédire les besoins futurs par région." },
                                    { icon: <ShieldCheck className="h-6 w-6" />, title: "Traçabilité Blockchain", desc: "Chaque litre est suivi du dépôt à la pompe pour éviter la fraude." }
                                ].map((f, i) => (
                                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <div className="text-orange-400 mt-1">{f.icon}</div>
                                        <div>
                                            <h4 className="font-bold mb-1">{f.title}</h4>
                                            <p className="text-sm text-slate-400">{f.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:w-1/2 relative">
                            <div className="bg-gradient-to-br from-blue-500/20 to-orange-500/20 absolute inset-0 blur-3xl rounded-full" />
                            <div className="relative rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                                <img
                                    src="/dashboard_preview.png"
                                    alt="SIHG Dashboard"
                                    className="w-full h-auto"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop";
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};
