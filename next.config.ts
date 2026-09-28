import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDF-Fonts werden zur Laufzeit von der Festplatte gelesen
  outputFileTracingIncludes: {
    "/**": ["./assets/fonts/**"],
  },
  serverExternalPackages: ["pdf-lib", "@pdf-lib/fontkit", "nodemailer"],
  poweredByHeader: false,
};

export default nextConfig;
