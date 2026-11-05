const storageKey = 'pattern-lab-notebook-v1';
const starters = {
  experiment: 'items = [12, 7, 8, 3, 10]\ncount = 0\n\nfor item in items:\n    if item % 2 == 0:\n        count += 1\n\nprint(count)\n',
  transfer: 'marks = [45, 72, 50, 39, 81]\ncount = 0\n\nfor mark in marks:\n    if mark > 50:  # Include a mark of 50 too.\n        count += 1\n\nprint(count)\n'
};
const examples = {
  vowels: { items: [...'education'], rule: 'item.lower() in "aeiou"', matches: value => 'aeiou'.includes(value.toLowerCase()), question: value => `Is “${value}” a vowel?`, reason: (value, match) => `“${value}” ${match ? 'is' : 'is not'} a vowel` },
  even: { items: [12, 7, 8, 3, 10], rule: 'item % 2 == 0', matches: value => value % 2 === 0, question: value => `Is ${value} even?`, reason: (value, match) => `${value} is ${match ? 'even' : 'odd'}` },
  passes: { items: [45, 72, 50, 39, 81], rule: 'item >= 50', matches: value => value >= 50, question: value => `Is ${value} at least 50?`, reason: (value, match) => `${value} is ${match ? 'at least' : 'below'} 50` }
};
const $ = id => document.getElementById(id);
const all = selector => [...document.querySelectorAll(selector)];
let storageAvailable = true;
let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}') || {}; } catch (_) { storageAvailable = false; }
const text = value => typeof value === 'string' ? value.slice(0, 20000) : '';
const state = {
  fields: saved.fields && typeof saved.fields === 'object' ? saved.fields : {},
  choices: saved.choices && typeof saved.choices === 'object' ? saved.choices : {},
  checks: { pattern: !!saved.checks?.pattern, condition: !!saved.checks?.condition, reflection: !!saved.checks?.reflection },
  milestones: { experiment: !!saved.milestones?.experiment, transfer: !!saved.milestones?.transfer },
  completedExamples: Array.isArray(saved.completedExamples) ? [...new Set(saved.completedExamples.filter(value => examples[value]))] : [],
  trace: { example: 'vowels', index: 0, predictions: [] },
  runs: Array.isArray(saved.runs) ? saved.runs.filter(run => ['experiment', 'transfer'].includes(run.cell) && typeof run.code === 'string' && typeof run.output === 'string').slice(-12).map(run => ({ cell: run.cell, code: text(run.code), output: text(run.output), success: !!run.success, time: text(run.time) })) : []
};
if (examples[saved.trace?.example]) {
  const example = saved.trace.example;
  const predictions = Array.isArray(saved.trace.predictions) ? saved.trace.predictions.filter(value => typeof value === 'boolean').slice(0, examples[example].items.length) : [];
  const index = Number.isInteger(saved.trace.index) ? Math.max(0, Math.min(saved.trace.index, predictions.length, examples[example].items.length - 1)) : 0;
  state.trace = { example, index, predictions: predictions.slice(0, index + 1) };
}
let saveTimer;
function save(immediate = false) {
  clearTimeout(saveTimer);
  const write = () => {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; } catch (_) { storageAvailable = false; }
    $('save-note').textContent = storageAvailable ? 'Saved on this browser.' : 'Browser saving is unavailable. Download your work to keep it.';
    if (!storageAvailable) $('privacy-note').textContent = 'Browser saving is unavailable. Download a copy to keep your work. Nothing is submitted to your teacher automatically.';
  };
  if (immediate) write(); else saveTimer = setTimeout(write, 250);
}
function feedback(id, message, success = null) {
  const element = $(id);
  element.textContent = message;
  element.classList.toggle('success', success === true);
  element.classList.toggle('needs-work', success === false);
}
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; setTimeout(() => { $('toast').hidden = true; }, 4500); }
function checked(name) { return all(`input[name="${name}"]:checked`).map(input => input.value); }
function meaningfulDetail() {
  const detail = $('reflection-detail').value.trim();
  const empty = /^(none|no|idk|i\s+do\s*n[o’']?t\s+know|n\/?a|nothing)[.!\s]*$/i.test(detail);
  return detail.split(/\s+/).length >= 5 && !empty;
}
function completed() {
  const experiments = state.runs.filter(run => run.cell === 'experiment' && run.success);
  const changed = experiments.some((run, index) => experiments.some((other, otherIndex) => index !== otherIndex && run.code !== other.code && run.output.trim() !== other.output.trim()));
  return { spot: state.checks.pattern, trace: state.completedExamples.length >= 2, experiment: state.milestones.experiment || changed, transfer: state.checks.condition && (state.milestones.transfer || state.runs.some(run => run.cell === 'transfer' && run.success && run.output.trim() === '3')), reflect: state.checks.reflection && checked('reused').length > 0 && !!$('reflection-change').value && meaningfulDetail() };
}
function updateProgress() {
  const sections = completed();
  const count = Object.values(sections).filter(Boolean).length;
  $('progress').value = count;
  $('progress-label').textContent = `${count} of 5 sections completed`;
  $('mobile-progress').textContent = `${count} of 5 sections completed`;
  for (const link of all('[data-nav]')) link.classList.toggle('completed', sections[link.dataset.nav]);
}
for (const element of all('[data-save]')) {
  const value = state.fields[element.id];
  element.value = typeof value === 'string' ? text(value) : starters[element.id.replace('-code', '')] || '';
  element.addEventListener('input', () => {
    state.fields[element.id] = element.value;
    if (element.id.startsWith('reflection-')) state.checks.reflection = false;
    if (element.classList.contains('code-input')) $(element.id.replace('-code', '-status')).textContent = 'Code changed · run again to see the new output';
    updateProgress(); save();
  });
}
for (const input of all('input[type="radio"], input[type="checkbox"]')) {
  const chosen = state.choices[input.name];
  input.checked = Array.isArray(chosen) && chosen.includes(input.value);
  input.addEventListener('change', () => {
    state.choices[input.name] = checked(input.name);
    if (input.name === 'pattern') { state.checks.pattern = false; feedback('pattern-feedback', 'Check this choice to see feedback.'); }
    if (input.name === 'condition') { state.checks.condition = false; feedback('condition-feedback', 'Check this choice to see feedback.'); }
    if (input.name === 'reused') state.checks.reflection = false;
    updateProgress(); save();
  });
}
for (const cell of ['experiment', 'transfer']) {
  const last = state.runs.findLast(run => run.cell === cell);
  if (last) {
    $(`${cell}-output`).textContent = last.output;
    $(`${cell}-status`).textContent = $(`${cell}-code`).value === last.code ? (last.success ? 'Previous run restored' : 'Previous error restored') : 'Saved output from an earlier version · run your current code';
  }
}
$('check-pattern').addEventListener('click', () => {
  const choice = checked('pattern')[0];
  state.checks.pattern = choice === 'same-plan';
  feedback('pattern-feedback', !choice ? 'Choose one answer first.' : choice === 'same-plan' ? 'Yes. Both use a loop, a condition, and a counter. The data and rule can change.' : choice === 'same-data' ? 'The letters and numbers are different. Look for steps that both plans use.' : 'Neither plan needs to sort. Look for the repeated loop and counting steps.', choice ? state.checks.pattern : null);
  updateProgress(); save();
});
$('check-condition').addEventListener('click', () => {
  const choice = checked('condition')[0];
  state.checks.condition = choice === 'gte';
  feedback('condition-feedback', !choice ? 'Choose a condition first.' : choice === 'gte' ? 'Yes. >= includes 50 and every higher mark. Now make that change in your code.' : choice === 'gt' ? '> excludes 50. Which comparison includes the boundary too?' : '== counts only marks of exactly 50. Passing marks above 50 must count too.', choice ? state.checks.condition : null);
  updateProgress(); save();
});
$('check-reflection').addEventListener('click', () => {
  state.checks.reflection = checked('reused').length > 0 && !!$('reflection-change').value && meaningfulDetail();
  feedback('reflection-feedback', state.checks.reflection ? 'Your reflection has a reused step, a change or support need, and a written detail. Check that your detail matches what you actually did.' : !checked('reused').length ? 'Choose at least one part you reused.' : !$('reflection-change').value ? 'Choose what you changed, or choose the support you still need.' : 'Add a short detail: name a line, value, or rule you changed or need help with. Use the sentence frame above.', state.checks.reflection);
  updateProgress(); save();
});
function traceView() {
  const { example, index, predictions } = state.trace;
  const ex = examples[example];
  const answered = predictions.length > index;
  const before = ex.items.slice(0, index).filter(ex.matches).length;
  const match = ex.matches(ex.items[index]);
  return { ex, index, answered, before, match, count: before + (answered && match ? 1 : 0), done: answered && index === ex.items.length - 1 };
}
function renderTrace() {
  const { ex, index, answered, before, match, count, done } = traceView();
  $('trace-example').value = state.trace.example;
  $('trace-source').replaceChildren(...ex.items.map((value, i) => {
    const processed = i < index || (i === index && answered);
    const tile = document.createElement('div');
    tile.className = `item-tile${i === index ? ' current' : ''}${processed && ex.matches(value) ? ' match' : ''}`;
    tile.setAttribute('role', 'listitem');
    if (i === index) tile.setAttribute('aria-current', 'step');
    const number = document.createElement('span'); number.textContent = String(value);
    const status = document.createElement('span'); status.className = 'item-status';
    status.textContent = processed ? (ex.matches(value) ? '+1' : '+0') : i === index ? 'current' : 'next';
    tile.append(number, status); return tile;
  }));
  $('trace-position').textContent = `ITEM ${index + 1} OF ${ex.items.length}`;
  $('trace-count').textContent = String(count);
  $('trace-question').textContent = done ? `Finished: ${count} matching items.` : ex.question(ex.items[index]);
  $('trace-rule').textContent = ex.rule;
  $('trace-add').disabled = answered; $('trace-keep').disabled = answered;
  $('trace-next').disabled = !answered || done;
  $('trace-add').setAttribute('aria-pressed', String(answered && state.trace.predictions[index]));
  $('trace-keep').setAttribute('aria-pressed', String(answered && !state.trace.predictions[index]));
  const correct = answered && state.trace.predictions[index] === match;
  feedback('trace-feedback', answered ? `${correct ? 'Yes.' : 'Check the rule:'} ${ex.reason(ex.items[index], match)}. Count: ${before} → ${count}.${done ? ' Try another example to compare the rules.' : ''}` : 'Choose your prediction, then check the result.', answered ? correct : null);
  $('trace-completed').textContent = `${state.completedExamples.length} of 3 examples traced`;
}
function predict(answer) {
  if (traceView().answered) return;
  state.trace.predictions.push(answer);
  if (traceView().done && !state.completedExamples.includes(state.trace.example)) state.completedExamples.push(state.trace.example);
  renderTrace(); updateProgress(); save();
}
$('trace-add').addEventListener('click', () => predict(true));
$('trace-keep').addEventListener('click', () => predict(false));
$('trace-next').addEventListener('click', () => { const view = traceView(); if (!view.answered || view.done) return; state.trace.index++; renderTrace(); save(); });
$('trace-example').addEventListener('change', event => { state.trace = { example: event.target.value, index: 0, predictions: [] }; renderTrace(); save(); });
$('trace-replay').addEventListener('click', () => { state.trace = { example: state.trace.example, index: 0, predictions: [] }; renderTrace(); save(); });
renderTrace();
let worker = null;
let pending = null;
let runId = 0;
let timeout;
function setRunning(cell, running) {
  for (const button of all('[data-run]')) button.disabled = running;
  for (const button of all('[data-stop]')) button.hidden = !running || button.dataset.stop !== cell;
}
function finishRun(output, success) {
  if (!pending) return;
  clearTimeout(timeout);
  const { cell, code, prediction } = pending;
  $(`${cell}-output`).textContent = output;
  $(`${cell}-status`).textContent = success ? 'Run complete' : 'Try a repair, then run again';
  state.runs.push({ cell, code, output: output.slice(0, 20000), success, time: new Date().toISOString() });
  if (cell === 'experiment' && success && completed().experiment) state.milestones.experiment = true;
  if (cell === 'transfer' && success && output.trim() === '3') state.milestones.transfer = true;
  state.runs = state.runs.slice(-12);
  if (cell === 'experiment' && success) {
    const hasPrevious = state.runs.some(run => run !== state.runs[state.runs.length - 1] && run.cell === cell && run.success);
    const message = completed().experiment ? 'You ran different versions and saw the count change. The loop and counter can stay while the condition changes.' : hasPrevious ? 'Compare your runs. Did changing the rule change which items were counted?' : prediction && /^\d+$/.test(output.trim()) ? `You predicted ${prediction}; this version printed ${output.trim()}. Now change == 0 to != 0 and run again.` : 'Now change == 0 to != 0 to count odd numbers, then run again.';
    feedback('experiment-check', message, completed().experiment ? true : null);
  }
  if (cell === 'transfer' && success) {
    const firstRun = state.runs.filter(run => run.cell === cell).length === 1;
    const comparison = firstRun && prediction && /^\d+$/.test(output.trim()) ? `You predicted ${prediction}; the starter printed ${output.trim()}. ` : '';
    feedback('transfer-check', comparison + (output.trim() === '3' ? 'The count is 3. Check that 50, 72, and 81 are the marks being counted.' : 'Now check the condition: does it include 50 and higher marks? After your fix, the count should be 3.'), output.trim() === '3' ? true : null);
  }
  pending = null; setRunning(cell, false); updateProgress(); save();
}
function abortRun(message) {
  if (!pending) return;
  worker?.terminate(); worker = null;
  finishRun(message, false);
}
function getWorker() {
  if (worker) return worker;
  worker = new Worker('python-worker.js', { type: 'module' });
  worker.onmessage = event => {
    if (!pending || event.data.id !== pending.id) return;
    const { type, output, error } = event.data;
    if (type === 'running') {
      clearTimeout(timeout);
      $(`${pending.cell}-status`).textContent = 'Running Python…';
      timeout = setTimeout(() => abortRun('Stopped after 8 seconds. Check that your loop can finish, then run again.'), 8000);
    } else if (type === 'result') finishRun(output, true);
    else if (type === 'error') finishRun(error, false);
  };
  worker.onerror = event => { event.preventDefault(); abortRun('Python could not start. Check your internet connection, then select Run code again. The tracing activity still works without Python.'); };
  return worker;
}
for (const button of all('[data-run]')) button.addEventListener('click', () => {
  if (pending) return;
  const cell = button.dataset.run;
  const code = $(`${cell}-code`).value;
  if (!code.trim()) { $(`${cell}-output`).textContent = 'Write some Python code first, or restore the starter.'; return; }
  const predictionInput = $(`${cell}-prediction`);
  if (!state.runs.some(run => run.cell === cell) && (!predictionInput.value.trim() || !predictionInput.checkValidity())) { feedback(`${cell}-check`, 'Enter a predicted count from 0 to 5 above before the first run. A guess is okay.'); predictionInput.focus(); return; }
  pending = { cell, code, prediction: predictionInput.value, id: ++runId };
  setRunning(cell, true);
  $(`${cell}-output`).textContent = 'Preparing Python…';
  $(`${cell}-status`).textContent = 'First load may take a moment. You can stop at any time.';
  timeout = setTimeout(() => abortRun('Python took too long to load. Check your connection and try again.'), 60000);
  try { getWorker().postMessage({ id: pending.id, code }); } catch (_) { abortRun('This browser could not start Python. Try a current Chrome, Edge, Firefox, or Safari browser.'); }
});
for (const button of all('[data-stop]')) button.addEventListener('click', () => abortRun('Stopped. Check or change your code, then run again.'));
for (const button of all('[data-restore]')) button.addEventListener('click', () => {
  const cell = button.dataset.restore;
  if ($(`${cell}-code`).value !== starters[cell] && !confirm('Replace this cell with the starter code? Your previous runs remain in your downloaded notebook.')) return;
  $(`${cell}-code`).value = starters[cell]; state.fields[`${cell}-code`] = starters[cell];
  $(`${cell}-status`).textContent = 'Starter restored · run again'; save();
});
for (const editor of all('.code-input')) {
  let leaveOnTab = false;
  editor.addEventListener('keydown', event => {
    if (event.key === 'Escape') { leaveOnTab = true; return; }
    if (event.key === 'Tab' && !event.shiftKey && !leaveOnTab) {
      event.preventDefault(); editor.setRangeText('    ', editor.selectionStart, editor.selectionEnd, 'end'); editor.dispatchEvent(new Event('input', { bubbles: true }));
    }
    leaveOnTab = false;
  });
}
function chosenLabels(name) { return all(`input[name="${name}"]:checked`).map(input => input.parentElement.textContent.trim()).join('; ') || '(not answered)'; }
function download() {
  save(true);
  const name = $('student-name').value.trim();
  const lines = ['PATTERN LAB — MY LEARNING NOTEBOOK', `Name / initials: ${name || '(not supplied)'}`, `Downloaded: ${new Date().toLocaleString()}`, '', '01 · SPOT THE PATTERN', chosenLabels('pattern'), `Checked understanding: ${state.checks.pattern ? 'correct response checked' : 'not completed'}`, '', '02 · TRACE IT', `Completed examples: ${state.completedExamples.map(value => $('trace-example').querySelector(`option[value="${value}"]`).textContent).join(', ') || '(none yet)'}`, '', '03 · RUN & CHANGE', `First predicted count: ${$('experiment-prediction').value || '(not answered)'}`, 'Current code:', $('experiment-code').value, '', '04 · TRY A NEW PROBLEM', `First predicted count: ${$('transfer-prediction').value || '(not answered)'}`, `Condition choice: ${chosenLabels('condition')}`, 'Current code:', $('transfer-code').value, '', 'MY RUN HISTORY (last 12 runs)'];
  state.runs.forEach((run, index) => lines.push('', `Run ${index + 1} · ${run.cell} · ${run.success ? 'completed' : 'stopped or error'}`, `Time: ${run.time}`, run.code, 'Output:', run.output));
  lines.push('', '05 · MY REFLECTION', `I reused: ${chosenLabels('reused')}`, `I changed / need help with: ${$('reflection-change').selectedOptions[0].textContent}`, `My detail: ${$('reflection-detail').value || '(not answered)'}`, '', `${Object.values(completed()).filter(Boolean).length} of 5 notebook sections completed.`, 'This file records my work and choices. Completion is not an achievement grade.');
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `pattern-lab${name ? '-' + name.replace(/[^a-z0-9_-]+/gi, '-').slice(0, 50) : ''}.txt`; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000); toast('Downloaded. Hand in the text file using your usual class method.');
}
for (const button of all('[data-download]')) button.addEventListener('click', download);
$('clear-work').addEventListener('click', () => {
  if (!confirm('Clear this notebook from this browser? Download your work first if you want to keep it.')) return;
  clearTimeout(saveTimer); worker?.terminate();
  try { localStorage.removeItem(storageKey); } catch (_) {}
  location.reload();
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    if (visible) for (const link of all('[data-nav]')) link.classList.toggle('active', link.dataset.nav === visible.target.id);
  }, { rootMargin: '-5% 0px -65% 0px', threshold: 0 });
  for (const section of all('.notebook-section')) observer.observe(section);
}
if (state.checks.pattern) feedback('pattern-feedback', 'Your checked response is saved: the loop, condition, and counter can be reused.', true);
if (state.checks.condition) feedback('condition-feedback', 'Your checked response is saved: >= includes the boundary value of 50.', true);
updateProgress();
if (!storageAvailable) $('save-note').textContent = 'Browser saving is unavailable. Download your work to keep it.';
