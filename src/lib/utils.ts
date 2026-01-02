import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function unescapeNewlines(s) {
  if (typeof s !== "string") return s;
  // Convert \r\n first, then \n
  return s.replace(/\\r\\n/g, "\r\n").replace(/\\n/g, "\n");
}
