const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
};

export const superscript = (value: number | string) => String(value).replace(/[0-9-]/g, (d) => SUPERSCRIPT[d] ?? d);

export function formatNumber(value: number, digits = 2) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: digits });
}

/** Número com algarismos significativos fixos (ex.: 0,0259; 1,35; 493). */
export function formatSig(value: number, significant = 3) {
  return value.toLocaleString('pt-BR', { minimumSignificantDigits: significant, maximumSignificantDigits: significant });
}

/** Notação científica a partir de log₁₀(x): funciona mesmo para 10⁻⁵⁰⁰⁰. */
export function formatFromLog10(log10Value: number, digits = 2): string {
  if (!Number.isFinite(log10Value)) return log10Value > 0 ? '∞' : '0';
  if (log10Value > -3 && log10Value < 4) return formatSig(10 ** log10Value, digits + 1);
  let exponent = Math.floor(log10Value);
  let mantissa = 10 ** (log10Value - exponent);
  // Expoentes gigantes: a mantissa não tem significado; escrevemos o expoente por extenso.
  if (Math.abs(exponent) > 1e5) {
    const sign = log10Value < 0 ? '−' : '';
    const magnitude = Math.abs(log10Value);
    const text = magnitude < 1e12 ? Math.round(magnitude).toLocaleString('pt-BR') : formatSci(magnitude, 2);
    return `10 elevado a ${sign}${text}`;
  }
  if (Number(mantissa.toFixed(digits)) >= 10) { mantissa /= 10; exponent += 1; }
  return `${mantissa.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} × 10${superscript(exponent)}`;
}

export function formatSci(value: number, digits = 2): string {
  if (value === 0) return '0';
  return (value < 0 ? '−' : '') + formatFromLog10(Math.log10(Math.abs(value)), digits);
}

export function formatTemperature(value: number) {
  // Abaixo de 1 K: até 3 algarismos significativos; abaixo de 1 nK, notação científica
  // em kelvin, para nunca arredondar um valor positivo para zero.
  const sig = (v: number) => v.toLocaleString('pt-BR', { maximumSignificantDigits: 3 });
  if (value > 0 && value < 0.9995e-9) return `${formatSci(value)} K`;
  if (value < 0.9995e-6) return `${sig(value * 1e9)} nK`;
  if (value < 0.9995e-3) return `${sig(value * 1e6)} μK`;
  if (value < 0.9995) return `${sig(value * 1e3)} mK`;
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
  if (seconds < 60) return `${formatSig(seconds)} s`;
  if (seconds < 86400) return `${formatSig(seconds / 3600)} h`;
  if (years < 1) return `${formatSig(seconds / 86400)} dias`;
  if (years < 1e6) return `${formatSig(years)} anos`;
  if (years < 1e9) return `${formatSig(years / 1e6)} milhões de anos`;
  if (years < 1e12) return `${formatSig(years / 1e9)} bilhões de anos`;
  return `${formatSci(years)} anos`;
}

const LENGTH_UNITS = [
  { name: 'fm', factor: 1e-15 },
  { name: 'pm', factor: 1e-12 },
  { name: 'nm', factor: 1e-9 },
  { name: 'μm', factor: 1e-6 },
  { name: 'mm', factor: 1e-3 },
  { name: 'm', factor: 1 },
  { name: 'km', factor: 1e3 },
];

/** Comprimento com 3 algarismos significativos, na maior unidade em que o valor fica ≥ 1. */
export function formatLength(meters: number) {
  if (meters >= 0.9995e6 * 1e3) return `${formatSci(meters / 1e3)} km`;
  const unit = [...LENGTH_UNITS].reverse().find((u) => meters / u.factor >= 0.9995) ?? LENGTH_UNITS[0];
  return `${formatSig(meters / unit.factor)} ${unit.name}`;
}
