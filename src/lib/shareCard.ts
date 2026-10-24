import { t, TRAIT_LABEL_KEYS } from './i18n';
import type { Language, Report } from './report';

const W = 1080;
const H = 1920;
const SERIF = '"Cormorant Garamond", "Iowan Old Style", Palatino, Georgia, serif';
const SANS = '"Manrope", system-ui, -apple-system, "Segoe UI", sans-serif';
const DEVANAGARI = '"Nirmala UI", "Noto Sans Devanagari", "Mangal", sans-serif';

const fontFor = (language: Language, size: number, weight = 400): string =>
  `${weight} ${size}px ${language === 'hi' ? DEVANAGARI : SERIF}`;

const sansFor = (language: Language, size: number, weight = 400): string =>
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

const star = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) => {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,244,214,${alpha})`;
  ctx.fill();
};

export async function buildShareCard(report: Report, name?: string): Promise<HTMLCanvasElement> {
  await document.fonts.ready;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0512');
  bg.addColorStop(0.45, '#140a24');
  bg.addColorStop(1, '#1e1030');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.5, H * 0.18, 40, W * 0.5, H * 0.18, 700);
  glow.addColorStop(0, 'rgba(233,196,106,0.18)');
  glow.addColorStop(1, 'rgba(233,196,106,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Deterministic star field.
  let seed = 1187;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 90; i++) star(ctx, rand() * W, rand() * H, rand() * 2.2 + 0.6, rand() * 0.5 + 0.08);

  const margin = 104;
  const center = W / 2;

  ctx.textAlign = 'center';
  ctx.fillStyle = '#e9c46a';
  ctx.font = `600 22px ${SANS}`;
  ctx.letterSpacing = '10px';
  ctx.fillText('MYSTICPALM', center, 168);
  ctx.letterSpacing = '0px';

  ctx.strokeStyle = 'rgba(233,196,106,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin + 60, 212);
  ctx.lineTo(W - margin - 60, 212);
  ctx.stroke();

  ctx.fillStyle = 'rgba(243,237,247,0.55)';
  ctx.font = sansFor(report.language, 24, 500);
  ctx.letterSpacing = '6px';
  ctx.fillText(t(report.language, 'handType').toUpperCase(), center, 300);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = '#f6dfa4';
  ctx.font = fontFor(report.language, 132, 500);
  ctx.fillText(report.handType, center, 424);

  ctx.fillStyle = 'rgba(243,237,247,0.9)';
  ctx.font = fontFor(report.language, 52, 400);
  let y = 560;
  for (const line of report.essence) {
    for (const wrapped of wrapText(ctx, line, W - margin * 2, 3)) {
      ctx.fillText(wrapped, center, y);
      y += 72;
    }
  }

  // Trait bars
  y = Math.max(y + 60, 900);
  const traitEntries = Object.entries(report.traits);
  const colWidth = (W - margin * 2 - 60) / 2;
  traitEntries.forEach(([key, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (colWidth + 60);
    const rowY = y + row * 118;
    const labelKey = TRAIT_LABEL_KEYS[key];
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(243,237,247,0.62)';
    ctx.font = sansFor(report.language, 24, 500);
    ctx.letterSpacing = '2px';
    ctx.fillText((labelKey ? t(report.language, labelKey) : key).toUpperCase(), x, rowY);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.roundRect(x, rowY + 20, colWidth, 8, 4);
    ctx.fill();
    const bar = ctx.createLinearGradient(x, 0, x + colWidth, 0);
    bar.addColorStop(0, '#e9c46a');
    bar.addColorStop(1, '#f48ca6');
    ctx.fillStyle = bar;
    ctx.beginPath();
    ctx.roundRect(x, rowY + 20, (colWidth * value) / 100, 8, 4);
    ctx.fill();
    ctx.fillStyle = 'rgba(243,237,247,0.9)';
    ctx.font = fontFor(report.language, 34, 500);
    ctx.textAlign = 'right';
    ctx.fillText(String(value), x + colWidth, rowY + 8);
    ctx.textAlign = 'left';
  });

  // Clarity ring
  y += 3 * 118 + 96;
  const ringX = center;
  const ringY = Math.min(y + 96, H - 330);
  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.arc(ringX, ringY, 92, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#e9c46a';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(ringX, ringY, 92, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * report.clarityScore) / 100);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f6dfa4';
  ctx.font = fontFor(report.language, 66, 500);
  ctx.fillText(String(report.clarityScore), ringX, ringY + 20);
  ctx.fillStyle = 'rgba(243,237,247,0.55)';
  ctx.font = sansFor(report.language, 22, 500);
  ctx.letterSpacing = '5px';
  ctx.fillText(t(report.language, 'clarity').toUpperCase(), ringX, ringY + 62);
  ctx.letterSpacing = '0px';

  // Footer
  ctx.fillStyle = 'rgba(243,237,247,0.72)';
  ctx.font = fontFor(report.language, 30, 400);
  ctx.fillText(name ? `${t(report.language, 'cardFor')} ${name}` : t(report.language, 'cardNoName'), center, H - 190);
  ctx.fillStyle = 'rgba(243,237,247,0.36)';
  ctx.font = sansFor(report.language, 20, 400);
  ctx.fillText(t(report.language, 'cardTagline'), center, H - 120);

  ctx.strokeStyle = 'rgba(233,196,106,0.28)';
  ctx.beginPath();
  ctx.moveTo(center - 40, H - 78);
  ctx.lineTo(center + 40, H - 78);
  ctx.stroke();

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
