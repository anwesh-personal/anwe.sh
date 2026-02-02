'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

const navLinks = [
    { href: '#expertise', label: 'Expertise' },
    { href: '#journey', label: 'Journey' },
    { href: '/blog', label: 'Insights' },
    { href: '#contact', label: 'Contact' },
];

export function Navigation() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768 && isMenuOpen) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isMenuOpen]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMenuOpen]);

    const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        if (!href.startsWith('#')) return;

        e.preventDefault();
        setIsMenuOpen(false);

        const target = document.querySelector(href);

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

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <>
            <nav className={`nav ${isScrolled ? 'scrolled' : ''}`}>
                <Link href="/" className="logo-link">
                    <Image
                        src="/logo.png"
                        alt="Anwesh Rath"
                        width={40}
                        height={40}
                        className="logo-image"
                        priority
                    />
                </Link>

                {/* Desktop Nav */}
                <ul className="nav-links">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className="nav-link"
                                onClick={(e) => handleSmoothScroll(e, link.href)}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <Link
                    href="#contact"
                    className="nav-cta desktop-only"
                    onClick={(e) => handleSmoothScroll(e, '#contact')}
                >
                    Let&apos;s Talk
                </Link>

                {/* Hamburger Button */}
                <button
                    className={`hamburger ${isMenuOpen ? 'open' : ''}`}
                    onClick={toggleMenu}
                    aria-label="Toggle menu"
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
                <ul className="mobile-nav-links">
                    {navLinks.map((link) => (
                        <li key={link.href}>
                            <Link
                                href={link.href}
                                className="mobile-nav-link"
                                onClick={(e) => handleSmoothScroll(e, link.href)}
                            >
                                {link.label}
                            </Link>
                        </li>
                    ))}
                </ul>
                <Link
                    href="#contact"
                    className="mobile-cta"
                    onClick={(e) => handleSmoothScroll(e, '#contact')}
                >
                    Let&apos;s Talk
                </Link>
            </div>
        </>
    );
}
