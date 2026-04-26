import type { Metadata } from "next";
import localFont from "next/font/local";
import { Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from './context/AuthContext';
import { AchievementProvider } from './context/AchievementContext';
import GlobalSettingsButton from './components/GlobalSettingsButton';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Noah Verse",
  description: "13 AI personas. One board. Zero mercy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full`}
      >
        <AuthProvider>
          <AchievementProvider>
            {children}
            <GlobalSettingsButton />
          </AchievementProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
