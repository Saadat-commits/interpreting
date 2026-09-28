"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { addressProblems, formatAddress, parseFreeAddress } from "@/lib/address";
import { cityForPostalCode } from "@/lib/postal";
import type { Dictionary } from "@/lib/i18n";
import type { Locale, PostalAddress } from "@/lib/types";
import { IconAlert, IconCheck, IconPin, IconSearch } from "../icons";

interface Suggestion {
  id: string;
  title: string;
  subtitle: string;
  address?: PostalAddress;
  needsDetails?: boolean;
  /** Aus der Eingabe erkannte Adresse (funktioniert auch ohne Vorschlagsdienst) */
  typed?: boolean;
}

type T = Dictionary["booking"]["addressField"];

/**
 * Adressfeld mit Vorschlägen (Google Places bzw. OpenStreetMap/Photon).
 * Gilt erst als gültig, wenn eine vollständige Adresse ausgewählt oder
 * manuell vollständig eingegeben wurde.
 */
export function AddressField({
  label,
  placeholder,
  value,
  onChange,
  t,
  locale,
  autoFocus,
  quickPlaces,
  quickLabel,
}: {
  label: string;
  placeholder: string;
  value: PostalAddress | null;
  onChange: (a: PostalAddress | null) => void;
  t: T;
  locale: Locale;
  autoFocus?: boolean;
  /** Häufige Orte, die mit einem Tipp übernommen werden */
  quickPlaces?: PostalAddress[];
  quickLabel?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const session = useMemo(() => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Math.random())), []);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [touched, setTouched] = useState(false);
  const [manual, setManual] = useState({ street: "", houseNumber: "", postalCode: "", city: "", placeName: "" as string | undefined });
  const [manualTouched, setManualTouched] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  // Vorschläge laden (entprellt)
  useEffect(() => {
    if (mode !== "search" || value) return;
    const q = query.trim();
    if (q.length < 3) {
      setItems([]);
      setLoading(false);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}&lang=${locale}&session=${session}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { suggestions: Suggestion[] };
        setItems(data.suggestions);
        setUnavailable(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setUnavailable(true);
          setItems([]);
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query, mode, value, locale, session]);

  // Frei getippte, vollständige Adresse direkt als ersten Vorschlag anbieten
  const typed = useMemo<Suggestion | null>(() => {
    const p = parseFreeAddress(query);
    if (!p) return null;
    if (!p.city && p.postalCode) p.city = cityForPostalCode(p.postalCode) ?? "";
    const a: PostalAddress = { ...p, country: "DE", label: "", source: "manual" };
    if (addressProblems(a).length) return null;
    a.label = formatAddress(a);
    return { id: "typed", title: `${a.street} ${a.houseNumber}`, subtitle: `${a.postalCode} ${a.city}`, address: a, typed: true };
  }, [query]);

  const list = useMemo(() => {
    if (!typed) return items;
    const key = (x?: PostalAddress) => (x ? `${x.street}|${x.houseNumber}|${x.postalCode}`.toLowerCase() : "");
    const dup = items.some((i) => i.address && key(i.address) === key(typed.address));
    return dup ? items : [typed, ...items];
  }, [typed, items]);

  useEffect(() => {
    if (open) setActive(list.length ? 0 : -1);
  }, [list, open]);

  /** Beim Verlassen des Feldes: erkannte Adresse übernehmen oder fehlende Teile gezielt abfragen – ohne Fehlermeldung */
  const settle = () => {
    setOpen(false);
    if (value || mode !== "search" || !query.trim()) return;
    if (typed) {
      onChange(typed.address!);
      return;
    }
    const p = parseFreeAddress(query);
    if (p && !p.city && p.postalCode) p.city = cityForPostalCode(p.postalCode) ?? "";
    if (p && (p.street || p.postalCode) && query.trim().length >= 5) {
      setManual({ ...p, placeName: undefined });
      setManualTouched({});
      setMode("manual");
    } else setTouched(true);
  };

  const choose = async (s: Suggestion) => {
    setOpen(false);
    let addr = s.address;
    if (!addr && s.needsDetails) {
      setLoading(true);
      try {
        const res = await fetch(`/api/places/details?id=${encodeURIComponent(s.id)}&lang=${locale}&session=${session}`);
        if (res.ok) addr = ((await res.json()) as { address: PostalAddress }).address;
      } finally {
        setLoading(false);
      }
    }
    if (!addr) {
      setUnavailable(true);
      return;
    }
    if (addressProblems(addr).length === 0) {
      onChange(addr);
      setTouched(false);
      return;
    }
    // Unvollständig (meist fehlende Hausnummer): Felder vorbelegen und gezielt nachfragen
    setManual({ street: addr.street, houseNumber: addr.houseNumber, postalCode: addr.postalCode, city: addr.city, placeName: addr.placeName });
    setManualTouched({});
    setMode("manual");
    setTimeout(() => numberRef.current?.focus(), 50);
  };

  // Manuelle Eingabe → sobald vollständig, als gültige Adresse melden
  useEffect(() => {
    if (mode !== "manual") return;
    const a: PostalAddress = {
      ...manual,
      street: manual.street.trim(),
      houseNumber: manual.houseNumber.trim(),
      postalCode: manual.postalCode.trim(),
      city: manual.city.trim(),
      country: "DE",
      label: "",
      source: "manual",
      placeName: manual.placeName || undefined,
    };
    a.label = formatAddress(a);
    onChange(addressProblems(a).length === 0 ? a : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manual, mode]);

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && (!open || !list.length)) {
      e.preventDefault();
      settle();
      return;
    }
    if (!open || !list.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % list.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + list.length) % list.length);
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(list[active]);
    } else if (e.key === "Escape") setOpen(false);
  };

  const reset = () => {
    onChange(null);
    setMode("search");
    setQuery("");
    setItems([]);
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  /* ---------- Bestätigte Adresse ---------- */
  if (value && mode === "search") {
    return (
      <div>
        <span className="field-label">{label}</span>
        <div className="flex items-center gap-4 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3.5 shadow-[0_0_0_4px_rgba(44,138,93,.06)]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <IconCheck size={18} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1" dir="ltr">
            {value.placeName && <div className="break-words text-[15px] font-bold text-ink">{value.placeName}</div>}
            <div className={`break-words ${value.placeName ? "text-sm text-ink-soft" : "text-[15px] font-semibold text-ink"}`}>{formatAddress(value)}</div>
            <div className="mt-0.5 text-xs font-medium text-brand-700" dir={locale === "fa" ? "rtl" : "ltr"}>
              {t.selected}
            </div>
          </div>
          <button type="button" onClick={reset} className="rounded-full px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-white">
            {t.change}
          </button>
        </div>
      </div>
    );
  }

  /* ---------- Manuelle Eingabe ---------- */
  if (mode === "manual") {
    const draft = { ...manual, country: "DE" };
    const problems = addressProblems(draft);
    const show = (k: keyof typeof manual) => manualTouched[k] && problems.includes(k as never);
    const input = (k: "street" | "houseNumber" | "postalCode" | "city", extra: string, ref?: React.Ref<HTMLInputElement>, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
      <div className={extra}>
        <label className="mb-1 block text-xs font-semibold text-ink-soft" htmlFor={`${id}-${k}`}>
          {t[k]}
        </label>
        <input
          id={`${id}-${k}`}
          ref={ref}
          className={`field ${show(k) ? "field-invalid" : ""}`}
          value={manual[k]}
          onChange={(e) => setManual({ ...manual, [k]: e.target.value })}
          onBlur={() => setManualTouched((m) => ({ ...m, [k]: true }))}
          aria-invalid={show(k)}
          dir="ltr"
          {...props}
        />
      </div>
    );
    return (
      <div>
        <span className="field-label">{label}</span>
        <div className="rounded-2xl border border-line bg-paper p-4">
          {manual.placeName && <div className="mb-3 text-sm font-bold text-ink">{manual.placeName}</div>}
          {manual.street && !manual.houseNumber && (
            <p className="mb-3 flex items-start gap-2 text-sm text-ink-soft">
              <IconAlert size={18} className="mt-0.5 shrink-0 text-brand-600" /> {t.needNumber}
            </p>
          )}
          <div className="grid grid-cols-6 gap-3">
            {input("street", "col-span-4", undefined, { autoComplete: "address-line1" })}
            {input("houseNumber", "col-span-2", numberRef)}
            {input("postalCode", "col-span-2", undefined, { inputMode: "numeric", autoComplete: "postal-code", maxLength: 5 })}
            {input("city", "col-span-4", undefined, { autoComplete: "address-level2" })}
          </div>
          {problems.filter((p) => manualTouched[p]).map((p) => (
            <p key={p} className="field-error">
              <IconAlert size={16} className="mt-px shrink-0" /> {t.problems[p]}
            </p>
          ))}
          <div className="mt-3 flex items-center justify-between gap-3">
            {problems.length === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700">
                <IconCheck size={16} strokeWidth={2.4} /> {t.selected}
              </span>
            ) : (
              <span />
            )}
            {!unavailable && (
              <button type="button" onClick={reset} className="text-sm font-semibold text-brand-700 hover:underline">
                {t.useSearch}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Suche ---------- */
  const showHint = touched && !open && query.trim().length > 0 && !value;
  const showList = open && query.trim().length >= 3 && (!loading || list.length > 0);
  return (
    <div className="relative">
      <label className="field-label" htmlFor={`${id}-q`}>
        {label}
      </label>
      <div className="relative">
        <IconSearch size={18} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          id={`${id}-q`}
          ref={inputRef}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          autoFocus={autoFocus}
          className="field !pe-11 !ps-11"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setTouched(false);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(settle, 180)}
          onKeyDown={onKey}
          dir="ltr"
        />
        {loading && (
          <span className="absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" aria-label={t.searching} />
        )}
      {showList && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-2xl border border-line bg-white p-1.5 shadow-deep">
          {list.length === 0 && (
            <li className="px-4 py-3 text-sm leading-relaxed text-ink-muted">{t.keepTyping}</li>
          )}
          {list.map((s, i) => (
            <li
              key={s.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(s)}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${i === active ? "bg-brand-50" : ""}`}
              dir="ltr"
            >
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${i === active ? "bg-brand-600 text-white" : "bg-paper text-brand-700"}`}>
                {s.typed ? <IconCheck size={16} strokeWidth={2.4} /> : <IconPin size={16} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[15px] font-semibold leading-snug text-ink">{s.title}</span>
                <span className="block break-words text-[13px] text-ink-muted">{s.subtitle}</span>
                {s.typed && (
                  <span className="mt-1 inline-block rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-semibold text-white sm:hidden" dir={locale === "fa" ? "rtl" : "ltr"}>
                    {t.useTyped}
                  </span>
                )}
              </span>
              {s.typed && (
                <span className="hidden shrink-0 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white sm:inline-block" dir={locale === "fa" ? "rtl" : "ltr"}>
                  {t.useTyped}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      </div>

      {quickPlaces && quickPlaces.length > 0 && !query.trim() && (
        <div className="mt-3">
          {quickLabel && <div className="mb-2 text-[13px] font-semibold text-ink-muted">{quickLabel}</div>}
          <div className="flex flex-wrap gap-2" dir="ltr">
            {quickPlaces.map((qp) => (
              <button
                key={qp.label}
                type="button"
                onClick={() => onChange(qp)}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-brand-800 transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-soft"
              >
                <IconPin size={14} className="text-brand-600" /> {qp.placeName}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className={`mt-2 flex items-start gap-1.5 text-[13px] leading-relaxed ${showHint ? "text-brand-800" : "text-ink-muted"}`}>
        {showHint && <IconAlert size={15} className="mt-0.5 shrink-0 text-brand-600" />}
        {t.hint}
      </p>
      <button
        type="button"
        onClick={() => {
          const p = parseFreeAddress(query);
          setManual({ street: p?.street ?? "", houseNumber: p?.houseNumber ?? "", postalCode: p?.postalCode ?? "", city: p?.city ?? "", placeName: undefined });
          setManualTouched({});
          setMode("manual");
        }}
        className={`mt-1 text-sm font-semibold hover:underline ${unavailable ? "text-brand-700" : "text-ink-muted"}`}
      >
        {t.manual}
      </button>
    </div>
  );
}
