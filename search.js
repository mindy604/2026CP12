'use strict';

// Pure trace builder. Random positions are sampled without replacement.
function createSteps(values, target, method, random = Math.random) {
  if (method === 'binary' && values.some((v, i) => i > 0 && v < values[i - 1])) {
    throw new Error('Put the cards in ascending order first.');
  }
  const steps = [], checked = new Set(), excluded = new Set();
  let comparisons = 0;
  const record = (phase, active, found, low, high, message) => {
    steps.push({phase, active, found, low, high, comparisons,
      checked: [...checked], excluded: [...excluded], message});
  };
  record('ready', -1, -1, 0, values.length - 1,
    `Target: ${target}. Predict which position will be checked first.`);
  if (method === 'binary') {
    let low = 0, high = values.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2), value = values[mid];
      comparisons++;
      checked.add(mid);
      record('compare', mid, -1, low, high,
        `Compare ${value} at position ${mid} with target ${target}. Which section can still contain it?`);
      if (value === target) {
        record('found', mid, mid, low, high,
          `Found ${target} at position ${mid} after ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`);
        return steps;
      }
      const oldLow = low, oldHigh = high;
      if (value < target) {
        for (let i = low; i <= mid; i++) excluded.add(i);
        low = mid + 1;
      } else {
        for (let i = mid; i <= high; i++) excluded.add(i);
        high = mid - 1;
      }
      const section = value < target ? `${oldLow}–${mid}` : `${mid}–${oldHigh}`;
      record('narrow', -1, -1, low, high,
        `${value} is ${value < target ? 'less' : 'greater'} than ${target}. Rule out positions ${section}. ${low <= high ? `Keep positions ${low}–${high}. Predict the next check.` : 'No positions remain.'}`);
    }
  } else {
    const remaining = values.map((_, i) => i);
    while (remaining.length) {
      const choice = method === 'random' ? Math.floor(random() * remaining.length) : 0;
      const index = remaining.splice(choice, 1)[0], value = values[index];
      comparisons++;
      checked.add(index);
      record('compare', index, -1, 0, values.length - 1,
        `Compare ${value} at position ${index} with target ${target}. Does it match?`);
      if (value === target) {
        record('found', index, index, 0, values.length - 1,
          `Found ${target} at position ${index} after ${comparisons} comparison${comparisons === 1 ? '' : 's'}.`);
        return steps;
      }
      excluded.add(index);
      record('miss', -1, -1, 0, values.length - 1,
        `${value} does not match ${target}. Position ${index} is ruled out. ${remaining.length ? 'Predict which position will be checked next.' : 'Every position has been checked.'}`);
    }
  }
  record('absent', -1, -1, 1, 0,
    `Target ${target} was not found. No possible positions remain. Total comparisons: ${comparisons}.`);
  return steps;
}

function parseInputs(numbers, target, method) {
  const tokens = numbers.trim().split(/[\s,]+/).filter(Boolean);
  const valid = token => /^-?\d+$/.test(token) && Number(token) >= -99 && Number(token) <= 999;
  if (tokens.length < 2 || tokens.length > 12 || tokens.some(t => !valid(t))) {
    return {field:'numbers', error:'Enter 2–12 whole numbers from −99 to 999, separated by commas or spaces.'};
  }
  if (!valid(target.trim())) return {field:'target', error:'Enter one whole-number target from −99 to 999.'};
  const values = tokens.map(Number);
  if (method === 'binary' && values.some((v, i) => i > 0 && v < values[i - 1])) {
    return {field:'numbers', error:'This investigation needs cards in ascending order. Select Order cards, then use the numbers and target.'};
  }
  return {values, target:Number(target.trim())};
}

function initSearch() {
  const method = document.body.dataset.method;
  const ids = ['chart','positions','status','previous','next','run','reset','shuffle','trial','speed',
    'speed-label','numbers','target','input-error','original','comparisons','checked','remaining',
    'search-form','target-value','range','order','input-note'];
  const ui = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  let starting = method === 'binary' ? [2,3,5,6,7] : [7,3,5,2,6];
  let target = 6, steps = [], position = 0, timer = null, dirty = false;
  const delays = [1800,1250,850,550,350], names = ['Very slow','Slow','Medium','Fast','Very fast'];

  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
    ui.run.textContent = 'Run';
  }

  function draw() {
    const step = steps[position];
    const low = Math.min(...starting), high = Math.max(...starting);
    const maxHeight = window.matchMedia('(max-width:650px)').matches ? 220 : 280;
    ui.chart.parentElement.style.minWidth = `${starting.length * 42}px`;
    ui.chart.replaceChildren();
    starting.forEach((value, index) => {
      const tile = document.createElement('div'), label = document.createElement('strong');
      const state = document.createElement('span');
      const found = step.found === index, active = step.active === index;
      const excluded = step.excluded.includes(index);
      tile.className = 'tile' + (found ? ' settled' : active ? ' active' : excluded ? ' excluded' : '');
      tile.style.left = `calc(${index * 100 / starting.length}% + 3px)`;
      tile.style.width = `calc(${100 / starting.length}% - 6px)`;
      tile.style.height = `${high === low ? maxHeight * .65 : 64 + (value - low) / (high - low) * (maxHeight - 64)}px`;
      label.textContent = value;
      state.className = 'card-state';
      state.textContent = found ? '✓' : active ? '?' : excluded ? '×' : '·';
      tile.setAttribute('aria-hidden', 'true');
      tile.append(state, label);
      ui.chart.append(tile);
    });
    ui.chart.setAttribute('aria-label', `Cards: ${starting.map((v,i) => `${v} at position ${i}${step.found === i ? ', found' : step.active === i ? ', comparing' : step.excluded.includes(i) ? ', ruled out' : ', possible'}`).join('; ')}. Target ${target}.`);
    ui.status.textContent = dirty ? 'Your inputs changed. Select Use numbers & target to start a new search.' : step.message;
    ui['target-value'].textContent = target;
    ui.comparisons.textContent = step.comparisons;
    ui.checked.textContent = step.checked.length;
    ui.remaining.textContent = step.excluded.length;
    ui.range.textContent = method === 'binary' ? (step.low <= step.high ? `Possible section: positions ${step.low}–${step.high}` : 'Possible section: none') : 'Cards stay in their original positions.';
    ui.previous.disabled = dirty || position === 0;
    ui.next.disabled = dirty || position === steps.length - 1;
    ui.run.disabled = dirty || position === steps.length - 1;
    ui.reset.disabled = dirty;
    ui.shuffle.disabled = dirty;
    ui.trial.disabled = dirty;
  }

  function load(values, newTarget, replay = false) {
    stop();
    starting = [...values]; target = newTarget;
    if (!replay) steps = createSteps(starting, target, method);
    position = 0; dirty = false;
    ui.numbers.value = starting.join(', '); ui.target.value = target;
    ui.original.textContent = starting.join(', ');
    ui['input-error'].textContent = '';
    ui.numbers.removeAttribute('aria-invalid'); ui.target.removeAttribute('aria-invalid');
    ui.positions.replaceChildren();
    ui.positions.style.gridTemplateColumns = `repeat(${starting.length},1fr)`;
    starting.forEach((_,i) => { const span = document.createElement('span'); span.textContent = i; ui.positions.append(span); });
    draw();
  }
  function next() {
    if (position < steps.length - 1) position++;
    if (position === steps.length - 1) stop();
    draw();
  }
  function start() {
    if (dirty || position === steps.length - 1) return;
    ui.run.textContent = 'Pause';
    timer = setInterval(next, delays[Number(ui.speed.value) - 1]);
  }
  ui.next.addEventListener('click', () => { stop(); next(); });
  ui.previous.addEventListener('click', () => { stop(); if (position > 0) position--; draw(); });
  ui.run.addEventListener('click', () => timer !== null ? stop() : start());
  ui.reset.addEventListener('click', () => load(starting, target, true));
  ui.trial.addEventListener('click', () => load(starting, target));
  ui.shuffle.addEventListener('click', () => {
    const values = [...starting];
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    if (values.every((v,i) => v === starting[i])) {
      const other = values.findIndex(v => v !== values[0]);
      if (other > 0) [values[0], values[other]] = [values[other], values[0]];
    }
    load(values, target);
  });
  for (const field of [ui.numbers, ui.target]) field.addEventListener('input', () => {
    stop(); dirty = true; ui['input-error'].textContent = '';
    field.removeAttribute('aria-invalid'); ui['input-note'].textContent = ''; draw();
  });
  ui['search-form'].addEventListener('submit', event => {
    event.preventDefault(); stop();
    const result = parseInputs(ui.numbers.value, ui.target.value, method);
    if (result.error) {
      dirty = true;
      ui['input-error'].textContent = result.error;
      ui[result.field].setAttribute('aria-invalid', 'true');
      draw(); ui[result.field].focus(); return;
    }
    ui['input-note'].textContent = '';
    load(result.values, result.target);
  });
  ui.order.addEventListener('click', () => {
    stop();
    const result = parseInputs(ui.numbers.value, '0', 'linear');
    if (result.error) {
      ui['input-error'].textContent = result.error;
      ui.numbers.setAttribute('aria-invalid', 'true'); return;
    }
    ui.numbers.value = result.values.sort((a,b) => a-b).join(', ');
    dirty = true; ui['input-error'].textContent = '';
    ui.numbers.removeAttribute('aria-invalid');
    ui['input-note'].textContent = 'Cards ordered from smallest to largest. Select Use numbers & target to begin.';
    draw();
  });
  ui.speed.addEventListener('input', () => {
    const name = names[Number(ui.speed.value) - 1];
    ui['speed-label'].textContent = name; ui.speed.setAttribute('aria-valuetext', name);
    if (timer !== null) { stop(); start(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('resize', draw);
  load(starting, target);
}
if (typeof document !== 'undefined') initSearch();
