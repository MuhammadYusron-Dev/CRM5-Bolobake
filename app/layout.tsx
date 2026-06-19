import type { Metadata, Viewport } from "next";
import { Inter, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { InternalChat } from "@/components/features/InternalChat";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bolobake B2B Dashboard",
  description: "Order Management Dashboard for Bolobake",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className={`${inter.variable} ${dmSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-500" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          <div id="main-app" className="flex flex-col flex-1 relative z-10">
            {/* Dark Mode Ambient Blobs - Global */}
            <div className="hidden dark:block fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#0059FF]/20 blur-[120px] animate-blob mix-blend-screen"></div>
              <div className="absolute top-[20%] right-[-10%] w-[35vw] h-[35vw] rounded-full bg-[#8b5cf6]/20 blur-[100px] animate-blob animation-delay-2000 mix-blend-screen"></div>
              <div className="absolute bottom-[-20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[#0ea5e9]/15 blur-[150px] animate-blob animation-delay-4000 mix-blend-screen"></div>
            </div>
            {children}
            <InternalChat />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
