import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Gotu } from 'next/font/google';
import Sidebar from "./components/Sidebar";

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const gotu = Gotu({
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
  preload: false,
  variable: '--font-gotu',
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'Wedding Theory CMS',
  description: 'Wedding Planning Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${gotu.variable} font-gotu`}
      >
        <div className='flex h-screen bg-[#FAF7F4] text-gray-800'>
          <Sidebar />
          {/* Main Content */}
          <div className='flex-1'>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
