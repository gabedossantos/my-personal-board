import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Rough token estimator for development (approx. 1 token ~= 4 chars)
// This avoids external dependencies and keeps numbers stable.
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const len = text.replace(/\s+/g, ' ').trim().length;
  return Math.max(1, Math.ceil(len / 4));
}