import './style.css'

import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'

const app = document.querySelector<HTMLDivElement>('#app')!

const EXAMPLES: Record<string, string> = {
  "Counter (TSX)": `// Counter (TSX)
import { render, v, get, set } from '@potetotown/vitrio'

const count = v(0)

function Counter() {
  return (
    <div>
      <h1>Vitrio Playground</h1>
      <button onClick={() => set(count, (c) => c - 1)}>-</button>
      <span style="padding:0 8px;">{() => String(get(count))}</span>
      <button onClick={() => set(count, (c) => c + 1)}>+</button>
    </div>
  )
}

render(<Counter />, document.getElementById('preview'))
`,

  "Router (TSX)": `// Router (TSX)
import { render, Router, Routes, Route, A, Suspense } from '@potetotown/vitrio'

function App() {
  return (
    <Router>
      <Suspense fallback={<div>loading...</div>}>
        <Routes>
          <Route path="/">{() => <div>Home <A href="/user/42">go</A></div>}</Route>
          <Route path="/user/:id">{(_, ctx) => <div>User {ctx.params.id} <A href="/">back</A></div>}</Route>
          <Route path="*">{() => <div>404</div>}</Route>
        </Routes>
      </Suspense>
    </Router>
  )
}

render(<App />, document.getElementById('preview'))
`,

  "Form (TSX)": `// Form (TSX)
import { render, Form, v, get, set } from '@potetotown/vitrio'

const state = v({ name: '', agree: false })

function App() {
  return (
    <div>
      <Form
        action={{
          run: async (input) => { set(state, { name: input.name ?? '', agree: !!input.agree }); },
          pending: () => false,
          error: () => undefined,
          data: () => undefined,
        }}
      >
        <input name="name" placeholder="name" />
        <label><input type="checkbox" name="agree" value="true" /> agree</label>
        <button type="submit">save</button>
      </Form>
      <pre>{() => JSON.stringify(get(state))}</pre>
    </div>
  )
}

render(<App />, document.getElementById('preview'))
`,
}

const DEFAULT_CODE = EXAMPLES["Counter (TSX)"]

app.innerHTML = `
  <div class="layout">
    <div class="pane">
      <div class="toolbar">
        <button id="run">Run</button>
        <select id="example"></select>
        <a class="hint" href="https://github.com/linkalls/Vitrio" target="_blank" rel="noreferrer">Vitrio repo</a>
      </div>
      <div id="editor"></div>
    </div>
    <div class="pane">
      <div class="toolbar">Preview</div>
      <iframe id="frame" sandbox="allow-scripts allow-same-origin"></iframe>
    </div>
  </div>
`

const runEl = document.querySelector<HTMLButtonElement>('#run')!
const exEl = document.querySelector<HTMLSelectElement>('#example')!
const editorHost = document.querySelector<HTMLDivElement>('#editor')!
const frame = document.querySelector<HTMLIFrameElement>('#frame')!

for (const key of Object.keys(EXAMPLES)) {
  const opt = document.createElement('option')
  opt.value = key
  opt.textContent = key
  exEl.appendChild(opt)
}
exEl.value = 'Counter (TSX)'

let view: EditorView;

function setEditorText(text: string) {
  view.dispatch({
    changes: { from: 0, to: view.state.doc.length, insert: text },
  })
}

function getEditorText() {
  return view.state.doc.toString()
}

view = new EditorView({
  parent: editorHost,
  state: EditorState.create({
    doc: DEFAULT_CODE,
    extensions: [
      oneDark,
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      javascript({ typescript: true, jsx: true }),
      EditorView.lineWrapping,
    ],
  }),
})

exEl.addEventListener('change', () => {
  setEditorText(EXAMPLES[exEl.value] ?? DEFAULT_CODE)
})

function run() {
  const userCode = getEditorText()

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

  <script async src="https://unpkg.com/es-module-shims@1.10.0/dist/es-module-shims.js"></script>
  <script src="https://unpkg.com/@babel/standalone@7.26.0/babel.min.js"></script>

  <script type="importmap-shim">
    {
      "imports": {
        "@potetotown/vitrio": "https://cdn.jsdelivr.net/gh/linkalls/Vitrio@main/dist/index.mjs",
        "@potetotown/vitrio/jsx-runtime": "https://cdn.jsdelivr.net/gh/linkalls/Vitrio@main/dist/jsx-runtime.mjs",
        "@potetotown/vitrio/jsx-dev-runtime": "https://cdn.jsdelivr.net/gh/linkalls/Vitrio@main/dist/jsx-dev-runtime.mjs"
      }
    }
  </script>

  <script type="module-shim">
    try {
      const Babel = globalThis.Babel;
      if (!Babel) throw new Error('Babel not loaded');

      const out = Babel.transform(${JSON.stringify(userCode)}, {
        filename: 'playground.tsx',
        presets: [
          ['react', { runtime: 'automatic', importSource: '@potetotown/vitrio' }],
          ['typescript', { isTSX: true, allExtensions: true }],
        ],
      }).code;

      const blob = new Blob([out], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);

      // Use module-shim dynamic import when available
      const mod = (globalThis).importShim;
      if (typeof mod === 'function') {
        await mod(url);
      } else {
        await import(url);
      }

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
