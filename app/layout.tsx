import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.hoteltrust.org'),
  title: 'HOTELTRUST — Guest support for hotel teams',
  openGraph: {type:'website',siteName:'HOTELTRUST',url:'https://www.hoteltrust.org',title:'HOTELTRUST — Guest support for hotel teams',description:'Guest support and operations for hotel teams.'},
  description:
    "Hotel knowledge, guest requests and team handoffs in one hotel support workspace. Set up your hotel and test approved information before connecting live channels.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <Navbar />
        <a href="#main-content" className="ht-skip">Skip to content</a>
        <main className="flex-1" id="main-content">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
