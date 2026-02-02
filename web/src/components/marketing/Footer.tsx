import Link from 'next/link';
import Image from 'next/image';

const footerLinks = [
    { href: 'https://linkedin.com/in/anweshrath', label: 'LinkedIn' },
    { href: 'https://twitter.com/anweshrath', label: 'Twitter' },
    { href: 'https://github.com/anweshrath', label: 'GitHub' },
];

export function Footer() {
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
                        key={link.href}
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
