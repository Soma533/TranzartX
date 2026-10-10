import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Toaster } from "@/components/toaster";

const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-sans" });

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
  // Lets env(safe-area-inset-bottom) report the iPhone home-indicator inset.
  viewportFit: "cover"
};

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://127.0.0.1:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "TranzartX — Don't just showcase your art. Build your career.",
    template: "%s · TranzartX"
  },
  description: "African art commerce and professional networking for emerging artists.",
  openGraph: {
    title: "TranzartX",
    description: "Portfolio, marketplace, opportunities and network for emerging African artists.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans">
        <Providers>
          <Navbar />
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
