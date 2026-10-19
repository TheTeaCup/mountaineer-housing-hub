export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function phoneHref(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 10) digits = `1${digits}`;
  return `tel:+${digits}`;
}
