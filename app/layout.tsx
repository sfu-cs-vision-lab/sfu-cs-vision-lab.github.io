import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import NavBar from "../components/NavBar";
import SiteFooter from "../components/SiteFooter";

// Archivo (Omnibus-Type), variable in width and weight. SIL Open Font License: app/fonts/OFL.txt
const archivo = localFont({
  src: "./fonts/archivo-latin-wdth-wght.woff2",
  variable: "--font-archivo",
  weight: "100 900",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 125%" }],
});

// robots: remove at launch. The site is a preview until the drafts are approved.
export const metadata: Metadata = {
  title: {
    default: "Computational Vision Lab · Simon Fraser University",
    template: "%s · Computational Vision Lab",
  },
  description: "Code, data, and publications.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/academicons@1.9.5/css/academicons.min.css"
        />
      </head>
      <body>
        <NavBar />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
