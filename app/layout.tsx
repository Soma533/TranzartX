import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { MobileTabBar } from "@/components/mobile-tabbar";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { PwaRegister } from "@/components/pwa-register";
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
  manifest: "/manifest.webmanifest",
  title: {
    default: "TranzartX — Don't just showcase your art. Build your career.",
    template: "%s · TranzartX"
  },
  description: "African art commerce and professional networking for emerging artists.",
  // iOS installs use these; Android/Chrome read manifest.ts.
  appleWebApp: { capable: true, title: "TranzartX", statusBarStyle: "default" },
  icons: {
    icon: ["/icon.svg", "/icons/icon-192.png"],
    apple: ["/apple-touch-icon.png", "/icons/icon-192.png"]
  },
  openGraph: {
    title: "TranzartX",
    description: "Portfolio, marketplace, opportunities and network for emerging African artists.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <head>
        {/* Next emits mobile-web-app-capable but not the Apple-specific tag
            older iOS Safari needs to allow Add to Home Screen. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans">
        <Providers>
          <Navbar />
          <div className="mx-auto flex max-w-6xl gap-6 px-4">
            <DesktopSidebar />
            {/* Extra bottom padding so the phone tab bar never covers content. */}
            <main className="min-w-0 flex-1 py-8 pb-24 md:pb-8">{children}</main>
          </div>
          <Footer />
          <Toaster />
          <MobileTabBar />
          <PwaRegister />
        </Providers>
      </body>
    </html>
  );
}
