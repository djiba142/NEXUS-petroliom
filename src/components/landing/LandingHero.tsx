import { useState, useEffect } from "react";
import heroImage from '@/assets/hero.jpg';

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
        <section className="relative w-full h-screen overflow-hidden">
            {/* Image de fond avec effet parallax subtil */}
            <div
                className="absolute inset-0 transition-transform duration-100 ease-out"
                style={{
                    transform: `translateY(${scrollY * 0.1}px)`,
                }}
            >
                <img
                    src={heroImage}
                    alt="Camion-citerne NEXUS Petroleum"
                    className="w-full h-full object-cover"
                    style={{ objectPosition: "center 40%" }}
                />
            </div>

            {/* Overlay plus sombre pour un rendu premium et une meilleure lisibilité */}
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Contenu - Vide pour l'instant comme demandé */}
            <div className="relative h-full flex flex-col items-center justify-center">
                {/* Espace réservé pour du contenu futur si nécessaire */}
            </div>
        </section>
    );
};


