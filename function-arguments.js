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
    "id": "float",
    "title": "7 · float: a decimal number",
    "intro": "A float stores a number with a decimal point. Will a local calculation change price?",
    "code": "def add_fee(amount):\n    amount = amount + 0.5\n    print(\"Inside:\", amount)\n    return amount\n\nprice = 2.5\nadd_fee(price)\nprint(\"Outside:\", price)\n",
    "change": "Store the returned answer in price. Try another starting price.",
    "why": "Floats are immutable. The calculation gives the local name a new value. The caller changes price only if it assigns the returned answer."
  },
  {
    "id": "bool",
    "title": "8 · bool: True or False",
    "intro": "A bool stores True or False. not reverses it. Follow both names.",
    "code": "def flip(flag):\n    flag = not flag\n    print(\"Inside:\", flag)\n    return flag\n\nready = False\nflip(ready)\nprint(\"Outside:\", ready)\n",
    "change": "Store the returned answer in ready. Then start with True and predict again.",
    "why": "Booleans are immutable. The local name is reassigned; the caller’s name keeps its value unless the caller stores the result."
  },
  {
    "id": "tuple",
    "title": "9 · tuple: a fixed sequence",
    "intro": "A tuple uses parentheses. Its positions cannot be replaced in place.",
    "code": "def new_pair(pair):\n    pair = (9, pair[1])\n    print(\"Inside:\", pair)\n    return pair\n\npoint = (2, 3)\nnew_pair(point)\nprint(\"Outside:\", point)\n",
    "change": "Store the returned tuple in point. Then try pair[0] = 9 inside the function and read the error.",
    "why": "The starter creates a new tuple locally. Indexed assignment to a tuple raises TypeError. A tuple can contain a mutable list; that inner list can still change."
  },
  {
    "id": "dict",
    "title": "10 · dict: labelled values",
    "intro": "A dictionary stores key–value pairs. Use a key such as \"score\" to choose a value.",
    "code": "def change_score(record):\n    record[\"score\"] = 7\n    print(\"Inside:\", record)\n\nstudent = {\"name\": \"Mei\", \"score\": 4}\nchange_score(student)\nprint(\"Outside:\", student)\n",
    "change": "Try record = {\"score\": 9} instead of the indexed edit. Predict what student will show.",
    "why": "Dictionaries are mutable. Updating a key changes the shared dictionary. Assigning a new dictionary to record would reassign only the local name."
  },
  {
    "id": "set",
    "title": "11 · set: unique items",
    "intro": "A set keeps unique items. add() puts an item in the shared set. Sets have no index 0.",
    "code": "def add_colour(colours):\n    colours.add(\"blue\")\n    print(\"Inside:\", sorted(colours))\n\nchoices = {\"red\"}\nadd_colour(choices)\nprint(\"Outside:\", sorted(choices))\n",
    "change": "Try adding \"red\" instead. Then replace the add line with colours = {\"green\"}.",
    "why": "Sets are mutable. add() edits the shared set; a duplicate is kept only once. sorted() is used just to print the items in a predictable order."
  },
  {
    "id": "complex",
    "title": "12 · Optional: complex numbers",
    "intro": "A complex number has a real part and an imaginary part, written with j in Python.",
    "code": "def shift(number):\n    number = number + 1j\n    print(\"Inside:\", number)\n    return number\n\nvalue = 2 + 3j\nshift(value)\nprint(\"Outside:\", value)\n",
    "change": "Store the returned answer in value. Try a different starting number.",
    "why": "Complex numbers are immutable. The calculation reassigns the local name and leaves the caller’s name unchanged."
  },
  {
    "id": "frozenset",
    "title": "13 · Optional: frozenset",
    "intro": "A frozenset is a set whose items cannot be added or removed. union() returns a set containing both groups.",
    "code": "def with_blue(colours):\n    colours = colours.union({\"blue\"})\n    print(\"Inside:\", sorted(colours))\n    return colours\n\nchoices = frozenset({\"red\"})\nwith_blue(choices)\nprint(\"Outside:\", sorted(choices))\n",
    "change": "Store the returned answer in choices. Then try colours.add(\"blue\") and read the error.",
    "why": "A frozenset is immutable. union() returns a new frozenset; it does not edit the original. It has no add() method."
  },
  {
    "id": "range",
    "title": "14 · Optional: range",
    "intro": "A range describes a sequence of integers. list() below makes its numbers visible in the output.",
    "code": "def longer(numbers):\n    numbers = range(5)\n    print(\"Inside:\", list(numbers))\n    return numbers\n\nsteps = range(3)\nlonger(steps)\nprint(\"Outside:\", list(steps))\n",
    "change": "Store the returned range in steps. Then try numbers[0] = 9 and read the error.",
    "why": "Ranges are immutable. Assigning range(5) changes only the local name. list() creates a list for display; it does not edit the range."
  },
  {
    "id": "bytes",
    "title": "15 · Optional: bytes",
    "intro": "Bytes store binary data. The b prefix makes a bytes value; its numbered items cannot be replaced.",
    "code": "def add_mark(data):\n    data = data + b\"!\"\n    print(\"Inside:\", data)\n    return data\n\nmessage = b\"Hi\"\nadd_mark(message)\nprint(\"Outside:\", message)\n",
    "change": "Store the returned answer in message. Try data[0] = 66 and read the error.",
    "why": "Bytes are immutable. Joining bytes creates a new value and reassigns the local name."
  },
  {
    "id": "bytearray",
    "title": "16 · Optional: bytearray",
    "intro": "A bytearray is an editable sequence of byte values, from 0 to 255.",
    "code": "def change_first(data):\n    data[0] = 9\n    print(\"Inside:\", list(data))\n\nvalues = bytearray([1, 2, 3])\nchange_first(values)\nprint(\"Outside:\", list(values))\n",
    "change": "Replace the edit with data = bytearray([9]). Predict the outside values.",
    "why": "A bytearray is mutable. Indexed assignment changes the shared object. list() is used only to display its numbers clearly."
  },
  {
    "id": "memoryview",
    "title": "17 · Optional: memoryview",
    "intro": "A memoryview gives access to existing binary data without copying it. This view uses a writable bytearray.",
    "code": "def change_first(view):\n    view[0] = 9\n    print(\"Inside:\", list(view))\n\nvalues = bytearray([1, 2, 3])\nwindow = memoryview(values)\nchange_first(window)\nprint(\"Outside:\", list(values))\n",
    "change": "Use values = bytes([1, 2, 3]) instead. Predict whether the view is writable, then run.",
    "why": "A view of a writable bytearray can edit the underlying data. A view of immutable bytes is read-only, so the same assignment raises TypeError."
  },
  {
    "id": "none",
    "title": "18 · None: no value yet",
    "intro": "None represents no value. Its type is called NoneType. Does a local assignment replace result?",
    "code": "def fill_in(value):\n    value = \"Ready\"\n    print(\"Inside:\", value)\n    return value\n\nresult = None\nfill_in(result)\nprint(\"Outside:\", result)\n",
    "change": "Store the returned answer in result. Compare this with a function that has no return statement.",
    "why": "None cannot be edited. The local assignment makes value refer to a string; result still refers to None. A function with no explicit return returns None."
  },
  {
    id: 'grid', title: '19 · Going further: a shallow grid copy',
    intro: 'For CS12 or after the grid work: a new outer list can still share its row lists.',
    code: 'def change_seat(plan):\n    plan[0][1] = "Mei"\n\nseats = [["Ava", ""], ["", "Ben"]]\npreview = seats.copy()\nchange_seat(preview)\nprint("Original:", seats)\nprint("Preview:", preview)\n',
    change: 'Create a new outer list and copy each row before editing. Write the loop yourself, then check that the original stays unchanged.',
    why: 'A shallow outer copy still refers to the original rows. The starter edits a shared row. For this grid of strings, copying each row creates separate row lists.'
  },
  {
    id: 'practice', title: '20 · Your turn: write and call two functions',
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


// A plain-text report uses the exact saved code/output, never a model answer.
function buildWorkReport(work, downloadedAt) {
  const divider = '-'.repeat(64);
  const heading = text => [divider, text, divider];
  const filled = (value, fallback = '[Not recorded]') => value?.trim() ? value : fallback;
  const worked = examples.filter(example => {
    const entry = work.notebooks[example.id];
    return entry && (entry.code !== example.code || entry.prediction.trim() || entry.explanation.trim() || work.runs.some(run => run.exampleId === example.id));
  });
  const lines = [
    ...heading('CALL BY REFERENCE AND CALL BY VALUE'),
    'MY PYTHON EXPERIMENTS', 'Name: ____________________',
    `Downloaded: ${downloadedAt}`, '',
    `Examples with saved work: ${worked.length} of ${examples.length}`,
    `Recorded tests: ${work.runs.length} (up to the most recent 60 are kept)`,
    'A recorded test is evidence of a run, not an automatic grade.', ''
  ];
  if (!worked.length) lines.push('No experiment work recorded yet. Predict, run some code, and download again.', '');
  for (const example of worked) {
    const entry = work.notebooks[example.id];
    const tests = work.runs.filter(run => run.exampleId === example.id);
    const matching = [...tests].reverse().find(run => run.code === entry.code);
    lines.push(...heading(example.title), '',
      'MY PREDICTION', filled(entry.prediction), '',
      'MY CURRENT CODE', filled(entry.code, '[No code written]'), '',
      'OUTPUT FOR MY CURRENT CODE');
    if (matching) {
      lines.push(`Test recorded: ${matching.time}`, matching.success ? 'Status: Completed' : 'Status: Stopped or error',
        filled(matching.output, '[No text printed. Use print() to show a result.]'));
    } else {
      lines.push(tests.length ? 'This version has not been run. Earlier output belongs to the code in TEST HISTORY below.' : 'Not run yet. No actual output recorded.');
    }
    lines.push('', 'MY EXPLANATION', filled(entry.explanation), '');
    const older = tests.filter(run => run !== matching);
    if (older.length) {
      lines.push('TEST HISTORY — EARLIER OR DIFFERENT CODE', '');
      older.forEach((run, index) => lines.push(
        `--- Test ${index + 1} ---`, `Recorded: ${run.time}`,
        run.success ? 'Status: Completed' : 'Status: Stopped or error', '',
        'Prediction at this test:', filled(run.prediction), '',
        'Code at this test:', filled(run.code, '[No code]'), '',
        'Actual output / error:', filled(run.output, '[No text printed. Use print() to show a result.]'), ''
      ));
    }
  }
  lines.push(...heading('MY FINAL REFLECTION'), filled(work.reflection), '',
    ...heading('EXAMPLES WITH NO SAVED WORK'));
  const untouched = examples.filter(example => !worked.includes(example));
  lines.push(untouched.length ? untouched.map(example => example.title).join('\n') : 'All examples have saved work.', '',
    'End of report. Hand in this text file using your usual class method.', '');
  return lines.join('\n');
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
  runs: Array.isArray(restored?.runs) ? restored.runs.filter(run => validIds.has(run?.exampleId) && typeof run.code === 'string' && typeof run.output === 'string').slice(-60).map(run => ({ exampleId: run.exampleId, code: run.code.slice(0, 20000), prediction: String(run.prediction || '').slice(0, 4000), output: run.output.slice(0, 20000), success: run.success === true, time: String(run.time || '') })) : []
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
  state.runs = state.runs.slice(-60);
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
  const report = buildWorkReport(state, new Date().toLocaleString());
  const url = URL.createObjectURL(new Blob([report], { type: 'text/plain;charset=utf-8' }));
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
