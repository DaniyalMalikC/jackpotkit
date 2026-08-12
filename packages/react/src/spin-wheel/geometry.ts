export function createSegmentPath(index: number, count: number, radius: number): string {
  const start = (index / count) * Math.PI * 2 - Math.PI / 2;
  const end = ((index + 1) / count) * Math.PI * 2 - Math.PI / 2;
  const point = (angle: number) => ({
    x: radius + Math.cos(angle) * radius,
    y: radius + Math.sin(angle) * radius,
  });
  const startPoint = point(start);
  const endPoint = point(end);
  return `M ${radius} ${radius} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${count === 1 ? 1 : 0} 1 ${endPoint.x} ${endPoint.y} Z`;
}

export function getSegmentLabelPosition(index: number, count: number, radius: number) {
  const angle = ((index + 0.5) / count) * Math.PI * 2 - Math.PI / 2;
  return {
    x: radius + Math.cos(angle) * radius * 0.62,
    y: radius + Math.sin(angle) * radius * 0.62,
  };
}
