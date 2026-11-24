'use strict';

// Example programs are deliberately short. The editor executes real Python
// in the course site's existing worker; the fixed trace is a separate model.
const examples = [
  {
    id: 'number', title: '1 · A different number inside the function',
    intro: 'The function returns a number. Does this call store it in score?',
    code: 'def change_number(number, new_value):\n    number = new_value\n    print("Inside:", number)\n    return number\n\nscore = 3\nchange_number(score, 2)\nprint("Outside:", score)\n',
    change: 'Store the returned answer in score at the call. Predict the outside value, then run again.',
    why: 'In the starter, number is assigned to 2 locally. score still refers to 3. The returned 2 is not stored. An integer cannot be edited in place; assigning the local name does not assign the caller’s name.'
  },
  {
    id: 'edit', title: '2 · Change an item in a shared list',
    intro: 'Watch the list inside and outside the call. Also check the returned answer.',
    code: 'def replace_result(items, position, new_value):\n    items[position] = new_value\n    print("Inside:", items)\n\nresults = [4, 2, 5]\nanswer = replace_result(results, 1, 7)\nprint("Outside:", results)\nprint("Returned:", answer)\n',
    change: 'Change a different valid position and value. Explain why the list can change even though answer is None.',
    why: 'In the starter, items and results refer to one list. Indexed assignment changes that list’s contents. There is no explicit return, so the returned answer is None. Changing contents and returning an answer are separate actions.'
  },
  {
    id: 'replace', title: '3 · Assign another list to a local name',
    intro: 'Will items = [9, 9] inside the function replace the list outside? Predict both printed lists.',
    code: 'def replace_locally(items):\n    items = [9, 9]\n    print("Inside:", items)\n\nresults = [4, 2, 5]\nreplace_locally(results)\nprint("Outside:", results)\n',
    change: 'Replace items = [9, 9] with an indexed edit, such as items[0] = 9. Predict the difference before running.',
    why: 'The starter creates another list and assigns the local name items to it. results still refers to the original list. A list argument does not make assignment to the parameter reassign the caller’s variable.'
  },
  {
    id: 'return', title: '4 · Return a new list, then store it',
    intro: 'Two caller names start with the same list. Which one is reassigned?',
    code: 'def make_new_results(items):\n    return [9, 9]\n\nresults = [4, 2, 5]\nother = results\nresults = make_new_results(results)\nprint("Results:", results)\nprint("Other:", other)\n',
    change: 'Call make_new_results(results) without storing its answer. Predict what both caller names show afterward.',
    why: 'The starter’s caller stores a new list in results. other still refers to the original list. Returning an object gives the caller an answer; the caller decides whether to assign it.'
  },
  {
    id: 'copy', title: '5 · Make a preview that protects a flat list',
    intro: 'The function edits a copy. Check the original before deciding whether to accept the preview.',
    code: 'def preview_first(items, new_value):\n    preview = items.copy()\n    preview[0] = new_value\n    return preview\n\nresults = [4, 2, 5]\npreview = preview_first(results, 8)\nprint("Original:", results)\nprint("Preview:", preview)\n',
    change: 'Try preview = items instead of items.copy(). Predict the original list, then explain why that change breaks a protected preview.',
    why: 'copy() makes a new outer list. With this flat list of numbers, assigning a copied position leaves the original alone. Direct assignment would give the same list another name.'
  },
  {
    id: 'text', title: '6 · A new string inside a function',
    intro: 'A string cannot be edited in place. Follow the returned string and the caller’s name.',
    code: 'def add_mark(text):\n    text = text + "!"\n    print("Inside:", text)\n    return text\n\nmessage = "Hello"\nadd_mark(message)\nprint("Outside:", message)\n',
    change: 'Store the returned string in message, then try another starting message. Explain which assignment changes the caller’s name.',
    why: 'In the starter, text is assigned a new string locally. message still refers to "Hello". The same passing-by-assignment model explains the string, integer and list examples.'
  },
  {
    id: 'grid', title: '7 · Going further: a shallow grid copy',
    intro: 'For CS12 or after the grid work: a new outer list can still share its row lists.',
    code: 'def change_seat(plan):\n    plan[0][1] = "Mei"\n\nseats = [["Ava", ""], ["", "Ben"]]\npreview = seats.copy()\nchange_seat(preview)\nprint("Original:", seats)\nprint("Preview:", preview)\n',
    change: 'Create a new outer list and copy each row before editing. Write the loop yourself, then check that the original stays unchanged.',
    why: 'A shallow outer copy still refers to the original rows. The starter edits a shared row. For this grid of strings, copying each row creates separate row lists.'
  },
  {
    id: 'practice', title: '8 · Your turn: write and call two functions',
    intro: 'Use your own small list. Plan each function’s inputs, returned answer and effect on the original.',
    code: '# 1. Write a function that changes one item in the supplied list.\n# 2. Write a function that returns an edited copy and protects the original.\n# Write a call for each and print the original list afterward.\n# Try a different list/value and explain the two effects.\n\n',
    change: 'Test a second list and a different value. Point to the line that edits an object and the line that assigns a name.',
    why: 'Use the output of your own calls as evidence. Ask: did the function edit the supplied list, reassign only a local name, or return a new list for the caller to store?'
  }
];

const traceCases = {
  edit: {
    caller: 'results', parameter: 'items', kind: 'list', initial: '[4, 2, 5]', updated: '[4, 7, 5]',
    code: 'def edit(items):\n    items[1] = 7\n\nresults = [4, 2, 5]\nedit(results)\nprint(results)',
    captions: ['Before the call: results refers to list A. The local parameter does not exist yet.', 'The call starts: items is another local name for the same list A.', 'items[1] = 7 edits list A. Both names still refer to that one changed list.', 'The call finishes. The local parameter is gone; results still refers to the changed list.']
  },
  replace: {
    caller: 'results', parameter: 'items', kind: 'list', initial: '[4, 2, 5]', updated: '[9, 9]',
    code: 'def replace(items):\n    items = [9, 9]\n\nresults = [4, 2, 5]\nreplace(results)\nprint(results)',
    captions: ['Before the call: results refers to list A.', 'The call starts: items and results refer to the same list A.', 'items = [9, 9] assigns the local name to a different list B. It does not edit list A.', 'The call finishes. results still refers to the unchanged list A; the local name did not replace it.']
  },
  number: {
    caller: 'score', parameter: 'number', kind: 'number', initial: '3', updated: '2',
    code: 'def change(number):\n    number = 2\n\nscore = 3\nchange(score)\nprint(score)',
    captions: ['Before the call: score refers to the number 3, shown as object A.', 'The call starts: number also refers to object A, the number 3.', 'number = 2 assigns only the local name to object B. It does not change the number 3 or the caller’s name.', 'The call finishes. score still refers to 3. The local assignment did not reassign score.']
  }
};

function traceSnapshot(mode, requestedStep) {
  mode = Object.hasOwn(traceCases, mode) ? mode : 'edit';
  const entry = traceCases[mode];
  const step = Math.max(0, Math.min(3, Math.trunc(Number(requestedStep) || 0)));
  const changedShared = mode === 'edit' && step >= 2;
  const split = mode !== 'edit' && step === 2;
  const objects = [{ id: 'A', kind: entry.kind, value: changedShared ? entry.updated : entry.initial, changed: changedShared }];
  if (split) objects.push({ id: 'B', kind: entry.kind, value: entry.updated, changed: true });
  return {
    step, code: entry.code, caption: entry.captions[step], objects,
    names: [
      { scope: 'Outside the function', label: entry.caller, target: 'A', active: true },
      { scope: 'Inside the function', label: entry.parameter, target: split ? 'B' : 'A', active: step === 1 || step === 2 }
    ]
  };
}

// Browser setup. The data and fixed trace above are also checked independently.
const $ = id => document.getElementById(id);
const storageKey = 'cp12-function-arguments-v1';
const validIds = new Set(examples.map(example => example.id));
let restored = null;
try { restored = JSON.parse(localStorage.getItem(storageKey)); } catch (_) { /* Saving may be unavailable. */ }
const state = {
  selected: validIds.has(restored?.selected) ? restored.selected : 'number',
  notebooks: Object.fromEntries(examples.map(example => {
    const saved = restored?.notebooks?.[example.id];
    return [example.id, {
      code: typeof saved?.code === 'string' ? saved.code.slice(0, 20000) : example.code,
      prediction: typeof saved?.prediction === 'string' ? saved.prediction.slice(0, 4000) : '',
      explanation: typeof saved?.explanation === 'string' ? saved.explanation.slice(0, 4000) : ''
    }];
  })),
  trace: { mode: Object.hasOwn(traceCases, restored?.trace?.mode) ? restored.trace.mode : 'edit', step: Math.max(0, Math.min(3, Math.trunc(Number(restored?.trace?.step) || 0))) },
  reflection: typeof restored?.reflection === 'string' ? restored.reflection.slice(0, 4000) : '',
  runs: Array.isArray(restored?.runs) ? restored.runs.filter(run => validIds.has(run?.exampleId) && typeof run.code === 'string' && typeof run.output === 'string').slice(-16).map(run => ({ exampleId: run.exampleId, code: run.code.slice(0, 20000), prediction: String(run.prediction || '').slice(0, 4000), output: run.output.slice(0, 20000), success: run.success === true, time: String(run.time || '') })) : []
};
let currentId = state.selected;
let saveTimer;
let worker = null;
let pending = null;
let runId = 0;
let runTimer;

function capture() {
  state.selected = currentId;
  state.notebooks[currentId] = { code: $('python-code').value, prediction: $('prediction').value, explanation: $('explanation').value };
  state.reflection = $('reflection').value;
}
function save() {
  capture();
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    $('save-status').textContent = 'Saved on this browser. Download a copy to hand in.';
  } catch (_) {
    $('save-status').textContent = 'This browser could not save your work. Download a copy before leaving.';
  }
}
function queueSave() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 200); }

function renderTrace() {
  const view = traceSnapshot(state.trace.mode, state.trace.step);
  $('trace-mode').value = state.trace.mode;
  $('trace-code').textContent = view.code;
  $('trace-progress').textContent = `Step ${view.step + 1} of 4`;
  $('trace-caption').textContent = view.caption;
  $('trace-back').disabled = view.step === 0;
  $('trace-next').disabled = view.step === 3;
  const nameColumn = document.createElement('div'); nameColumn.className = 'map-names';
  for (const name of view.names) {
    const card = document.createElement('div'); card.className = `map-name${name.active ? '' : ' inactive'}`;
    const scope = document.createElement('small'); scope.textContent = name.scope;
    const label = document.createElement('code'); label.textContent = name.label;
    const target = document.createElement('span'); target.className = 'map-target';
    target.textContent = name.active ? `→ Object ${name.target}` : view.step === 0 ? 'Not in a call yet' : 'Call finished · local name gone';
    card.append(scope, label, target); nameColumn.append(card);
  }
  const objectColumn = document.createElement('div'); objectColumn.className = 'map-objects';
  for (const object of view.objects) {
    const card = document.createElement('div'); card.className = `map-object${object.changed ? ' changed' : ''}`;
    const label = document.createElement('strong'); label.textContent = `Object ${object.id} · ${object.kind}`;
    const value = document.createElement('code'); value.textContent = object.value;
    card.append(label, value); objectColumn.append(card);
  }
  $('name-map').replaceChildren(nameColumn, objectColumn);
}

function renderHistory() {
  const entries = state.runs.slice(-4).reverse();
  $('history-title').textContent = `Earlier runs on this browser (${state.runs.length} kept)`;
  $('run-history').replaceChildren();
  if (!entries.length) { const message = document.createElement('p'); message.textContent = 'Your recent runs will appear here.'; $('run-history').append(message); }
  for (const run of entries) {
    const article = document.createElement('article'); article.className = 'history-entry';
    const heading = document.createElement('h4'); heading.textContent = `${examples.find(example => example.id === run.exampleId).title} · ${run.success ? 'completed' : 'stopped or error'}`;
    const code = document.createElement('pre'); code.textContent = run.code;
    const output = document.createElement('pre'); output.textContent = run.output;
    article.append(heading, code, output); $('run-history').append(article);
  }
}

function renderExample() {
  const example = examples.find(entry => entry.id === currentId);
  const saved = state.notebooks[currentId];
  $('example-select').value = currentId;
  $('example-title').textContent = example.title;
  $('example-intro').textContent = example.intro;
  $('python-code').value = saved.code;
  $('prediction').value = saved.prediction;
  $('explanation').value = saved.explanation;
  $('change-task').textContent = example.change;
  $('example-explanation').textContent = example.why;
  $('starter-explanation').open = false;
  $('python-output').textContent = 'Predict, then run this version to see its actual output.';
  $('run-status').textContent = 'Not run since opening this example.';
}

function setBusy(busy) {
  for (const id of ['example-select', 'python-code', 'restore-code', 'run-code', 'prediction']) $(id).disabled = busy;
  $('stop-code').hidden = !busy;
}

function finishRun(output, success) {
  if (!pending) return;
  clearTimeout(runTimer);
  const run = pending;
  pending = null;
  $('python-output').textContent = output;
  $('run-status').textContent = success ? 'Run complete. Compare it with your prediction, then try a change.' : 'Read the last line of the message. Change or restore the code, then try again.';
  state.runs.push({ exampleId: run.exampleId, code: run.code, prediction: run.prediction, output, success, time: new Date().toISOString() });
  state.runs = state.runs.slice(-16);
  const returnFocus = document.activeElement === $('stop-code');
  setBusy(false); renderHistory(); save();
  if (returnFocus) $('run-code').focus();
}

function abortRun(message) {
  if (!pending) return;
  worker?.terminate(); worker = null;
  finishRun(message, false);
}

function getWorker() {
  if (worker) return worker;
  worker = new Worker('pattern-recognition/python-worker.js', { type: 'module' });
  worker.onmessage = event => {
    if (!pending || event.data.id !== pending.id) return;
    if (event.data.type === 'running') {
      clearTimeout(runTimer);
      $('run-status').textContent = 'Running Python…';
      runTimer = setTimeout(() => abortRun('Stopped after 8 seconds. Check that your loop can finish, then run again.'), 8000);
    } else if (event.data.type === 'result') finishRun(event.data.output, true);
    else if (event.data.type === 'error') finishRun(event.data.error, false);
  };
  worker.onerror = event => {
    event.preventDefault();
    abortRun('Python could not start. Check your connection and try Run again. You can also copy the code into your usual Python editor; the trace above still works.');
  };
  return worker;
}

for (const example of examples) { const option = document.createElement('option'); option.value = example.id; option.textContent = example.title; $('example-select').append(option); }
$('reflection').value = state.reflection;
$('trace-mode').addEventListener('change', () => { state.trace = { mode: $('trace-mode').value, step: 0 }; renderTrace(); save(); });
$('trace-back').addEventListener('click', () => { state.trace.step = Math.max(0, state.trace.step - 1); renderTrace(); save(); });
$('trace-next').addEventListener('click', () => { state.trace.step = Math.min(3, state.trace.step + 1); renderTrace(); save(); });
$('trace-reset').addEventListener('click', () => { state.trace.step = 0; renderTrace(); save(); });
$('example-select').addEventListener('change', () => { capture(); currentId = $('example-select').value; renderExample(); save(); });
for (const id of ['python-code', 'prediction', 'explanation', 'reflection']) $(id).addEventListener('input', () => {
  if (id === 'python-code' && !pending) $('run-status').textContent = 'Code changed. Run again to check this version.';
  queueSave();
});
$('restore-code').addEventListener('click', () => {
  const starter = examples.find(entry => entry.id === currentId).code;
  if ($('python-code').value !== starter && !confirm('Replace this example’s code with its starter? Earlier runs stay in your download.')) return;
  $('python-code').value = starter;
  $('python-output').textContent = 'Starter restored. Predict and run it again.';
  $('run-status').textContent = 'Not run since restoring.';
  save();
});
$('run-code').addEventListener('click', () => {
  if (pending) return;
  capture();
  const { code, prediction } = state.notebooks[currentId];
  if (!code.trim()) { $('run-status').textContent = 'Write some Python code first, or restore the starter.'; return; }
  const hasRunThisVersion = state.runs.some(run => run.exampleId === currentId && run.code === code);
  if (!hasRunThisVersion && !prediction.trim()) { $('run-status').textContent = 'Write a prediction first. A guess is okay; compare it after running.'; $('prediction').focus(); return; }
  pending = { id: ++runId, exampleId: currentId, code, prediction };
  setBusy(true);
  $('python-output').textContent = 'Preparing Python…';
  $('run-status').textContent = 'First load may take a moment. You can stop at any time.';
  runTimer = setTimeout(() => abortRun('Python took too long to load. Check your connection and try again, or use your usual Python editor.'), 60000);
  try { getWorker().postMessage({ id: pending.id, code }); }
  catch (_) { abortRun('This browser could not start Python. Try again in a current browser, or use your usual Python editor.'); }
});
$('stop-code').addEventListener('click', () => abortRun('Stopped. Check or change your code before running again.'));
let leaveEditorOnTab = false;
$('python-code').addEventListener('keydown', event => {
  if (event.key === 'Escape') { leaveEditorOnTab = true; return; }
  if (event.key === 'Tab' && !event.shiftKey && !leaveEditorOnTab) {
    event.preventDefault();
    $('python-code').setRangeText('    ', $('python-code').selectionStart, $('python-code').selectionEnd, 'end');
    $('python-code').dispatchEvent(new Event('input', { bubbles: true }));
  }
  leaveEditorOnTab = false;
});

$('download-notes').addEventListener('click', () => {
  clearTimeout(saveTimer); save();
  const lines = ['CALL BY REFERENCE AND CALL BY VALUE — MY PYTHON WORK', `Downloaded: ${new Date().toLocaleString()}`, '', 'Fixed trace:', traceCases[state.trace.mode].code, `Trace step: ${state.trace.step + 1}`, ''];
  for (const example of examples) {
    const entry = state.notebooks[example.id];
    lines.push(example.title, 'Prediction:', entry.prediction || '(not recorded)', 'Current code:', entry.code, 'Explanation:', entry.explanation || '(not recorded)', '');
  }
  lines.push('RECENT RUNS (last 16)');
  for (const run of state.runs) lines.push('', examples.find(entry => entry.id === run.exampleId).title, run.time, run.success ? 'Completed' : 'Stopped or error', 'Prediction at run:', run.prediction, 'Code at run:', run.code, 'Output:', run.output);
  lines.push('', 'MY REFLECTION', state.reflection || '(not recorded)', '', 'These are my notes and experiments, not an automatic achievement grade.');
  const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = 'function-arguments-my-work.txt'; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  $('save-status').textContent = 'Downloaded. Hand in the text file using your usual class method.';
});
$('clear-notes').addEventListener('click', () => {
  if (!confirm('Clear this lesson’s saved work on this browser? Download your work first if you need it.')) return;
  clearTimeout(saveTimer); clearTimeout(runTimer); worker?.terminate();
  try { localStorage.removeItem(storageKey); } catch (_) { /* Nothing saved. */ }
  window.location.reload();
});
window.addEventListener('pagehide', () => {
  clearTimeout(saveTimer);
  if (pending) abortRun('Run stopped when leaving the page. Run again to check this version.');
  else { worker?.terminate(); worker = null; }
  save();
});
renderTrace(); renderExample(); renderHistory();
if (restored) $('save-status').textContent = 'Restored this browser’s saved work. Download a copy before switching devices.';
