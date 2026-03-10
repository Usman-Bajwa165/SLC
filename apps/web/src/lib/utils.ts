import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string or object to "02 Feb 2026, 12:15 PM"
 */
export function formatDateTime(date: string | Date | null | undefined) {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  };

  return new Intl.DateTimeFormat("en-GB", options).format(d);
}

/**
 * Formats a date string or object to "02 Feb 2026"
 */
export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "N/A";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";

  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  return new Intl.DateTimeFormat("en-GB", options).format(d);
}

export function formatCurrency(amount: string | number | null | undefined) {
  if (amount === null || amount === undefined) return "0.00";
  return parseFloat(amount.toString()).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatContact(contact: string | null | undefined) {
  if (!contact) return "—";
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 11) return contact;
  return `${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
}

export function formatCNIC(cnic: string | null | undefined) {
  if (!cnic) return "—";
  const digits = cnic.replace(/\D/g, "");
  if (digits.length !== 13) return cnic;
  return `${digits.substring(0, 5)}-${digits.substring(5, 12)}-${digits.substring(12)}`;
}
