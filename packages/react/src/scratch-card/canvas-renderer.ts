import type { ScratchPoint } from '@jackpotkit/core';

export interface ScratchSegment {
  readonly from: ScratchPoint;
  readonly seed: number;
  readonly to: ScratchPoint;
}

interface DrawCoverOptions {
  readonly accentColor: string;
  readonly coverColor: string;
  readonly height: number;
  readonly width: number;
}

function seededUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43_758.5453;
  return value - Math.floor(value);
}

export function prepareScratchCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
): CanvasRenderingContext2D | null {
  const pixelRatio = Math.max(1, globalThis.devicePixelRatio ?? 1);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const context = canvas.getContext('2d');
  context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return context;
}

export function drawScratchCover(
  context: CanvasRenderingContext2D,
  { accentColor, coverColor, height, width }: DrawCoverOptions,
): void {
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
  context.clearRect(0, 0, width, height);

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, coverColor);
  gradient.addColorStop(0.46, accentColor);
  gradient.addColorStop(0.53, coverColor);
  gradient.addColorStop(1, coverColor);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.save();
  context.globalAlpha = 0.17;
  context.strokeStyle = '#FFFFFF';
  context.lineWidth = 1;
  const stripeGap = 16;
  for (let offset = -height; offset < width + height; offset += stripeGap) {
    context.beginPath();
    context.moveTo(offset, height);
    context.lineTo(offset + height, 0);
    context.stroke();
  }
  context.restore();

  context.save();
  for (let index = 0; index < Math.max(18, Math.round((width * height) / 1_400)); index += 1) {
    const x = seededUnit(index + 11) * width;
    const y = seededUnit(index + 47) * height;
    const size = 0.7 + seededUnit(index + 83) * 1.5;
    context.globalAlpha = 0.16 + seededUnit(index + 109) * 0.24;
    context.fillStyle = index % 3 === 0 ? accentColor : '#FFFFFF';
    context.fillRect(x, y, size, size);
  }
  context.restore();

  const bandHeight = Math.max(34, height * 0.3);
  const bandY = (height - bandHeight) / 2;
  context.save();
  context.globalAlpha = 0.17;
  context.fillStyle = '#FFFFFF';
  context.fillRect(width * 0.08, bandY, width * 0.84, bandHeight);
  context.restore();

  context.save();
  context.fillStyle = '#FFFFFF';
  context.font = `800 ${Math.max(13, Math.min(20, height * 0.12))}px system-ui, sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('SCRATCH & WIN', width / 2, height / 2 - 4);
  context.globalAlpha = 0.72;
  context.font = `700 ${Math.max(8, Math.min(11, height * 0.065))}px system-ui, sans-serif`;
  context.fillText('RUB THE FOIL TO REVEAL', width / 2, height / 2 + 17);
  context.restore();

  context.save();
  context.globalAlpha = 0.34;
  context.strokeStyle = '#FFFFFF';
  context.lineWidth = 1.5;
  context.strokeRect(5, 5, width - 10, height - 10);
  context.restore();
}

function drawRoughLine(
  context: CanvasRenderingContext2D,
  from: ScratchPoint,
  to: ScratchPoint,
  lineWidth: number,
): void {
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = lineWidth;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
}

export function eraseScratchSegment(
  context: CanvasRenderingContext2D,
  segment: ScratchSegment,
  brushRadius: number,
): void {
  const angle = seededUnit(segment.seed + 5) * Math.PI * 2;
  const nextAngle = angle + (seededUnit(segment.seed + 17) - 0.5) * 0.9;
  const fringeOffset = brushRadius * 0.67;
  const offsetFrom = {
    x: Math.cos(angle) * fringeOffset,
    y: Math.sin(angle) * fringeOffset,
  };
  const offsetTo = {
    x: Math.cos(nextAngle) * fringeOffset,
    y: Math.sin(nextAngle) * fringeOffset,
  };

  context.save();
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'destination-out';
  drawRoughLine(context, segment.from, segment.to, brushRadius * 1.45);
  drawRoughLine(
    context,
    { x: segment.from.x + offsetFrom.x, y: segment.from.y + offsetFrom.y },
    { x: segment.to.x + offsetTo.x, y: segment.to.y + offsetTo.y },
    brushRadius * 0.55,
  );
  drawRoughLine(
    context,
    { x: segment.from.x - offsetFrom.x, y: segment.from.y - offsetFrom.y },
    { x: segment.to.x - offsetTo.x, y: segment.to.y - offsetTo.y },
    brushRadius * 0.48,
  );
  context.restore();
}
