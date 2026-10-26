/** Álgebra linear mínima para as verossimilhanças (matrizes pequenas, até ~30 × 30). */

/** Inversa por Gauss-Jordan com pivotamento parcial. */
export function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const a = matrix.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    if (a[pivot][col] === 0) throw new RangeError("Matriz singular.");
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const p = a[col][col];
    for (let j = 0; j < 2 * n; j += 1) a[col][j] /= p;
    for (let r = 0; r < n; r += 1) {
      if (r === col) continue;
      const f = a[r][col];
      if (f !== 0) for (let j = 0; j < 2 * n; j += 1) a[r][j] -= f * a[col][j];
    }
  }
  return a.map((row) => row.slice(n));
}

/** Forma quadrática xᵀ M y. */
export function quadraticForm(x: number[], m: number[][], y: number[] = x): number {
  let sum = 0;
  for (let i = 0; i < x.length; i += 1) {
    let row = 0;
    for (let j = 0; j < y.length; j += 1) row += m[i][j] * y[j];
    sum += x[i] * row;
  }
  return sum;
}

/** Fator de Cholesky L (triangular inferior) de uma matriz simétrica positiva definida: M = L Lᵀ. */
export function cholesky(m: number[][]): number[][] {
  const n = m.length;
  const l = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j <= i; j += 1) {
      let sum = m[i][j];
      for (let k = 0; k < j; k += 1) sum -= l[i][k] * l[j][k];
      if (i === j) {
        if (sum <= 0) throw new RangeError("Matriz não é positiva definida.");
        l[i][i] = Math.sqrt(sum);
      } else l[i][j] = sum / l[j][j];
    }
  }
  return l;
}

/** Resolve A x = b (A pequena e bem condicionada), por eliminação de Gauss com pivotamento. */
export function solveLinear(a: number[][], b: number[]): number[] {
  const inv = invertMatrix(a);
  return inv.map((row) => row.reduce((s, v, j) => s + v * b[j], 0));
}
