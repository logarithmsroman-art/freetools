import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FreeTool — Free Online Tools",
  description: "A massive collection of free browser-based utilities. No sign-up, no limits.",
  icons: {
    icon: '/logo.png'
  }
};

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ThemeProvider } from "@/components/ThemeProvider";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ToolWrapper from "@/components/ToolWrapper";
import { createClient } from "@/utils/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isAdmin = !!user

  return (
    <html lang="en">
      <head>
        {!isAdmin && (
          <script src="https://quge5.com/88/tag.min.js" data-zone="222281" async data-cfasync="false"></script>
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeProvider>
          <AnalyticsTracker />
          <AnnouncementBanner />
          <div className="container" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
            <Navbar />
            <ToolWrapper>
              {children}
            </ToolWrapper>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
