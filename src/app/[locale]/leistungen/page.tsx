import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ServicesContent } from "@/components/HomeContent";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: getDictionary(locale).gov.services } : {};
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ServicesContent locale={locale} t={getDictionary(locale)} />;
}
