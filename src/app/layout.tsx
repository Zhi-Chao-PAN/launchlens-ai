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
  title: "LaunchLens AI",
  description:
    "AI-powered go-to-market workspace for indie founders and small teams.",
  applicationName: "LaunchLens AI",
  keywords: [
    "AI SaaS",
    "go-to-market",
    "indie founders",
    "LLM",
    "MiniMax",
    "Next.js",
    "portfolio",
  ],
  openGraph: {
    title: "LaunchLens AI - From raw idea to cited GTM decisions",
    description:
      "An AI-powered go-to-market workspace: structured GTM generation, evidence-grounded validation, and cited decision briefs with provider abstraction and cloud persistence.",
    type: "website",
    siteName: "LaunchLens AI",
    images: [
      {
        url: "/og.png",
        width: 1280,
        height: 640,
        alt: "LaunchLens AI - portfolio cover image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LaunchLens AI - From raw idea to cited GTM decisions",
    description:
      "An AI-powered go-to-market workspace: structured GTM generation, evidence-grounded validation, and cited decision briefs.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
