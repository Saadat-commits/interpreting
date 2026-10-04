import type { ServiceSlug } from "@/config/services";
import { IconBox, IconShield, IconSparkle, IconSpeech, IconTool, IconTruck } from "../icons";

const map = {
  reinigung: IconSparkle,
  umzug: IconBox,
  montage: IconTool,
  transport: IconTruck,
  dolmetschen: IconSpeech,
  sicherheit: IconShield,
} as const;

export function ServiceIcon({ slug, size = 22, className }: { slug: ServiceSlug; size?: number; className?: string }) {
  const Icon = map[slug];
  return <Icon size={size} className={className} />;
}
