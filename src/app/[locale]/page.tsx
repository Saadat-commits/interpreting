import { notFound } from "next/navigation";
import { HomeContent } from "@/components/HomeContent";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomeContent locale={locale} t={getDictionary(locale)} />;
}
