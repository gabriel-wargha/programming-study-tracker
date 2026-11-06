// @vitest-environment node
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "vitest";

const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
const token = (name: string) => {
  const value = css.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))?.[1];
  if (!value) throw new Error(`Missing token ${name}`);
  return value;
};
const luminance = (hex: string) => {
  const channel = (start: number) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
};
const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

test.each([
  ["foreground", "canvas"], ["foreground", "card"], ["foreground", "muted"], ["foreground", "subtle"],
  ["muted-foreground", "canvas"], ["muted-foreground", "card"], ["muted-foreground", "muted"], ["muted-foreground", "subtle"],
  ["primary-foreground", "primary"], ["primary", "card"], ["primary", "canvas"], ["secondary-foreground", "secondary"], ["primary", "secondary"],
  ["destructive", "card"], ["destructive", "canvas"],
  ["type-course", "card"], ["type-reading", "card"], ["type-video", "card"], ["type-practice", "card"], ["type-project", "card"], ["type-other", "card"],
  ["type-practice", "canvas"], ["type-reading", "canvas"],
])("%s on %s meets the 4.5:1 text contrast", (text, background) => {
  expect(contrast(token(text), token(background))).toBeGreaterThanOrEqual(4.5);
});

test("white on the destructive button meets the 4.5:1 text contrast", () => {
  expect(contrast("#ffffff", token("destructive"))).toBeGreaterThanOrEqual(4.5);
});
