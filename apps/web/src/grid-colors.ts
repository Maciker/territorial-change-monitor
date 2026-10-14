type Rgb = readonly [number, number, number];

// Sequential (one hue, light -> dark) for NDVI magnitude; diverging pair with a gray midpoint for the difference.
const sequentialLight: Rgb = [0xcd, 0xe2, 0xfb];
const sequentialDark: Rgb = [0x0d, 0x36, 0x6b];
const divergingMidpoint: Rgb = [0xf0, 0xef, 0xec];
const gainPole: Rgb = [0x25, 0x6a, 0xbf];
const lossPole: Rgb = [0xe3, 0x49, 0x48];
const ndviRange = { low: -0.2, high: 1 } as const;
const differenceSaturation = 0.8;

export const legendColors = {
  ndviLow: toHex(sequentialLight),
  ndviHigh: toHex(sequentialDark),
  gain: toHex(gainPole),
  loss: toHex(lossPole),
  neutral: toHex(divergingMidpoint),
} as const;

export function ndviColor(value: number): string {
  const share = (value - ndviRange.low) / (ndviRange.high - ndviRange.low);
  return toHex(mix(sequentialLight, sequentialDark, share));
}

export function differenceColor(value: number): string {
  const pole = value >= 0 ? gainPole : lossPole;
  return toHex(mix(divergingMidpoint, pole, Math.abs(value) / differenceSaturation));
}

function mix(from: Rgb, to: Rgb, share: number): Rgb {
  const clamped = Math.min(1, Math.max(0, share));
  return [0, 1, 2].map((channel) => Math.round(from[channel]! + (to[channel]! - from[channel]!) * clamped)) as unknown as Rgb;
}

function toHex(color: Rgb): string {
  return `#${color.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}
