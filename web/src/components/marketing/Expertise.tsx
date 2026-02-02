'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const expertiseItems = [
    {
        icon: '🏗️',
        title: 'Enterprise SaaS',
        description: 'Architecture for multi-tenant platforms that scale to millions.',
    },
    {
        icon: '🤖',
        title: 'AI Systems',
        description: 'Intelligent automation that delivers measurable ROI.',
    },
    {
        icon: '📈',
        title: 'Sales Architecture',
        description: 'Funnels and systems that convert at enterprise scale.',
    },
    {
        icon: '🎯',
        title: 'Product Strategy',
        description: 'From concept to market-fit with precision positioning.',
    },
    {
        icon: '⚡',
        title: 'Automation',
        description: 'End-to-end systems that eliminate manual work.',
    },
    {
        icon: '🧠',
        title: 'NLP & Psychology',
        description: 'Human behavior insights for UX and persuasion.',
    },
];

export function Expertise() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.section-header > *',
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.section-header',
                        start: 'top 80%',
                    },
                }
            );

            gsap.fromTo('.expertise-card',
                { opacity: 0, y: 60 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: '.expertise-grid',
                        start: 'top 75%',
                    },
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="expertise" className="expertise">
            <div className="section-header">
                <div className="section-tag">What I Build</div>
                <h2 className="section-title">Areas of Mastery</h2>
            </div>

            <div className="expertise-grid">
                {expertiseItems.map((item, index) => (
                    <div key={index} className="expertise-card">
                        <div className="expertise-icon">{item.icon}</div>
                        <h3 className="expertise-title">{item.title}</h3>
                        <p className="expertise-desc">{item.description}</p>
                    </div>
                ))}
            </div>
        </section>
    );
}
