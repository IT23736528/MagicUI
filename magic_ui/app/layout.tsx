import type { Metadata } from "next";
import { Google_Sans } from "next/font/google";
import "./globals.css";

const appFont = Google_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
  variable: "--font-google-sans",
});

export const metadata: Metadata = {
  title: "UIUX Mockup Generator App", 
  description: "Generate High Quality Free UIUX Mobile and Web Mockup Design",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={appFont.className}
      >
        {children}
      </body>
    </html>
  );
}
