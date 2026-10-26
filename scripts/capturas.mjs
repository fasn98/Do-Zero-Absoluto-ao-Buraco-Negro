#!/usr/bin/env node
// capturas.mjs — capturas de tela do app em 360 px e desktop, página inteira.
//
// Usa o Chromium headless do Replit pelo protocolo DevTools (WebSocket nativo
// do Node 24), sem dependências. O servidor de desenvolvimento precisa estar
// rodando (pnpm --filter @workspace/zero-absoluto run dev, porta 19201).
//
// Uso:
//   node scripts/capturas.mjs                       conjunto padrão (Trilha 2, Fase 1)
//   node scripts/capturas.mjs /trilha-1 "/a-linha-do-tempo-cosmica?marco=hoje"
//   node scripts/capturas.mjs --tema=escuro /pior-previsao
//   node scripts/capturas.mjs --larguras=360 /trilha-2
//   node scripts/capturas.mjs --avaliar='document.title' /trilha-2   (só avalia JS, sem imagem)
//
// Parâmetros de URL do Módulo 2.1 e da régua da Trilha 2:
//   ?marco=<id>    planck, inflacao, nucleossintese, igualdade, recombinacao,
//                  primeiras-estrelas, reionizacao, sol, aceleracao,
//                  energia-escura, hoje, futuro
//   ?t=<segundos>  instante exato desde o Big Bang (tem prioridade sobre marco)
//   ?h0=shoes      atalho "Universo local, SH0ES" (só no Módulo 2.1)
//
// Variáveis: BASE_URL (padrão http://localhost:19201), CHROMIUM
// (padrão /repl/tools/bin/chromium), SAIDA (padrão capturas/, fora do Git).
// Para cada captura também grava <nome>.txt com o texto dos campos data-testid
// "text-*", para conferir os valores exibidos sem abrir a imagem.

import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:19201';
const CHROMIUM = process.env.CHROMIUM ?? '/repl/tools/bin/chromium';
const SAIDA = resolve(process.env.SAIDA ?? 'capturas');

const PADRAO = [
  '/',
  '/trilha-1',
  '/trilha-2',
  '/a-linha-do-tempo-cosmica?marco=recombinacao',
  '/a-linha-do-tempo-cosmica?marco=hoje',
  '/a-linha-do-tempo-cosmica?marco=futuro',
  '/a-linha-do-tempo-cosmica?marco=hoje&h0=planck',
  '/a-linha-do-tempo-cosmica?marco=hoje&h0=shoes',
];

const args = process.argv.slice(2);
const opt = (name, fallback) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const rotas = args.filter((a) => !a.startsWith('--'));
const tema = opt('tema', 'claro');
const avaliar = args.find((a) => a.startsWith('--avaliar='))?.slice('--avaliar='.length);
const LARGURAS = { 360: { width: 360, height: 780, mobile: true, scale: 2 }, 1440: { width: 1440, height: 900, mobile: false, scale: 1 } };
const larguras = opt('larguras', '360,1440').split(',').map((w) => LARGURAS[w] ?? { width: Number(w), height: 900, mobile: Number(w) < 768, scale: 1 });

const nomeDe = (rota, w) => `${(rota.replace(/^\//, '') || 'inicio').replace(/[?&=/]+/g, '_')}_${w}${tema === 'escuro' ? '_escuro' : ''}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function abrirChromium() {
  const perfil = mkdtempSync(join(tmpdir(), 'capturas-'));
  const proc = spawn(CHROMIUM, ['--headless=new', '--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${perfil}`, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((ok, falha) => {
    let buf = '';
    proc.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) ok(m[1]); });
    proc.on('exit', (code) => falha(new Error(`Chromium saiu (${code}): ${buf.slice(-500)}`)));
  });
  return { proc, perfil, wsUrl };
}

function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pendentes = new Map();
  const eventos = [];
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pendentes.has(data.id)) {
      const { ok, falha } = pendentes.get(data.id);
      pendentes.delete(data.id);
      data.error ? falha(new Error(data.error.message)) : ok(data.result);
    } else if (data.method) eventos.push(data);
  };
  const send = (method, params = {}, sessionId) => new Promise((ok, falha) => {
    id += 1;
    pendentes.set(id, { ok, falha });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });
  return new Promise((ok) => { ws.onopen = () => ok({ ws, send, eventos }); });
}

async function capturar({ send }, rota, viewport) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: viewport.height, deviceScaleFactor: viewport.scale, mobile: viewport.mobile });
  await s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: tema === 'escuro' ? 'dark' : 'light' }] });
  await s('Page.navigate', { url: BASE_URL + rota });
  // Espera a página assentar: carregamento, fontes e o primeiro cálculo do modelo.
  for (let i = 0; i < 50; i += 1) {
    const { result } = await s('Runtime.evaluate', { expression: 'document.readyState === "complete" && document.fonts.status === "loaded" && !!document.querySelector("main")', returnByValue: true });
    if (result.value) break;
    await sleep(200);
  }
  await sleep(800);
  if (avaliar) {
    const { result } = await s('Runtime.evaluate', { expression: avaliar, returnByValue: true });
    await send('Target.closeTarget', { targetId });
    return { avaliado: result.value };
  }
  const { result: info } = await s('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const textos = [...document.querySelectorAll('[data-testid^="text-"]')].map((el) => el.dataset.testid + ': ' + el.innerText.replace(/\\s+/g, ' ').trim());
      return { altura: Math.ceil(document.documentElement.scrollHeight), larguraDoc: document.documentElement.scrollWidth, textos };
    })()`,
  });
  // Janela com a altura da página inteira (captureBeyondViewport distorce os gráficos que medem a própria largura).
  await s('Emulation.setDeviceMetricsOverride', { width: viewport.width, height: info.value.altura, deviceScaleFactor: viewport.scale, mobile: viewport.mobile });
  await sleep(600);
  const { data } = await s('Page.captureScreenshot', { format: 'png' });
  await send('Target.closeTarget', { targetId });
  return { png: Buffer.from(data, 'base64'), ...info.value };
}

const { proc, perfil, wsUrl } = await abrirChromium();
try {
  const conexao = await cdp(wsUrl);
  mkdirSync(SAIDA, { recursive: true });
  for (const rota of rotas.length ? rotas : PADRAO) {
    for (const viewport of larguras) {
      const nome = nomeDe(rota, viewport.width);
      const r = await capturar(conexao, rota, viewport);
      if (avaliar) { console.log(`${nome}:`, JSON.stringify(r.avaliado)); continue; }
      writeFileSync(join(SAIDA, `${nome}.png`), r.png);
      writeFileSync(join(SAIDA, `${nome}.txt`), r.textos.join('\n') + '\n');
      const aviso = r.larguraDoc > viewport.width ? `  ROLAGEM HORIZONTAL: ${r.larguraDoc}px` : '';
      console.log(`${nome}.png  ${viewport.width}×${r.altura}${aviso}`);
    }
  }
  conexao.ws.close();
} finally {
  proc.kill();
  rmSync(perfil, { recursive: true, force: true });
}
