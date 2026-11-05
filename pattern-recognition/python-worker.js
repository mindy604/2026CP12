import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs';
const ready = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/' });
let active = false;
self.onmessage = async event => {
  const { id, code } = event.data;
  if (active) return;
  active = true;
  let globals;
  try {
    const python = await ready;
    self.postMessage({ id, type: 'running' });
    let output = '';
    const append = text => {
      if (output.length + text.length > 16000) throw new Error('Too much output. Check your loop, then try again.');
      output += text + '\n';
    };
    python.setStdout({ batched: append });
    python.setStderr({ batched: append });
    python.setStdin({ error: true });
    globals = python.runPython('dict()');
    await python.runPythonAsync(code, { globals });
    self.postMessage({ id, type: 'result', output: output || '(No output. Add print(...) to display a result.)' });
  } catch (error) {
    self.postMessage({ id, type: 'error', error: String(error.message || error).slice(-8000) });
  } finally {
    globals?.destroy();
    active = false;
  }
};
