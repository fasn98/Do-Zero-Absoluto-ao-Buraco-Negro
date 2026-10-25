import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Rótulos com text-transform: uppercase (Stat, versus-label, eyebrow, notes-label)
 * corrompem símbolos: λ → Λ, ħω → ĦΩ, kT → KT. Símbolos nesses rótulos
 * precisam estar dentro de <Sym>. Este teste procura rótulos em texto puro
 * que contenham letras gregas, sub/sobrescritos, operadores ou símbolos latinos comuns.
 */
const SYMBOL = /[Ͱ-Ͽ⁰-₟ħ½☉=_]|\bkT\b|\b[SE]\/k\b|\bln\b/;

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "ui" ? [] : sources(path);
    return path.endsWith(".tsx") ? [path] : [];
  });
}

describe("símbolos fora de text-transform", () => {
  it("nenhum rótulo em caixa alta contém símbolo sem <Sym>", () => {
    const offenders: string[] = [];
    for (const file of sources(join(__dirname, ".."))) {
      const code = readFileSync(file, "utf8");
      const plainLabels = [
        ...code.matchAll(/\blabel="([^"]*)"/g),
        ...code.matchAll(/className="(?:versus-label|eyebrow|notes-label|stat-label)"[^>]*>([^<{]*)</g),
      ];
      for (const match of plainLabels) {
        if (SYMBOL.test(match[1])) offenders.push(`${file}: ${match[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
