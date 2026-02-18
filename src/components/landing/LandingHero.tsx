import { useState, useEffect } from "react";
import heroImage from '@/assets/hero.jpg';
import { Link } from 'react-router-dom';
import { ChevronRight, Play } from 'lucide-react';

export const LandingHero = () => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section className="relative w-full h-screen overflow-hidden bg-slate-900">
            {/* Background Video Holder */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-slate-900/60 z-10" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900 z-10" />

                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    poster={heroImage}
                >
                    <source
                        src="https://joy1.videvo.net/videvo_files/video/free/2019-11/link_contents/190828_07_Full_Moon_Day_054.mp4"
                        type="video/mp4"
                    />
                    {/* Fallback image */}
                    <img src={heroImage} alt="Hero Background" className="w-full h-full object-cover" />
                </video>
            </div>

            {/* Content Container */}
            <div className="relative h-full z-20 flex flex-col items-center justify-center text-center px-4">
                <div
                    className="max-w-5xl space-y-10 transition-all duration-1000 ease-out"
                    style={{
                        transform: `translateY(${-scrollY * 0.2}px)`,
                        opacity: 1 - scrollY / 500
                    }}
                >
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white text-sm font-black uppercase tracking-[0.2em] animate-fade-in shadow-2xl">
                        <span className="h-2 w-2 rounded-full bg-[#f97316] animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.8)]" />
                        Souveraineté Nationale & Intelligence
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                        L'AVENIR DU <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f97316] to-orange-400">PÉTROLE</span>
                        <br /><span className="text-white/40">EST NUMÉRIQUE.</span>
                    </h1>

                    <p className="text-lg md:text-2xl text-blue-50/70 max-w-3xl mx-auto font-medium leading-relaxed drop-shadow-lg">
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

                {/* Metrics Overlay */}
                <div className="absolute bottom-20 left-0 right-0 hidden lg:block px-8">
                    <div className="max-w-7xl mx-auto grid grid-cols-4 gap-8">
                        {[
                            { label: "Précision IoT", val: "99.9%" },
                            { label: "Temps de Réponse", val: "< 15m" },
                            { label: "Couverture Régionale", val: "100%" },
                            { label: "Alertes Critiques", val: "Automatisées" }
                        ].map((m, i) => (
                            <div key={i} className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 text-center transition-all hover:bg-white/10">
                                <p className="text-[#f97316] text-3xl font-black mb-1">{m.val}</p>
                                <p className="text-white/40 text-xs font-black uppercase tracking-widest">{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce opacity-30">
                    <div className="w-8 h-12 border-2 border-white rounded-full flex justify-center p-2">
                        <div className="w-1.5 h-3 bg-white rounded-full" />
                    </div>
                </div>
            </div>
        </section>
    );
};
