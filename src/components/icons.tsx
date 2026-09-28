import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 22, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconPhone = (p: P) => (
  <Base {...p}>
    <path d="M5 4h3.2l1.6 4-2 1.3a11 11 0 0 0 6.9 6.9l1.3-2 4 1.6V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4Z" />
  </Base>
);
export const IconPin = (p: P) => (
  <Base {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
    <circle cx="12" cy="10" r="2.4" />
  </Base>
);
export const IconMedical = (p: P) => (
  <Base {...p}>
    <path d="M6 3v5a4 4 0 0 0 8 0V3" />
    <path d="M10 12v2.5a5 5 0 0 0 10 0V12" />
    <circle cx="20" cy="10" r="2" />
  </Base>
);
export const IconSchool = (p: P) => (
  <Base {...p}>
    <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
    <path d="M7 10.5V15c0 1.4 2.2 3 5 3s5-1.6 5-3v-4.5" />
    <path d="M21 8.5V14" />
  </Base>
);
export const IconFamily = (p: P) => (
  <Base {...p}>
    <circle cx="8" cy="6.5" r="2.5" />
    <circle cx="16.5" cy="8" r="2" />
    <path d="M3.5 20v-3.5A4.5 4.5 0 0 1 8 12h0a4.5 4.5 0 0 1 4.5 4.5V20" />
    <path d="M14 14.2a3.5 3.5 0 0 1 6.5 1.8V20" />
  </Base>
);
export const IconBuilding = (p: P) => (
  <Base {...p}>
    <path d="M3 9.5 12 4l9 5.5" />
    <path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8" />
    <path d="M3 20.5h18" />
  </Base>
);
export const IconCounsel = (p: P) => (
  <Base {...p}>
    <path d="M4 5.5h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-3.5 3v-3H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" />
    <path d="M18 9h2a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2h-1v2.5L16 17.5h-2" />
  </Base>
);
export const IconMore = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Base>
);
export const IconShield = (p: P) => (
  <Base {...p}>
    <path d="M12 3 5 6v5.5c0 4.3 3 8 7 9.5 4-1.5 7-5.2 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
);
export const IconScale = (p: P) => (
  <Base {...p}>
    <path d="M12 4v16M7 20h10M5 7h14" />
    <path d="M5 7 2.5 13a2.8 2.8 0 0 0 5 0L5 7ZM19 7l-2.5 6a2.8 2.8 0 0 0 5 0L19 7Z" />
  </Base>
);
export const IconBridge = (p: P) => (
  <Base {...p}>
    <path d="M2 17h20" />
    <path d="M4 17v-3a8 8 0 0 1 16 0v3" />
    <path d="M8 17v-4M12 17v-6M16 17v-4" />
  </Base>
);
export const IconClock = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Base>
);
export const IconCheck = (p: P) => (
  <Base {...p}>
    <path d="m5 12.5 4.2 4L19 7" />
  </Base>
);
export const IconArrow = (p: P) => (
  <Base {...p} className={`rtl:-scale-x-100 ${p.className ?? ""}`}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Base>
);
export const IconChevron = (p: P) => (
  <Base {...p}>
    <path d="m9 6 6 6-6 6" />
  </Base>
);
export const IconCalendar = (p: P) => (
  <Base {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="3" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </Base>
);
export const IconChat = (p: P) => (
  <Base {...p}>
    <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4A8 8 0 1 1 20 12Z" />
    <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth={2.4} />
  </Base>
);
export const IconClose = (p: P) => (
  <Base {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Base>
);
export const IconGlobe = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5Z" />
  </Base>
);
export const IconMail = (p: P) => (
  <Base {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m4 7 8 6 8-6" />
  </Base>
);
export const IconUser = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </Base>
);
export const IconAlert = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5M12 16h.01" strokeWidth={2} />
  </Base>
);
export const IconSend = (p: P) => (
  <Base {...p} className={`rtl:-scale-x-100 ${p.className ?? ""}`}>
    <path d="M4 12 20 4l-5 16-3.5-6.5L4 12Z" />
    <path d="m11.5 13.5 3-3" />
  </Base>
);
export const IconMenu = (p: P) => (
  <Base {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </Base>
);
export const IconSearch = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Base>
);

export const categoryIcons = {
  medical: IconMedical,
  school: IconSchool,
  youth_office: IconFamily,
  authority: IconBuilding,
  counseling: IconCounsel,
  other: IconMore,
} as const;
