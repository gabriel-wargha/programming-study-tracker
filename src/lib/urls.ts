import { z } from "zod";

/** Same rule as the database checks: an absolute `https` URL with a host and no spaces. */
const httpsUrlPattern = /^https:\/\/[^\s/?#]+\S*$/;

export function isHttpsUrl(value: string): boolean {
  return value.length <= 2048 && httpsUrlPattern.test(value) && URL.canParse(value);
}

/** A required `https` URL, such as a repository link. */
export function httpsUrlSchema(requiredMessage: string) {
  return z.string().trim().min(1, requiredMessage).max(2048, "Use 2,048 characters or fewer.")
    .refine(isHttpsUrl, "Enter a full URL that starts with https://.");
}

/** An optional `https` URL. An empty value becomes null. */
export function optionalHttpsUrlSchema() {
  return z.string().trim().max(2048, "Use 2,048 characters or fewer.")
    .refine((value) => value === "" || isHttpsUrl(value), "Enter a full URL that starts with https://.")
    .transform((value) => value || null);
}
