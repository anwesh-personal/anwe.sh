'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface SocialLinks {
    twitter?: string;
    linkedin?: string;
    github?: string;
    youtube?: string;
}

const defaultLinks = [
    { href: 'https://linkedin.com/in/anweshrath', label: 'LinkedIn', key: 'linkedin' },
    { href: 'https://twitter.com/anweshrath', label: 'Twitter', key: 'twitter' },
    { href: 'https://github.com/anweshrath', label: 'GitHub', key: 'github' },
];

export function Footer() {
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        // Fetch social settings from API
        async function fetchSettings() {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    const settings = data.settings || [];

                    const links: SocialLinks = {};
                    settings.forEach((s: { key: string; value: string }) => {
                        if (s.key === 'socialTwitter') links.twitter = s.value;
                        if (s.key === 'socialLinkedin') links.linkedin = s.value;
                        if (s.key === 'socialGithub') links.github = s.value;
                        if (s.key === 'socialYoutube') links.youtube = s.value;
                    });

                    setSocialLinks(links);
                }
            } catch (error) {
                console.error('Failed to fetch social links:', error);
            } finally {
                setLoaded(true);
            }
        }

        fetchSettings();
    }, []);

    // Build links array from settings or use defaults
    const footerLinks = loaded && (socialLinks.twitter || socialLinks.linkedin || socialLinks.github || socialLinks.youtube)
        ? [
            socialLinks.linkedin && { href: socialLinks.linkedin, label: 'LinkedIn', key: 'linkedin' },
            socialLinks.twitter && { href: socialLinks.twitter, label: 'Twitter', key: 'twitter' },
            socialLinks.github && { href: socialLinks.github, label: 'GitHub', key: 'github' },
            socialLinks.youtube && { href: socialLinks.youtube, label: 'YouTube', key: 'youtube' },
        ].filter(Boolean) as { href: string; label: string; key: string }[]
        : defaultLinks;

    return (
        <footer className="footer">
            <Link href="/" className="footer-logo-link">
                <Image
                    src="/logo.png"
                    alt="Anwesh Rath"
                    width={32}
                    height={32}
                    className="footer-logo-image"
                />
            </Link>

            <div className="footer-links">
                {footerLinks.map((link) => (
                    <a
                        key={link.key}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-link"
                    >
                        {link.label}
                    </a>
                ))}
            </div>

            <span className="footer-copy">© {new Date().getFullYear()}</span>
        </footer>
    );
}

