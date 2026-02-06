'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';

gsap.registerPlugin(ScrollTrigger);

const journeyItems = [
    {
        year: '2005-08',
        era: 'The Beginning',
        title: 'Beginnings',
        description: 'Started the journey into technology and systems. Learning the craft, building the foundation for everything that followed.',
        image: '/journey-1.jpg',
    },
    {
        year: '2008-11',
        era: 'Enterprise',
        title: 'Microsoft Era',
        description: 'Joined one of the world\'s largest tech companies. Learned what it takes to build systems that serve billions.',
        image: '/journey-2.jpg',
    },
    {
        year: '2012-16',
        era: 'Family & Founder',
        title: 'Family & Ventures',
        description: 'Became a father. Started companies. The most complex systems to build are human ones.',
        image: '/journey-3.jpg',
    },
    {
        year: '2016-20',
        era: 'Author & Consultant',
        title: 'Bestselling Author',
        description: 'Published bestsellers. Consulted for enterprises. Mastered persuasion, sales funnels, and human psychology.',
        image: '/images/anwesh-author.jpg',
    },
    {
        year: 'Now',
        era: 'The New Era',
        title: 'AI Systems Architect',
        description: 'Combining 17+ years of NLP, psychology, tech, and sales into enterprise AI solutions.',
        image: '/journey-5.png',
    },
];

export function Journey() {
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header
            gsap.fromTo('.journey-header > *',
                { opacity: 0, y: 30 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.6,
                    stagger: 0.1,
                    scrollTrigger: { trigger: '.journey-header', start: 'top 80%' },
                }
            );

            // Each phase
            document.querySelectorAll('.journey-phase').forEach((phase) => {
                gsap.fromTo(phase,
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.8,
                        scrollTrigger: { trigger: phase, start: 'top 80%' },
                    }
                );
            });
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="journey" className="journey-section">
            {/* Header */}
            <div className="journey-header">
                <span className="section-tag">The Path</span>
                <h2 className="section-title">17 Years of Building</h2>
            </div>

            {/* Timeline */}
            <div className="journey-list">
                {journeyItems.map((item, index) => (
                    <div
                        key={index}
                        className={`journey-phase ${index % 2 === 1 ? 'reverse' : ''}`}
                    >
                        {/* Image */}
                        <div className="journey-img-wrap">
                            <Image
                                src={item.image}
                                alt={item.title}
                                width={260}
                                height={260}
                                className="journey-img"
                            />
                            <span className="journey-badge">{item.year}</span>
                        </div>

                        {/* Content */}
                        <div className="journey-text">
                            <span className="journey-era">{item.era}</span>
                            <h3 className="journey-title">{item.title}</h3>
                            <p className="journey-desc">{item.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
