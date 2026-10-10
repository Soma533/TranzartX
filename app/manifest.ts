import type { MetadataRoute } from "next";

/** Web app manifest — makes TranzartX installable on phones and laptops. */
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TranzartX — Build your art career",
    short_name: "TranzartX",
    description:
      "Portfolio, marketplace, opportunities and professional network for emerging African artists.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#c2410c",
    categories: ["art", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ],
    shortcuts: [
      { name: "Discover art", short_name: "Discover", url: "/discover" },
      { name: "Messages", short_name: "Messages", url: "/messages" },
      { name: "My portfolio", short_name: "Portfolio", url: "/portfolio" }
    ]
  };
}