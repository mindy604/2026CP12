'use strict';

const TASKS = [
  {id:'order',label:'Record items and quantities',needs:[]},
  {id:'prices',label:'Read menu prices',needs:[]},
  {id:'costs',label:'Calculate item costs',needs:['order','prices']},
  {id:'total',label:'Add item costs',needs:['costs']},
  {id:'format',label:'Prepare receipt text',needs:['order','costs','total']},
  {id:'display',label:'Display receipt',needs:['format']}
];
const CASES = {
  mixed:{label:'2 sandwiches, 1 juice',sandwich:2,juice:1,expected:1000},
  juice:{label:'3 juices',sandwich:0,juice:3,expected:600},
  empty:{label:'No items',sandwich:0,juice:0,expected:0}
};
const money = cents => '$' + (cents / 100).toFixed(2);
const validGroup = group => ['a','b','c'].includes(group);

function simulateDesign(assignments, names, caseKey) {
  const example = CASES[caseKey] || CASES.mixed;
  const data = {}, trace = [], warnings = [];
  const used = [...new Set(TASKS.map(task => assignments[task.id]).filter(validGroup))];
  if (used.length < 2) warnings.push('Use at least two smaller jobs to practise decomposition.');
  const groupNames = used.map(group => String(names[group] || '').trim());
  if (groupNames.some(name => !name)) warnings.push('Give each group you use a name that describes its purpose.');
  const nonblank = groupNames.filter(Boolean).map(name => name.toLowerCase());
  if (new Set(nonblank).size !== nonblank.length) warnings.push('Use different names so you can distinguish your smaller jobs.');
  const missing = TASKS.filter(task => !validGroup(assignments[task.id]));
  if (missing.length) warnings.push(`${missing.length} responsibilit${missing.length === 1 ? 'y is' : 'ies are'} left out.`);
  for (const task of TASKS) {
    const group = validGroup(assignments[task.id]) ? assignments[task.id] : '';
    const groupName = group ? String(names[group] || '').trim() || `Job ${group.toUpperCase()}` : 'Not assigned';
    let state = 'done', output = '';
    const unavailable = task.needs.filter(key => !(key in data));
    if (!group) {
      state = 'omitted'; output = 'Left out. This task produces no output.';
    } else if (unavailable.length) {
      state = 'blocked';
      const labels = {order:'the order',prices:'menu prices',costs:'item costs',total:'the total',format:'receipt text'};
      output = 'Blocked: needs ' + unavailable.map(key => labels[key]).join(' and ') + '.';
    } else {
      switch(task.id) {
        case 'order':
          data.order = {sandwich:example.sandwich,juice:example.juice};
          output = `Order recorded: ${example.sandwich} sandwich(es), ${example.juice} juice(s).`; break;
        case 'prices':
          data.prices = {sandwich:400,juice:200};
          output = 'Prices read: sandwich $4.00; juice $2.00.'; break;
        case 'costs':
          data.costs = {sandwich:data.order.sandwich * data.prices.sandwich,juice:data.order.juice * data.prices.juice};
          output = `Item costs: sandwiches ${money(data.costs.sandwich)}; juices ${money(data.costs.juice)}.`; break;
        case 'total':
          data.total = data.costs.sandwich + data.costs.juice;
          output = `Total produced: ${money(data.total)}.`; break;
        case 'format': {
          const lines = [];
          if (data.order.sandwich) lines.push(`${data.order.sandwich} × Sandwich   ${money(data.costs.sandwich)}`);
          if (data.order.juice) lines.push(`${data.order.juice} × Juice      ${money(data.costs.juice)}`);
          if (!lines.length) lines.push('No items');
          lines.push('------------------------',`Total           ${money(data.total)}`);
          data.format = lines.join('\n');
          output = 'Receipt text prepared using the order, item costs and total.'; break;
        }
        case 'display':
          data.display = data.format; output = 'Receipt displayed to the customer.'; break;
      }
    }
    trace.push({id:task.id,label:task.label,group,groupName,state,output});
  }
  const complete = 'display' in data;
  return {trace,warnings,complete,planReady:!warnings.length,receipt:complete ? data.display : '',total:data.total,expected:example.expected};
}

function guidedOutcome(selected) {
  const hasOrder = selected.read, hasTotal = selected.read && selected.total;
  return {
    read:{state:hasOrder?'done':'blocked',text:hasOrder?'Produced: 2 sandwiches, 1 juice.':'Omitted: no order produced.'},
    total:{state:hasTotal?'done':'blocked',text:!selected.total?'Omitted: no total produced.':!hasOrder?'Blocked: the order is missing.':'Produced: $10.00.'},
    receipt:{state:selected.receipt&&hasTotal?'done':'blocked',text:!selected.receipt?'Omitted: no receipt displayed.':!hasOrder?'Blocked: the order is missing.':!hasTotal?'Blocked: the total is missing.':'Receipt displayed: 2 sandwiches, 1 juice. Total $10.00.'},
    message:!hasOrder?'The later jobs need an order. Which job should supply it?':!hasTotal?'The order exists, but the receipt needs a total. Which job could supply it?':!selected.receipt?'The total exists, but the customer has no receipt. Which responsibility is missing?':'The three jobs work together. Follow what each job produces for the next one.'
  };
}

function initNotebook() {
  const ids = ['prediction','reflection','guided-read','guided-total','guided-receipt','guided-test','guided-feedback',
    'guided-read-stage','guided-total-stage','guided-receipt-stage','guided-read-output','guided-total-output','guided-receipt-output',
    'name-a','name-b','name-c','groups','test-case','case-expected','test-design','design-feedback','trace','next-task','show-result',
    'trace-position','receipt-area','receipt','download-work','save-status'];
  const ui = Object.fromEntries(ids.map(id => [id,document.getElementById(id)]));
  const selects = Object.fromEntries(TASKS.map(task => [task.id,document.getElementById('task-' + task.id)]));
  const storageKey = 'cp12-decomposition-01-v1';
  let testedGuided = false, run = null, visible = 0, storageAvailable = true;
  const getNames = () => Object.fromEntries(['a','b','c'].map(group => [group,ui['name-' + group].value.trim()]));
  const getAssignments = () => Object.fromEntries(TASKS.map(task => [task.id,selects[task.id].value]));
  const getGuided = () => Object.fromEntries(['read','total','receipt'].map(key => [key,ui['guided-' + key].checked]));

  function save() {
    const state = {version:1,prediction:ui.prediction.value,reflection:ui.reflection.value,names:getNames(),assignments:getAssignments(),guided:getGuided(),caseKey:ui['test-case'].value};
    try {
      localStorage.setItem(storageKey,JSON.stringify(state));
      ui['save-status'].textContent = 'Saved in this browser on this device. Download your notes to keep a copy.';
      storageAvailable = true;
    } catch {
      storageAvailable = false;
      ui['save-status'].textContent = 'Browser saving is unavailable. Download your notes before leaving.';
    }
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!saved || saved.version !== 1) return;
      for (const key of ['prediction','reflection']) if (typeof saved[key] === 'string') ui[key].value = saved[key].slice(0,key==='prediction'?4000:6000);
      for (const group of ['a','b','c']) if (typeof saved.names?.[group] === 'string') ui['name-' + group].value = saved.names[group].slice(0,50);
      for (const task of TASKS) selects[task.id].value = validGroup(saved.assignments?.[task.id]) ? saved.assignments[task.id] : '';
      for (const key of ['read','total','receipt']) if (typeof saved.guided?.[key] === 'boolean') ui['guided-' + key].checked = saved.guided[key];
      if (Object.hasOwn(CASES,saved.caseKey)) ui['test-case'].value = saved.caseKey;
      ui['save-status'].textContent = 'Your saved notes and groups were restored. Test again to generate a new trace.';
    } catch {
      storageAvailable = false;
      ui['save-status'].textContent = 'Saved work could not be read. You can still work here and download your notes.';
    }
  }

  function drawGuided() {
    const selected = getGuided(), outcome = guidedOutcome(selected);
    for (const key of ['read','total','receipt']) {
      ui['guided-' + key + '-output'].textContent = testedGuided ? outcome[key].text : selected[key] ? 'Included · not tested' : 'Omitted from this design';
      ui['guided-' + key + '-stage'].dataset.state = testedGuided ? outcome[key].state : '';
    }
    ui['guided-feedback'].textContent = testedGuided ? outcome.message : 'Test once, change one choice, then test again. Compare the result with your prediction.';
  }

  function drawGroups() {
    const names = getNames(), assignments = getAssignments();
    ui.groups.replaceChildren();
    for (const group of ['a','b','c']) {
      const section = document.createElement('div'), heading = document.createElement('h3');
      section.className = 'group';
      heading.textContent = names[group] || `Job ${group.toUpperCase()} · unnamed`;
      section.append(heading);
      const tasks = TASKS.filter(task => assignments[task.id] === group);
      if (tasks.length) {
        const list = document.createElement('ul');
        for (const task of tasks) { const item = document.createElement('li'); item.textContent = task.label; list.append(item); }
        section.append(list);
      } else {
        const empty = document.createElement('p'); empty.className = 'help'; empty.textContent = 'No responsibilities assigned.'; section.append(empty);
      }
      ui.groups.append(section);
      for (const select of Object.values(selects)) select.querySelector(`option[value="${group}"]`).textContent = `Job ${group.toUpperCase()}${names[group] ? ' · ' + names[group] : ''}`;
    }
  }

  function invalidate() {
    run = null; visible = 0; ui.trace.replaceChildren();
    ui['next-task'].disabled = true; ui['show-result'].disabled = true;
    ui['receipt-area'].hidden = true; ui['trace-position'].textContent = '';
    ui['design-feedback'].textContent = 'Your design or test order changed. Select Test this case to follow the new data.';
    ui['design-feedback'].dataset.state = '';
    ui['case-expected'].textContent = 'Expected total: ' + money(CASES[ui['test-case'].value].expected);
  }

  function drawTrace() {
    if (!run) return;
    ui.trace.replaceChildren();
    for (const [index,step] of run.trace.slice(0,visible).entries()) {
      const item = document.createElement('li'), number = document.createElement('span'), content = document.createElement('div');
      number.className = 'step'; number.textContent = index + 1;
      const group = document.createElement('div'); group.className = 'job'; group.textContent = step.groupName;
      const title = document.createElement('strong'); title.textContent = step.label;
      const output = document.createElement('p'); output.textContent = step.output;
      content.append(group,title,output); item.append(number,content); ui.trace.append(item);
    }
    const done = visible === run.trace.length;
    ui['next-task'].disabled = done; ui['show-result'].disabled = done;
    ui['trace-position'].textContent = `${visible} of ${run.trace.length} tasks shown`;
    ui['receipt-area'].hidden = !(done && run.complete);
    ui.receipt.textContent = done && run.complete ? run.receipt : '';
    let summary = run.warnings.join(' ');
    if (!summary) summary = 'All six responsibilities are assigned to named groups.';
    if (done) summary += run.complete ? ' A complete receipt was produced. Explain why the responsibilities in each group belong together.' : ' A complete receipt could not be displayed. Find the first missing output in the trace.';
    else summary += ' Predict the next output, then advance one task.';
    ui['design-feedback'].textContent = summary;
    ui['design-feedback'].dataset.state = run.warnings.length || (done&&!run.complete) ? 'attention' : '';
  }

  for (const key of ['read','total','receipt']) ui['guided-' + key].addEventListener('change',() => { testedGuided=false; drawGuided(); save(); });
  ui['guided-test'].addEventListener('click',() => { testedGuided=true; drawGuided(); save(); });
  for (const group of ['a','b','c']) ui['name-' + group].addEventListener('input',() => { drawGroups(); invalidate(); save(); });
  for (const select of Object.values(selects)) select.addEventListener('change',() => { drawGroups(); invalidate(); save(); });
  for (const field of [ui.prediction,ui.reflection]) field.addEventListener('input',save);
  ui['test-case'].addEventListener('change',() => { invalidate(); save(); });
  ui['test-design'].addEventListener('click',() => { run=simulateDesign(getAssignments(),getNames(),ui['test-case'].value); visible=1; drawTrace(); save(); });
  ui['next-task'].addEventListener('click',() => { if(run&&visible<run.trace.length)visible++; drawTrace(); });
  ui['show-result'].addEventListener('click',() => { if(run)visible=run.trace.length; drawTrace(); });
  ui['download-work'].addEventListener('click',() => {
    const names=getNames(), assignments=getAssignments();
    const lines=['DECOMPOSITION · EXAMPLE 01','Concession receipt','', 'MY PREDICTION',ui.prediction.value || '(not written)','', 'MY SMALLER JOBS'];
    for (const group of ['a','b','c']) {
      lines.push(`Job ${group.toUpperCase()}: ${names[group] || '(unnamed)'}`);
      const tasks=TASKS.filter(task=>assignments[task.id]===group);
      lines.push(...(tasks.length?tasks.map(task=>'  - '+task.label):['  (no responsibilities)']));
    }
    const leftOut=TASKS.filter(task=>!assignments[task.id]);
    lines.push('','LEFT OUT',...(leftOut.length?leftOut.map(task=>'- '+task.label):['None']),'','MY REFLECTION',ui.reflection.value || '(not written)');
    if(run)lines.push('','LAST TEST',CASES[ui['test-case'].value].label,...run.trace.map(step=>`${step.groupName}: ${step.label}\n  ${step.output}`),...(run.receipt?['',run.receipt]:[]));
    const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a'); link.href=url; link.download='decomposition-example-01-notes.txt'; document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    if(!storageAvailable)ui['save-status'].textContent='Notes downloaded. Browser saving is unavailable.';
  });
  restore(); drawGuided(); drawGroups();
  ui['case-expected'].textContent='Expected total: '+money(CASES[ui['test-case'].value].expected);
}
if (typeof document !== 'undefined') initNotebook();
