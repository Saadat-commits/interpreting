import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Manrope, Vazirmatn } from "next/font/google";
import { HelpChat } from "@/components/HelpChat";
import { dirOf, getDictionary, isLocale, locales } from "@/lib/i18n";
import "../globals.css";

const sans = Manrope({ subsets: ["latin", "latin-ext"], variable: "--font-sans", display: "swap" });
const fa = Vazirmatn({ subsets: ["arabic", "latin"], variable: "--font-fa", display: "swap" });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDictionary(locale);
  const isPublic = process.env.SITE_PUBLIC === "true";
  return {
    title: { default: `${t.meta.title} | Interpreting NBG`, template: "%s | Interpreting NBG" },
    description: t.meta.description,
    robots: isPublic ? undefined : { index: false, follow: false },
    alternates: { languages: { de: "/de", fa: "/fa" } },
  };
}

export const viewport: Viewport = { themeColor: "#ffffff", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDictionary(locale);
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${sans.variable} ${fa.variable}`}>
      <body className="min-h-screen">
        {children}
        <HelpChat locale={locale} t={t.help} />
      </body>
    </html>
  );
}
