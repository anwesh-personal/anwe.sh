'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const stats = [
    { value: '17+', label: 'Years' },
    { value: '50+', label: 'Systems' },
    { value: '$M+', label: 'Revenue' },
    { value: '∞', label: 'Impact' },
];

export function Stats() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Stagger reveal
            gsap.fromTo('.stat-item',
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: '.stats-grid',
                        start: 'top 85%',
                    },
                }
            );

            // Subtle parallax on stat numbers
            gsap.to('.stat-number', {
                y: -15,
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 2,
                },
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} className="stats">
            <div className="stats-grid">
                {stats.map((stat, index) => (
                    <div key={index} className="stat-item">
                        <div className="stat-number">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}
