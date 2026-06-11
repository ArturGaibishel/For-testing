// Screenshot a URL with Puppeteer → ./temporary screenshots/screenshot-N[-label].png
// Usage: node screenshot.mjs http://localhost:3000 [label] [--mobile]
import puppeteer from 'puppeteer';
import { readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const url = process.argv[2] || 'http://localhost:3000';
const args = process.argv.slice(3);
const mobile = args.includes('--mobile');
const label = args.find((a) => !a.startsWith('--'));

const OUT_DIR = fileURLToPath(new URL('./temporary screenshots/', import.meta.url));
await mkdir(OUT_DIR, { recursive: true });

const existing = await readdir(OUT_DIR).catch(() => []);
const nums = existing
  .map((f) => f.match(/^screenshot-(\d+)/))
  .filter(Boolean)
  .map((m) => Number(m[1]));
const next = (nums.length ? Math.max(...nums) : 0) + 1;
const name = `screenshot-${next}${label ? `-${label}` : ''}.png`;
const outPath = join(OUT_DIR, name);

// The bundled Chrome-for-Testing build is unusable in this environment (SIGKILL),
// so prefer the system Google Chrome when present.
import { access } from 'node:fs/promises';
const SYSTEM_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = await access(SYSTEM_CHROME).then(() => SYSTEM_CHROME).catch(() => undefined);

const browser = await puppeteer.launch({
  headless: 'new',
  executablePath,
  // enable software WebGL (SwiftShader) so the Three.js hero renders in headless
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars',
         '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'],
});
const page = await browser.newPage();
await page.setViewport(
  mobile ? { width: 390, height: 844, deviceScaleFactor: 2 } : { width: 1440, height: 900, deviceScaleFactor: 1 }
);
await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

// Pin viewport-height units to a FIXED pixel value (the real viewport height)
// before measuring/capturing. `100svh` heroes otherwise grow to match the
// enlarged capture viewport, ballooning the hero and duplicating content.
const baseVh = await page.evaluate(() => window.innerHeight);
await page.addStyleTag({
  content: `[class*="100svh"],[class*="100vh"],[class*="100dvh"]{height:${baseVh}px !important;min-height:${baseVh}px !important;max-height:${baseVh}px !important}`,
});

// Scroll through the whole page so IntersectionObserver-driven reveals fire.
await page.evaluate(async () => {
  await new Promise((resolve) => {
    let y = 0;
    const step = window.innerHeight * 0.8;
    const timer = setInterval(() => {
      window.scrollTo(0, y);
      y += step;
      if (y >= document.body.scrollHeight) { clearInterval(timer); resolve(); }
    }, 120);
  });
});
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 400));

// NOTE: in this Chrome+SwiftShader build, full-page capture of very tall pages
// that use `100svh` + WebGL can visibly duplicate content (a capture artifact,
// not a real layout bug). For trustworthy verification of long mobile pages,
// capture at the natural viewport while scrolling, or inspect section offsets.
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
console.log(`Saved ${outPath}`);
