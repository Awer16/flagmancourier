import type { Metadata } from "next";
import { Jost, Unbounded } from "next/font/google";
import { CustomerAddressProvider } from "@/components/customer/customer-address-provider";
import SessionProvider from "@/components/session/session-provider";
import { ThemeProvider } from "@/components/theme/theme-context";
import "./globals.css";

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Courier.Here — доставка",
  description: "Агрегатор службы доставки «Флагман»",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      className={`${jost.variable} ${unbounded.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <ThemeProvider>
          <CustomerAddressProvider>
            <SessionProvider>{children}</SessionProvider>
          </CustomerAddressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
