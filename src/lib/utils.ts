import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(str: string, _options?: { lower?: boolean; strict?: boolean }): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // remove non-word chars
    .replace(/[\s_-]+/g, "-") // replace spaces and underscores with a single hyphen
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
}
