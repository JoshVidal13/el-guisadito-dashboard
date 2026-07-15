import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainLayout } from "@/components/MainLayout";
import { ToastProvider } from "@/components/ui/Toast";
import { AIChat } from "@/components/ui/AIChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "El Guisadito | Dashboard",
  description: "Sistema financiero y operativo para la taquería El Guisadito",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('elguisadito_theme') || 'nocturno';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <ToastProvider>
          <MainLayout>{children}</MainLayout>
          <AIChat />
        </ToastProvider>
      </body>
    </html>
  );
}
