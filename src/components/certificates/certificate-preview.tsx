import type { TemplateLayout } from "@/lib/contracts/certification";

const PAGE = { width: 842, height: 595 };
const INK = "#0b1b33";
const MUTED = "#5b6b82";

interface Props {
  layout: TemplateLayout;
  accentColor: string;
  organizationName: string;
  heading: string;
  bodyText: string;
  signatoryName: string | null;
  signatoryTitle: string | null;
  recipientName: string;
  courseTitle: string;
  completedOn: string;
  certificateNumber: string;
  /** Uploaded artwork can't be drawn here; the PDF preview shows it. */
  hasBackground?: boolean;
  className?: string;
  title?: string;
}

type Field = TemplateLayout["heading"];
const anchor = (f: Field) => (f.align === "center" ? "middle" : f.align === "right" ? "end" : "start");
/** PDF y runs bottom-up; SVG y runs top-down. */
const flip = (y: number) => PAGE.height - y;

/**
 * Spec §21.6 CertificatePreview: the template drawn at its real coordinates (A4 landscape, points)
 * with sample or real data, mirroring the pdf-lib renderer. The QR code is a placeholder.
 */
export function CertificatePreview(p: Props) {
  const L = p.layout;
  const text = (f: Field, value: string, style: { weight?: number; family?: string; fill?: string; size?: number; y?: number }) => (
    <text
      x={f.x}
      y={flip(style.y ?? f.y)}
      textAnchor={anchor(f)}
      fontSize={style.size ?? f.size}
      fontWeight={style.weight ?? 400}
      fontFamily={style.family ?? "Helvetica, Arial, sans-serif"}
      fill={style.fill ?? INK}
    >
      {value}
    </text>
  );
  const sig = L.signature;
  const qr = L.qr;
  return (
    <svg viewBox={`0 0 ${PAGE.width} ${PAGE.height}`} role="img" aria-label={p.title ?? `Certificate preview for ${p.recipientName}`} className={p.className}>
      <rect width={PAGE.width} height={PAGE.height} fill="#fbfcfe" />
      {p.hasBackground ? (
        <g>
          <rect x={22} y={22} width={PAGE.width - 44} height={PAGE.height - 44} fill="none" stroke={MUTED} strokeDasharray="6 6" opacity={0.5} />
          <text x={PAGE.width / 2} y={40} textAnchor="middle" fontSize={11} fill={MUTED} fontFamily="Helvetica, Arial, sans-serif">
            Your artwork is drawn underneath — open the PDF preview to see it
          </text>
        </g>
      ) : (
        <g>
          <rect x={22} y={22} width={PAGE.width - 44} height={PAGE.height - 44} fill="none" stroke={p.accentColor} strokeWidth={3} />
          <rect x={32} y={32} width={PAGE.width - 64} height={PAGE.height - 64} fill="none" stroke={INK} strokeOpacity={0.35} strokeWidth={0.6} />
          {[
            [32, 32, 1, 1],
            [PAGE.width - 32, 32, -1, 1],
            [32, PAGE.height - 32, 1, -1],
            [PAGE.width - 32, PAGE.height - 32, -1, -1],
          ].map(([cx, cy, dx, dy]) => (
            <path key={`${cx}-${cy}`} d={`M${cx!} ${cy! + dy! * 6}h${dx! * 26}M${cx! + dx! * 6} ${cy!}v${dy! * 26}`} stroke={p.accentColor} strokeWidth={1.2} />
          ))}
        </g>
      )}
      {text(L.organization, p.organizationName, { weight: 700 })}
      {text(L.heading, p.heading, { weight: 700, fill: p.accentColor })}
      <line x1={L.heading.x - 40} x2={L.heading.x + 40} y1={flip(L.heading.y - 14)} y2={flip(L.heading.y - 14)} stroke={p.accentColor} strokeWidth={1.5} />
      {text(L.body, "This certifies that", { fill: MUTED, y: L.recipientName.y + L.recipientName.size + 6 })}
      {text(L.recipientName, p.recipientName, { weight: 700, family: "'Times New Roman', Times, serif" })}
      {text(L.body, p.bodyText, { fill: MUTED })}
      {text(L.courseTitle, p.courseTitle, { weight: 700 })}
      {text(L.issueDate, `Completed on ${p.completedOn}`, { fill: MUTED })}
      {p.signatoryName ? (
        <g>
          <line x1={sig.x} x2={sig.x + sig.width} y1={flip(sig.y)} y2={flip(sig.y)} stroke={INK} strokeWidth={0.8} />
          {text({ x: sig.x + sig.width / 2, y: sig.y - 15, size: 11, align: "center" }, p.signatoryName, { weight: 700 })}
          {p.signatoryTitle ? text({ x: sig.x + sig.width / 2, y: sig.y - 28, size: 9, align: "center" }, p.signatoryTitle, { fill: MUTED }) : null}
        </g>
      ) : null}
      <g aria-hidden="true">
        <rect x={qr.x} y={flip(qr.y + qr.size)} width={qr.size} height={qr.size} fill="#fff" stroke={INK} strokeWidth={1} />
        <path
          d={`M${qr.x + 8} ${flip(qr.y + qr.size) + 8}h18v18h-18zM${qr.x + qr.size - 26} ${flip(qr.y + qr.size) + 8}h18v18h-18zM${qr.x + 8} ${flip(qr.y) - 26}h18v18h-18z`}
          fill={INK}
        />
        <text x={qr.x + qr.size / 2} y={flip(qr.y + qr.size / 2) + 4} textAnchor="middle" fontSize={10} fill={MUTED} fontFamily="Helvetica, Arial, sans-serif">
          QR
        </text>
      </g>
      {text(L.certificateNumber, `Certificate No. ${p.certificateNumber}`, { fill: MUTED })}
    </svg>
  );
}
