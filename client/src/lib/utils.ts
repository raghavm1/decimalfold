import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSalary(min?: number, max?: number): string {
  if (!min && !max) return "Salary not specified";
  if (!max) return `$${(min! / 1000).toFixed(0)}k+`;
  if (!min) return `Up to $${(max / 1000).toFixed(0)}k`;
  return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return "Today";
  if (diffInDays === 1) return "1 day ago";
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 14) return "1 week ago";
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return `${Math.floor(diffInDays / 30)} months ago`;
}

export function getConfidenceColor(confidence: string): string {
  switch (confidence.toLowerCase()) {
    case 'high': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

export function getMatchScoreColor(score: number): string {
  if (score >= 0.9) return 'bg-green-500';
  if (score >= 0.8) return 'bg-green-400';
  if (score >= 0.7) return 'bg-yellow-500';
  if (score >= 0.6) return 'bg-yellow-400';
  return 'bg-red-400';
}
