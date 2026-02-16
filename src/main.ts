import './style.css'

const app = document.querySelector<HTMLDivElement>('#app')!

const DEFAULT_CODE = `// Vitrio playground (CDN build from GitHub)
// You can use Vitrio without TSX here by calling h().

import { render, h, v, get, set } from 'https://cdn.jsdelivr.net/gh/linkalls/Vitrio@main/dist/index.mjs'

const count = v(0)

function Counter() {
  return h('div', {},
    h('h1', {}, 'Vitrio Playground'),
    h('button', { onClick: () => set(count, (c: number) => c - 1) }, '-'),
    h('span', { style: 'padding:0 8px;' }, () => String(get(count))),
    h('button', { onClick: () => set(count, (c: number) => c + 1) }, '+'),
  )
}

render(Counter(), document.getElementById('preview')!)
`

app.innerHTML = `
  <div class="layout">
    <div class="pane">
      <div class="toolbar">
        <button id="run">Run</button>
        <a class="hint" href="https://github.com/linkalls/Vitrio" target="_blank" rel="noreferrer">Vitrio repo</a>
      </div>
      <textarea id="code" spellcheck="false"></textarea>
    </div>
    <div class="pane">
      <div class="toolbar">Preview</div>
      <iframe id="frame" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  </div>
`

const codeEl = document.querySelector<HTMLTextAreaElement>('#code')!
const runEl = document.querySelector<HTMLButtonElement>('#run')!
const frame = document.querySelector<HTMLIFrameElement>('#frame')!

codeEl.value = DEFAULT_CODE

function run() {
  const userCode = codeEl.value

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Preview</title>
  <style>body{font-family:system-ui, sans-serif; padding:12px;}</style>
</head>
<body>
  <div id="preview"></div>
  <script type="module">
    try {
      const blob = new Blob([${JSON.stringify(userCode)}], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      await import(url);
      URL.revokeObjectURL(url);
    } catch (e) {
      const pre = document.createElement('pre');
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.color = '#b00020';
      pre.textContent = String(e?.stack || e);
      document.body.appendChild(pre);
    }
  </script>
</body>
</html>`

  frame.srcdoc = html
}

runEl.addEventListener('click', run)
run()
