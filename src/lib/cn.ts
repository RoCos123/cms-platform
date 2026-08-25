import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combină clase condiționale și rezolvă conflictele Tailwind (ultima câștigă),
 * ca o clasă dată prin prop să poată suprascrie stilul implicit al componentei.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
