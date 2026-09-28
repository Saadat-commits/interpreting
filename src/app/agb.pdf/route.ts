import { renderAgbPdf } from "@/lib/server/pdf/agb";

export async function GET() {
  const pdf = await renderAgbPdf();
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="AGB-Interpreting-NBG.pdf"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
