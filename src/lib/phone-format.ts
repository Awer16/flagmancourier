export function normalizePhoneDigits(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("8")) {
    d = `7${d.slice(1)}`;
  }
  if (d.length > 0 && !d.startsWith("7")) {
    d = `7${d}`;
  }
  return d.slice(0, 11);
}

export function formatRuPhoneDisplay(digits: string): string {
  const n = digits.startsWith("7") ? digits.slice(1) : digits;
  const body = n.slice(0, 10);
  if (body.length === 0 && digits.length === 0) {
    return "";
  }
  let r = "+7";
  if (body.length === 0) {
    return r;
  }
  r += ` (${body.slice(0, 3)}`;
  if (body.length <= 3) {
    return body.length === 3 ? `${r})` : r;
  }
  r += `) ${body.slice(3, 6)}`;
  if (body.length <= 6) {
    return r;
  }
  r += `-${body.slice(6, 8)}`;
  if (body.length <= 8) {
    return r;
  }
  return `${r}-${body.slice(8, 10)}`;
}
