'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

export function Hero() {
    const heroRef = useRef<HTMLElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Ambient glow breathing
            gsap.to(glowRef.current, {
                scale: 1.15,
                opacity: 0.7,
                duration: 4,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            // Subtle parallax on scroll
            gsap.to(glowRef.current, {
                y: 150,
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1,
                },
            });

            // Content moves slightly slower for depth
            gsap.to(contentRef.current, {
                y: 80,
                scrollTrigger: {
                    trigger: heroRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: 1,
                },
            });

            // Initial load animation
            const tl = gsap.timeline({ delay: 0.2 });

            tl.fromTo('.hero-tag',
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
            );

            tl.fromTo('.hero-title',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
                '-=0.3'
            );

            tl.fromTo('.hero-subtitle',
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
                '-=0.4'
            );

            tl.fromTo('.hero-cta',
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
                '-=0.3'
            );

            tl.fromTo('.scroll-hint',
                { opacity: 0 },
                { opacity: 1, duration: 0.5 },
                '-=0.2'
            );
        }, heroRef);

        return () => ctx.revert();
    }, []);

    const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const target = document.querySelector('#expertise');

        if (target) {
            gsap.to(window, {
                duration: 1.2,
                scrollTo: {
                    y: target,
                    offsetY: 80,
                },
                ease: 'power3.inOut',
            });
        }
    };

    return (
        <section ref={heroRef} className="hero">
            <div ref={glowRef} className="ambient" />

            <div ref={contentRef} className="hero-content">
                <div className="hero-tag">Systems Architect</div>

                <h1 className="hero-title">
                    Anwesh
                    <span className="hero-title-accent">Rath</span>
                </h1>

                <p className="hero-subtitle">
                    17 years architecting enterprise solutions, AI systems, and automation
                    that transforms how businesses scale and dominate.
                </p>

                <a href="#expertise" className="hero-cta" onClick={handleSmoothScroll}>
                    Discover More
                </a>
            </div>

            <div className="scroll-hint">
                <span>Scroll</span>
                <div className="scroll-line" />
            </div>
        </section>
    );
}
