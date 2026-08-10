export interface Point {
  readonly x: number;
  readonly y: number;
}

function polarPoint(center: number, radius: number, angle: number): Point {
  const radians = (angle * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(radians),
    y: center + radius * Math.sin(radians),
  };
}

export function createSegmentPath(index: number, count: number, size: number): string {
  const center = size / 2;
  const radius = center;
  const segmentAngle = 360 / count;
  const startAngle = -90 + index * segmentAngle;
  const endAngle = startAngle + segmentAngle;
  const start = polarPoint(center, radius, startAngle);
  const end = polarPoint(center, radius, endAngle);
  const largeArc = segmentAngle > 180 ? 1 : 0;

  return `M ${center} ${center} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export function getSegmentLabelPosition(index: number, count: number, size: number): Point {
  const center = size / 2;
  const segmentAngle = 360 / count;
  const angle = -90 + (index + 0.5) * segmentAngle;
  return polarPoint(center, size * 0.31, angle);
}
