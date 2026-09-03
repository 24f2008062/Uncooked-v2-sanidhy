import { Inter, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import SupabaseProvider from "@/components/providers/SupabaseProvider";
import ScrollToTop from "@/components/layout/ScrollToTop";
import CookieNotice from "@/components/legal/CookieNotice";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "Uncooked Portal: Delightful Campus Events Start Here",
  description:
    "The enterprise-grade zero-noise operating system for student events, campus ecosystems, host verification and infrastructure telemetry. Discover, create, and manage events effortlessly.",
  keywords: [
    "campus events",
    "event platform",
    "student events",
    "hackathons",
    "workshops",
    "event management",
    "ticketing",
    "QR check-in",
  ],
  openGraph: {
    title: "Uncooked Portal: Delightful Campus Events Start Here",
    description:
      "From run clubs to launch parties, Uncooked makes every event feel effortless.",
    type: "website",
    siteName: "Uncooked Portal",
  },
  twitter: {
    card: "summary_large_image",
    title: "Uncooked Portal",
    description:
      "The zero-noise operating system for campus events.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <SupabaseProvider>
          <ThemeProvider>
            <ScrollToTop />
            <CookieNotice />
            {children}
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
