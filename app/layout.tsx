import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: "Who Killed Taste? — An Interactive Investigation",
  description: "An interactive investigation into how recommendation systems shape personal taste.",
  openGraph: {
    title: "Who Killed Taste?",
    description: "In a world of unlimited choice, why are we all still the same?",
    type: "article",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "A phone feed and recommendation feedback loop." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Who Killed Taste?",
    description: "In a world of unlimited choice, why are we all still the same?",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
