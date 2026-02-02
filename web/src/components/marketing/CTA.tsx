'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export function CTA() {
    const sectionRef = useRef<HTMLElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Breathing glow
            gsap.to(glowRef.current, {
                scale: 1.2,
                opacity: 0.5,
                duration: 3,
                repeat: -1,
                yoyo: true,
                ease: 'sine.inOut',
            });

            // Subtle parallax on glow
            gsap.to(glowRef.current, {
                y: -50,
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1,
                },
            });

            // Content reveal
            gsap.fromTo('.cta-content > *',
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: '.cta-content',
                        start: 'top 80%',
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="contact" className="cta">
            <div ref={glowRef} className="ambient" />

            <div className="cta-content">
                <h2 className="cta-title">Let&apos;s Build</h2>
                <p className="cta-subtitle">
                    Have an enterprise challenge? Let&apos;s architect the solution together.
                </p>
                <Link href="mailto:hello@anwe.sh" className="hero-cta">
                    Start a Conversation
                </Link>
            </div>
        </section>
    );
}
