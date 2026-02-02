import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Typography - Modern Sans/Mono Stack
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

// SEO Metadata
export const metadata: Metadata = {
  metadataBase: new URL("https://anwe.sh"),
  title: {
    default: "Anwesh Rath - Systems Architect & Enterprise Builder",
    template: "%s | Anwesh Rath",
  },
  description:
    "17+ years architecting enterprise solutions, AI systems, and automation that transforms how businesses scale and dominate.",
  keywords: [
    "systems architect",
    "enterprise builder",
    "AI systems",
    "automation",
    "SaaS architecture",
    "product builder",
    "Anwesh Rath",
  ],
  authors: [{ name: "Anwesh Rath", url: "https://anwe.sh" }],
  creator: "Anwesh Rath",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://anwe.sh",
    siteName: "Anwesh Rath",
    title: "Anwesh Rath - Systems Architect & Enterprise Builder",
    description:
      "17+ years architecting enterprise solutions, AI systems, and automation that transforms how businesses scale.",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Anwesh Rath - Systems Architect",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Anwesh Rath - Systems Architect & Enterprise Builder",
    description:
      "17+ years architecting enterprise solutions, AI systems, and automation.",
    images: ["/og.png"],
    creator: "@anweshrath",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

