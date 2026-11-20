import type { Metadata } from "next";
import { Inter, Press_Start_2P } from "next/font/google";
import "./globals.css";
import "./forest.css";
import "./contact.css";
import "./about.css";
import "./notes.css";
import "./folk-perch.css";
import "./wizard-launcher.css";
import "./experience-map.css";
import "./portfolio.css";
import "./time-traveller.css";
import "./emma.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ForestScene } from "@/components/ForestScene";
import { FolkProvider } from "@/components/folk/FolkProvider";
import { WizardProvider } from "@/components/wizard/WizardProvider";
import { WizardLauncher } from "@/components/wizard/WizardLauncher";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });
const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin", "latin-ext"], variable: "--font-press-start" });

export const metadata: Metadata = {
  title: "Marcel Šedo – Frontend & Design Systems Engineer",
  description:
    "Frontend & design systems engineer focused on web accessibility. Builds ID‑SK, Slovakia's national government design system.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${pressStart.variable}`}>
      <body className="bg-[#0b1428]">
        <WizardProvider>
          <FolkProvider>
            <div className="scene-wrap">
              <SiteHeader />
              <main id="main" tabIndex={-1} className="scene-main flex-1 focus:outline-none">
                {children}
              </main>
              <ForestScene />
            </div>
            <SiteFooter />
            <WizardLauncher />
          </FolkProvider>
        </WizardProvider>
      </body>
    </html>
  );
}