import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/settings.server";

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

// Dynamic SEO Metadata from settings
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  const title = settings.defaultMetaTitle || settings.siteName || "Anwesh Rath";
  const description = settings.defaultMetaDescription || settings.siteDescription ||
    "17+ years architecting enterprise solutions, AI systems, and automation.";
  const siteName = settings.siteName || "Anwesh Rath";
  const ogImage = settings.defaultOgImage || "/og.png";

  return {
    metadataBase: new URL("https://anwe.sh"),
    title: {
      default: title,
      template: `%s | ${siteName}`,
    },
    description,
    keywords: [
      "systems architect",
      "enterprise builder",
      "AI systems",
      "automation",
      "SaaS architecture",
      "product builder",
      siteName,
    ],
    authors: [{ name: siteName, url: "https://anwe.sh" }],
    creator: siteName,
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://anwe.sh",
      siteName,
      title,
      description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${siteName} - Systems Architect`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: settings.socialTwitter ? `@${settings.socialTwitter.replace('@', '').replace('https://twitter.com/', '').replace('https://x.com/', '')}` : "@anweshrath",
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
}

import { ThemeProvider } from '@/components/ThemeProvider';
import { AnalyticsTracker } from '@/components/AnalyticsTracker';
import { LeadCapture } from '@/components/LeadCapture';
import { GoogleAnalytics } from '@/components/GoogleAnalytics';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings for GA and custom code
  const settings = await getSettings();

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Inject custom head code if configured */}
        {settings.customHeadCode && (
          <script dangerouslySetInnerHTML={{ __html: settings.customHeadCode }} />
        )}
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
          {/* Analytics & Lead Capture - only on public pages */}
          <AnalyticsTracker />
          <LeadCapture
            trigger="exit_intent"
            title="Stay Connected"
            subtitle="Get insights on AI systems and enterprise architecture delivered to your inbox."
          />
        </ThemeProvider>

        {/* Google Analytics */}
        <GoogleAnalytics gaId={settings.googleAnalyticsId} />

        {/* Inject custom body code if configured */}
        {settings.customBodyCode && (
          <script dangerouslySetInnerHTML={{ __html: settings.customBodyCode }} />
        )}
      </body>
    </html>
  );
}



