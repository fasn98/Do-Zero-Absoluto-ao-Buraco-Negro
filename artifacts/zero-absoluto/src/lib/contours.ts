/** Utilidades de contorno para grades regulares (Módulo 2.3). */

/** Interpolação bilinear de uma grade z[j][i] para uma grade `factor` vezes mais fina; NaN se algum canto for NaN. */
export function upsample(z: number[][], factor: number): number[][] {
  const ny = z.length;
  const nx = z[0].length;
  const my = (ny - 1) * factor + 1;
  const mx = (nx - 1) * factor + 1;
  return Array.from({ length: my }, (_, J) => {
    const fy = J / factor;
    const j = Math.min(ny - 2, Math.floor(fy));
    const ty = fy - j;
    return Array.from({ length: mx }, (__, I) => {
      const fx = I / factor;
      const i = Math.min(nx - 2, Math.floor(fx));
      const tx = fx - i;
      const a = z[j][i];
      const b = z[j][i + 1];
      const c = z[j + 1][i];
      const d = z[j + 1][i + 1];
      // Nos pontos exatos da grade, vale o valor do nó mesmo com vizinhos NaN.
      if (tx === 0 && ty === 0) return a;
      return (1 - ty) * ((1 - tx) * a + tx * b) + ty * ((1 - tx) * c + tx * d);
    });
  });
}

export type Segment = [number, number, number, number];

/**
 * Isolinha z = level por "marching squares". Devolve segmentos em coordenadas de índice
 * (x = i, y = j, fracionários); células com NaN são ignoradas.
 */
export function isoline(z: number[][], level: number): Segment[] {
  const out: Segment[] = [];
  for (let j = 0; j < z.length - 1; j += 1) {
    for (let i = 0; i < z[0].length - 1; i += 1) {
      const v = [z[j][i], z[j][i + 1], z[j + 1][i + 1], z[j + 1][i]];
      if (v.some((x) => !Number.isFinite(x))) continue;
      const corners: [number, number][] = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]];
      const points: [number, number][] = [];
      for (let k = 0; k < 4; k += 1) {
        const a = v[k];
        const b = v[(k + 1) % 4];
        if ((a < level) !== (b < level)) {
          const t = (level - a) / (b - a);
          const [x0, y0] = corners[k];
          const [x1, y1] = corners[(k + 1) % 4];
          points.push([x0 + t * (x1 - x0), y0 + t * (y1 - y0)]);
        }
      }
      if (points.length === 2) out.push([points[0][0], points[0][1], points[1][0], points[1][1]]);
      if (points.length === 4) {
        out.push([points[0][0], points[0][1], points[1][0], points[1][1]]);
        out.push([points[2][0], points[2][1], points[3][0], points[3][1]]);
      }
    }
  }
  return out;
}
