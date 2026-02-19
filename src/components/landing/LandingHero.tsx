import { useState, useEffect, useMemo } from "react";
import heroImage from '@/assets/hero.jpg';
import { Link } from 'react-router-dom';
import { ChevronRight, Play } from 'lucide-react';

export const LandingHero = () => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setScrollY(window.scrollY);
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const transformStyle = useMemo(() => ({
        transform: `translateY(${-scrollY * 0.1}px)`,
        opacity: Math.max(0, 1 - scrollY / 700)
    }), [scrollY]);

    return (
        <section className="relative w-full h-screen overflow-hidden bg-slate-900">
            {/* Background Image Holder */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-900/60 z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900 z-10" />

                <img
                    src="https://images.unsplash.com/photo-1495837174058-628abc22c4f1?q=75&w=1600&auto=format&fit=crop"
                    alt="Hero Background"
                    className="w-full h-full object-cover scale-105"
                    style={{ filter: 'brightness(0.6) contrast(1.1)' }}
                    loading="eager"
                    fetchPriority="high"
                />
            </div>

            {/* Content Container */}
            <div className="relative h-full z-20 flex flex-col items-center justify-center text-center px-4">
                <div
                    className="max-w-5xl space-y-10 transition-all duration-700 ease-out"
                    style={transformStyle}
                >
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white text-sm font-black uppercase tracking-[0.2em] shadow-2xl">
                        <span className="h-2 w-2 rounded-full bg-[#f97316] animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                        Souveraineté Nationale & Intelligence
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                        Vers un secteur des <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-orange-400">hydrocarbures</span>
                        <br /><span className="text-white/80">numérique, transparent et sécurisé.</span>
                    </h1>

                    <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
                        Découvrez le premier système intégré de surveillance en temps réel pour une gestion transparente et prédictive des hydrocarbures en Guinée.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
                        <Link
                            to="/auth"
                            className="w-full sm:w-auto px-12 py-6 bg-[#f97316] hover:bg-orange-600 text-white rounded-3xl font-black text-xl shadow-[0_20px_40px_-10px_rgba(249,115,22,0.5)] transition-all hover:scale-105 hover:-translate-y-1 flex items-center justify-center gap-4 group"
                        >
                            Accéder au Portail
                            <ChevronRight className="h-7 w-7 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a
                            href="#features"
                            className="w-full sm:w-auto px-12 py-6 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white border border-white/20 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-4 hover:-translate-y-1"
                        >
                            <Play className="h-6 w-6 text-orange-400 fill-orange-400" />
                            Explorer la Solution
                        </a>
                    </div>
                </div>

                {/* Metrics Integrated */}
                <div className="mt-12 w-full max-w-7xl px-8 hidden lg:block">
                    <div className="grid grid-cols-4 gap-4">
                        {[
                            { label: "Précision IoT", val: "99.9%" },
                            { label: "Temps de Réponse", val: "< 15m" },
                            { label: "Couverture Régionale", val: "100%" },
                            { label: "Alertes Critiques", val: "Automatisées" }
                        ].map((m, i) => (
                            <div key={i} className="py-4 px-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/5 text-center transition-all hover:bg-white/10">
                                <p className="text-[#f97316] text-2xl font-black mb-0.5 drop-shadow-sm">{m.val}</p>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em]">{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="mt-8 animate-bounce opacity-20">
                    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-1.5 font-sans">
                        <div className="w-1 h-2 bg-white/50 rounded-full" />
                    </div>
                </div>
            </div>
        </section>
    );
};
