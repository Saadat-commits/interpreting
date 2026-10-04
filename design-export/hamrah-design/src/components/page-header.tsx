import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

export function PageHeader({ title, intro }: { title: string; intro: string }) {
  const { t, rtl } = useLocale();
  return (
    <header className="page-header-depth border-b bg-page-header">
      <div className="site-container relative py-10 sm:py-16 lg:py-20">
        <span className="page-header-plane" aria-hidden="true" />
        <nav
          aria-label={t.breadcrumb}
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Link to="/" className="hover:text-primary">
            {t.navHome}
          </Link>
          <ChevronRight className={`size-4 ${rtl ? "rotate-180" : ""}`} aria-hidden="true" />
          <span aria-current="page">{title}</span>
        </nav>
        <h1 className="mt-7 max-w-4xl font-serif text-[2.4rem] font-normal leading-[1.04] sm:text-[4rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          {intro}
        </p>
      </div>
    </header>
  );
}
