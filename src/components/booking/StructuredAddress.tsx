"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { addressProblems, formatAddress, normalizeStreet, parseFreeAddress } from "@/lib/address";
import type { Locale, PostalAddress } from "@/lib/types";
import { IconCheck, IconPin } from "../icons";

export interface AddressTexts {
  street: string;
  streetPlaceholder: string;
  postalCode: string;
  city: string;
  cityAuto: string;
  cityPick: string;
  plzUnknown: string;
  needNumber: string;
}

interface Suggestion {
  id: string;
  title: string;
  subtitle: string;
  address?: PostalAddress;
  needsDetails?: boolean;
}

/**
 * Adresse in drei klaren Feldern – wie beim Online-Banking:
 *  1. Straße + Hausnummer (mit Vorschlägen; eine komplett eingefügte Adresse wird automatisch aufgeteilt)
 *  2. PLZ → sobald 5 Ziffern da sind, erscheint der Ort automatisch darunter
 *  3. Ort (automatisch, bei mehreren Orten zur Auswahl)
 */
export function StructuredAddress({
  value,
  onChange,
  t,
  locale,
  autoFocus,
}: {
  value: PostalAddress | null;
  onChange: (a: PostalAddress | null) => void;
  t: AddressTexts;
  locale: Locale;
  autoFocus?: boolean;
}) {
  const id = useId();
  const [streetLine, setStreetLine] = useState(value ? `${value.street} ${value.houseNumber}` : "");
  const [plz, setPlz] = useState(value?.postalCode ?? "");
  const [city, setCity] = useState(value?.city ?? "");
  const [placeName, setPlaceName] = useState(value?.placeName);
  const [cities, setCities] = useState<string[]>([]);
  const [plzState, setPlzState] = useState<"idle" | "loading" | "found" | "unknown">(value?.city ? "found" : "idle");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [streetTouched, setStreetTouched] = useState(false);
  const plzRef = useRef<HTMLInputElement>(null);

  // Straße + Hausnummer trennen
  const parsedStreet = useMemo(() => {
    const m = streetLine.trim().match(/^(.*?[A-Za-zÄÖÜäöüß.])\s*(\d+\s*[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)$/);
    return m ? { street: normalizeStreet(m[1]), houseNumber: m[2].replace(/\s+/g, "") } : { street: normalizeStreet(streetLine), houseNumber: "" };
  }, [streetLine]);

  // Ergebnis melden
  useEffect(() => {
    const a: PostalAddress = {
      street: parsedStreet.street,
      houseNumber: parsedStreet.houseNumber,
      postalCode: plz,
      city,
      country: "DE",
      label: "",
      source: "manual",
      placeName,
    };
    a.label = formatAddress(a);
    onChange(addressProblems(a).length === 0 ? a : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedStreet, plz, city, placeName]);

  // PLZ → Ort (live)
  useEffect(() => {
    if (!/^\d{5}$/.test(plz)) {
      setCities([]);
      setPlzState("idle");
      return;
    }
    let cancelled = false;
    setPlzState("loading");
    fetch(`/api/plz?code=${plz}`)
      .then((r) => r.json() as Promise<{ cities: string[] }>)
      .then(({ cities: found }) => {
        if (cancelled) return;
        setCities(found);
        if (found.length === 0) setPlzState("unknown");
        else {
          setPlzState("found");
          if (!found.includes(city)) setCity(found[0]);
        }
      })
      .catch(() => !cancelled && setPlzState("unknown"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plz]);

  // Vorschläge für Straße/Einrichtung
  useEffect(() => {
    const q = streetLine.trim();
    if (q.length < 3 || !open) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q + (plz.length === 5 ? ` ${plz}` : ""))}&lang=${locale}`, { signal: ctrl.signal });
        if (res.ok) setItems(((await res.json()) as { suggestions: Suggestion[] }).suggestions.slice(0, 5));
      } catch {
        /* Vorschläge sind optional */
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [streetLine, open, plz, locale]);

  const apply = async (s: Suggestion) => {
    let a = s.address;
    if (!a && s.needsDetails) {
      const res = await fetch(`/api/places/details?id=${encodeURIComponent(s.id)}&lang=${locale}`);
      if (res.ok) a = ((await res.json()) as { address: PostalAddress }).address;
    }
    if (!a) return;
    setStreetLine(`${a.street} ${a.houseNumber}`.trim());
    setPlz(a.postalCode);
    setCity(a.city);
    setPlaceName(a.placeName);
    setOpen(false);
  };

  // Eine komplette Adresse eingefügt/getippt? → automatisch auf die Felder verteilen
  const onStreetChange = (v: string) => {
    const full = parseFreeAddress(v);
    if (full && full.postalCode && full.street) {
      setStreetLine(`${full.street} ${full.houseNumber}`.trim());
      setPlz(full.postalCode);
      if (full.city) setCity(full.city);
      setPlaceName(undefined);
      return;
    }
    setStreetLine(v);
    setPlaceName(undefined);
    setOpen(true);
  };

  const needNumber = streetTouched && parsedStreet.street.length > 1 && !parsedStreet.houseNumber;
  const ok = !!value;

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="field-label" htmlFor={`${id}-s`}>
          {t.street}
        </label>
        <input
          id={`${id}-s`}
          className="field !py-3.5 !text-base"
          value={streetLine}
          onChange={(e) => onStreetChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => (setOpen(false), setStreetTouched(true)), 160)}
          placeholder={t.streetPlaceholder}
          autoComplete="street-address"
          autoFocus={autoFocus}
          dir="ltr"
        />
        {open && items.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-deep" dir="ltr">
            {items.map((s) => (
              <li key={s.id}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => apply(s)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-brand-50">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-brand-700 ring-1 ring-brand-100">
                    <IconPin size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold text-ink">{s.title}</span>
                    <span className="block truncate text-[13px] text-ink-muted">{s.subtitle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {needNumber && <p className="mt-1.5 text-[13px] text-brand-800">{t.needNumber}</p>}
        {placeName && (
          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700" dir="ltr">
            <IconCheck size={14} strokeWidth={2.6} /> {placeName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-3" dir="ltr">
        <div>
          <label className="field-label" htmlFor={`${id}-p`}>
            {t.postalCode}
          </label>
          <input
            id={`${id}-p`}
            ref={plzRef}
            className="field !py-3.5 !text-base tracking-[0.12em]"
            value={plz}
            onChange={(e) => setPlz(e.target.value.replace(/\D/g, "").slice(0, 5))}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="90402"
            maxLength={5}
          />
        </div>
        <div>
          <label className="field-label" htmlFor={`${id}-c`}>
            {t.city}
          </label>
          {cities.length > 1 ? (
            <select id={`${id}-c`} className="field !py-3.5 !text-base" value={city} onChange={(e) => setCity(e.target.value)}>
              {cities.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          ) : (
            <div className="relative">
              <input
                id={`${id}-c`}
                className={`field !py-3.5 !text-base transition ${plzState === "found" ? "!border-brand-300 !bg-brand-50/40" : ""}`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                placeholder={plzState === "loading" ? "…" : ""}
              />
              {plzState === "found" && (
                <span className="absolute end-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white">
                  <IconCheck size={13} strokeWidth={3} />
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="min-h-[20px] text-[13px]" aria-live="polite">
        {plzState === "found" && cities.length === 1 && <span className="text-brand-700">✓ {t.cityAuto.replace("{city}", city)}</span>}
        {plzState === "found" && cities.length > 1 && <span className="text-ink-muted">{t.cityPick}</span>}
        {plzState === "unknown" && <span className="text-ink-muted">{t.plzUnknown}</span>}
        {ok && plzState !== "found" && <span className="text-brand-700">✓</span>}
      </div>
    </div>
  );
}
