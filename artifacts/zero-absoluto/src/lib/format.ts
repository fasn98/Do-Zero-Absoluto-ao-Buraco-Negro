const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
};

export const superscript = (value: number | string) => String(value).replace(/[0-9-]/g, (d) => SUPERSCRIPT[d] ?? d);

export function formatNumber(value: number, digits = 2) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

/** Notação científica a partir de log₁₀(x): funciona mesmo para 10⁻⁵⁰⁰⁰. */
export function formatFromLog10(log10Value: number, digits = 2): string {
  if (!Number.isFinite(log10Value)) return log10Value > 0 ? '∞' : '0';
  if (log10Value > -3 && log10Value < 4) return formatNumber(10 ** log10Value, digits + 1);
  let exponent = Math.floor(log10Value);
  let mantissa = 10 ** (log10Value - exponent);
  if (Math.abs(exponent) > 1e5) return `10^(${formatSci(log10Value, 3)})`;
  if (Number(mantissa.toFixed(digits)) >= 10) { mantissa /= 10; exponent += 1; }
  return `${formatNumber(mantissa, digits)} × 10${superscript(exponent)}`;
}

export function formatSci(value: number, digits = 2): string {
  if (value === 0) return '0';
  return (value < 0 ? '−' : '') + formatFromLog10(Math.log10(Math.abs(value)), digits);
}

export function formatTemperature(value: number) {
  if (value < 1e-6) return `${formatNumber(value * 1e9)} nK`;
  if (value < 1e-3) return `${formatNumber(value * 1e6)} μK`;
  if (value < 1) return `${formatNumber(value * 1e3)} mK`;
  if (value < 1000) return `${formatNumber(value, 1)} K`;
  if (value < 1e6) return `${Math.round(value).toLocaleString('pt-BR')} K`;
  if (value < 1e9) return `${formatNumber(value / 1e6)} milhões K`;
  if (value < 1e12) return `${formatNumber(value / 1e9)} bilhões K`;
  return `${formatSci(value)} K`;
}

/** Tempo em segundos para texto legível. */
export function formatDuration(seconds: number, secondsPerYear: number) {
  const years = seconds / secondsPerYear;
  if (seconds < 1e-3) return `${formatSci(seconds)} s`;
  if (seconds < 60) return `${formatNumber(seconds)} s`;
  if (seconds < 86400) return `${formatNumber(seconds / 3600)} h`;
  if (years < 1) return `${formatNumber(seconds / 86400, 1)} dias`;
  if (years < 1e6) return `${formatNumber(years, 0)} anos`;
  if (years < 1e9) return `${formatNumber(years / 1e6)} milhões de anos`;
  if (years < 1e12) return `${formatNumber(years / 1e9)} bilhões de anos`;
  return `${formatSci(years)} anos`;
}
