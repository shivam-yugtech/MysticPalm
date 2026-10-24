import { t, TRAIT_LABEL_KEYS } from './i18n';
import { HAND_EMOJI, type Language, type Report } from './report';

const W = 1080;
const H = 1920;
const DISPLAY = '"Space Grotesk", "Segoe UI", system-ui, sans-serif';
const SANS = '"Plus Jakarta Sans", system-ui, -apple-system, "Segoe UI", sans-serif';
const DEVANAGARI = '"Noto Sans Devanagari", "Nirmala UI", "Mangal", sans-serif';
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';

const displayFor = (language: Language, size: number, weight = 700): string =>
  `${weight} ${size}px ${language === 'hi' ? DEVANAGARI : DISPLAY}`;

const sansFor = (language: Language, size: number, weight = 500): string =>
  `${weight} ${size}px ${language === 'hi' ? DEVANAGARI : SANS}`;

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines) {
    const joined = lines.join(' ');
    if (joined.length < text.replace(/\s+/g, ' ').length) {
      let last = lines[maxLines - 1];
      while (last.length > 4 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
      lines[maxLines - 1] = `${last.trimEnd()}…`;
    }
  }
  return lines;
}

const blob = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
};

const panel = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r = 36) => {
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  ctx.lineWidth = 2;
  ctx.stroke();
};

const spaced = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: string) => {
  ctx.letterSpacing = spacing;
  ctx.fillText(text, x, y);
  ctx.letterSpacing = '0px';
};

export async function buildShareCard(report: Report, name?: string): Promise<HTMLCanvasElement> {
  await document.fonts.ready;
  const lang = report.language;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#120a2e');
  bg.addColorStop(0.5, '#1d0f45');
  bg.addColorStop(1, '#2a0b3d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  blob(ctx, 120, 220, 520, 'rgba(124,77,255,0.55)');
  blob(ctx, 980, 620, 520, 'rgba(255,79,163,0.42)');
  blob(ctx, 200, 1500, 560, 'rgba(0,214,201,0.32)');
  blob(ctx, 960, 1760, 420, 'rgba(255,209,102,0.25)');

  const margin = 84;
  const inner = W - margin * 2;
  const center = W / 2;

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `700 30px ${DISPLAY}`;
  spaced(ctx, 'MYSTICPALM', center, 132, '12px');

  ctx.font = `118px ${EMOJI}`;
  ctx.fillText(HAND_EMOJI[report.handType], center, 280);

  ctx.fillStyle = '#7cf7d4';
  ctx.font = sansFor(lang, 28, 700);
  spaced(ctx, t(lang, 'personaLabel').toUpperCase(), center, 356, '5px');

  ctx.fillStyle = '#ffffff';
  ctx.font = displayFor(lang, 96, 700);
  let y = 450;
  for (const line of wrapText(ctx, report.persona.title, inner, 2)) {
    ctx.fillText(line, center, y);
    y += 98;
  }

  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = sansFor(lang, 38, 500);
  y += 4;
  for (const line of wrapText(ctx, report.persona.tagline, inner - 40, 2)) {
    ctx.fillText(line, center, y);
    y += 54;
  }

  // Superpower
  y += 28;
  ctx.font = sansFor(lang, 36, 600);
  const superLines = wrapText(ctx, report.superpower, inner - 80, 3);
  const superH = 110 + superLines.length * 50;
  panel(ctx, margin, y, inner, superH);
  ctx.fillStyle = '#ffd166';
  ctx.font = sansFor(lang, 26, 800);
  spaced(ctx, `⚡ ${t(lang, 'superpowerLabel').toUpperCase()}`, center, y + 62, '4px');
  ctx.fillStyle = '#ffffff';
  ctx.font = sansFor(lang, 36, 600);
  superLines.forEach((line, i) => ctx.fillText(line, center, y + 120 + i * 50));
  y += superH + 40;

  // Careers
  ctx.fillStyle = '#ff9ad5';
  ctx.font = sansFor(lang, 26, 800);
  spaced(ctx, `🚀 ${t(lang, 'careersTitle').toUpperCase()}`, center, y + 10, '4px');
  y += 44;
  ctx.font = sansFor(lang, 32, 700);
  const chips = report.careers.slice(0, 3).map((c) => c.title);
  const chipH = 74;
  let rowY = y;
  let rowItems: { text: string; w: number }[] = [];
  const flush = () => {
    const total = rowItems.reduce((s, c) => s + c.w, 0) + (rowItems.length - 1) * 20;
    let x = center - total / 2;
    for (const item of rowItems) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.beginPath();
      ctx.roundRect(x, rowY, item.w, chipH, chipH / 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(item.text, x + item.w / 2, rowY + 48);
      x += item.w + 20;
    }
    rowY += chipH + 18;
    rowItems = [];
  };
  for (const text of chips) {
    const label = wrapText(ctx, text, inner - 80, 1)[0] ?? text;
    const w = ctx.measureText(label).width + 64;
    const used = rowItems.reduce((s, c) => s + c.w + 20, 0);
    if (used + w > inner && rowItems.length) flush();
    rowItems.push({ text: label, w });
  }
  if (rowItems.length) flush();
  y = rowY + 26;

  // Traits: shrink to fit above the lucky row and footer, or drop them on a very long card.
  const luckyH = 150;
  const footerTop = H - 210;
  const cols = 3;
  const gap = 36;
  const colWidth = (inner - gap * (cols - 1)) / cols;
  const traitEntries = Object.entries(report.traits);
  const rows = Math.ceil(traitEntries.length / cols);
  const rowH = Math.min(96, (footerTop - luckyH - 50 - (y + 30)) / rows);
  const showTraits = rowH >= 64;
  if (showTraits) y += 30;
  (showTraits ? traitEntries : []).forEach(([key, value], index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = margin + col * (colWidth + gap);
    const ty = y + row * rowH;
    const labelKey = TRAIT_LABEL_KEYS[key];
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = sansFor(lang, 24, 700);
    ctx.fillText(labelKey ? t(lang, labelKey) : key, x, ty);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 28px ${DISPLAY}`;
    ctx.fillText(String(value), x + colWidth, ty);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.beginPath();
    ctx.roundRect(x, ty + 18, colWidth, 14, 7);
    ctx.fill();
    const bar = ctx.createLinearGradient(x, 0, x + colWidth, 0);
    bar.addColorStop(0, '#7cf7d4');
    bar.addColorStop(0.5, '#b388ff');
    bar.addColorStop(1, '#ff6ec7');
    ctx.fillStyle = bar;
    ctx.beginPath();
    ctx.roundRect(x, ty + 18, Math.max(14, (colWidth * value) / 100), 14, 7);
    ctx.fill();
  });
  if (showTraits) y += rows * rowH;

  // Lucky row
  const lucky: [string, string][] = [
    [`🎨 ${t(lang, 'luckyColor')}`, report.lucky.color],
    [`🔢 ${t(lang, 'luckyNumber')}`, report.lucky.number],
    [`📅 ${t(lang, 'luckyDay')}`, report.lucky.day],
  ];
  const boxW = (inner - 40) / 3;
  const boxY = Math.min(Math.max(y, footerTop - luckyH - 40 - 160), footerTop - luckyH - 40);
  lucky.forEach(([label, value], i) => {
    const x = margin + i * (boxW + 20);
    panel(ctx, x, boxY, boxW, luckyH, 28);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = sansFor(lang, 24, 700);
    ctx.fillText(wrapText(ctx, label, boxW - 24, 1)[0] ?? label, x + boxW / 2, boxY + 54);
    ctx.fillStyle = '#ffffff';
    ctx.font = sansFor(lang, 32, 800);
    ctx.fillText(wrapText(ctx, value, boxW - 24, 1)[0] ?? value, x + boxW / 2, boxY + 108);
  });

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = sansFor(lang, 32, 600);
  ctx.fillText(name ? `${t(lang, 'cardFor')} ${name}` : t(lang, 'cardNoName'), center, H - 150);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = sansFor(lang, 24, 500);
  ctx.fillText(t(lang, 'cardTagline'), center, H - 96);

  return canvas;
}

function download(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mysticpalm-reading.png';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function shareOrSaveCard(report: Report, name?: string): Promise<'shared' | 'saved' | 'cancelled'> {
  const canvas = await buildShareCard(report, name);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return 'cancelled';

  const file = new File([blob], 'mysticpalm-reading.png', { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My MysticPalm reading' });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    }
  }
  download(blob);
  return 'saved';
}
