const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
let state = { prompts: [], tools: [] };

$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.classList.remove('active'));
  $$('.tab-panel').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  $('#tab-'+t.dataset.tab).classList.add('active');
}));

async function autoImportTg() {
  const o = await chrome.storage.local.get('pk_autoImportedTg_v2');
  if (o.pk_autoImportedTg_v2) return;
  try {
    const r = await fetch(chrome.runtime.getURL('data/imported.json'));
    if (!r.ok) return;
    const j = await r.json();
    const data = await chrome.runtime.sendMessage({type:'getAll'});
    let prompts = data.prompts || [], tools = data.tools || [];
    if (Array.isArray(j.prompts)) for (const x of j.prompts) {
      prompts.unshift({id:'tg-p-'+prompts.length+'-'+Date.now(), createdAt:new Date().toISOString(), ...x});
    }
    if (Array.isArray(j.tools)) for (const x of j.tools) {
      tools.unshift({id:'tg-t-'+tools.length+'-'+Date.now(), createdAt:new Date().toISOString(), ...x});
    }
    await chrome.runtime.sendMessage({type:'setPrompts', list: prompts});
    await chrome.runtime.sendMessage({type:'setTools', list: tools});
    await chrome.storage.local.set({pk_autoImportedTg_v2: true});
  } catch(e) { console.warn('autoImportTg', e); }
}

async function setupOllamaStatus() {
  const isAvailable = await isOllamaAvailable();
  const header = document.querySelector('header');
  const status = document.createElement('div');
  status.style.cssText = `
    padding: 8px 12px; font-size: 11px; text-align: center;
    background: ${isAvailable ? '#2D8C3C' : '#E30000'};
    color: white; margin-top: 2px;
  `;
  status.textContent = isAvailable ? '✓ Ollama (быстро)' : '⚠ OpenRouter (облачно)';
  header.appendChild(status);
}

async function load() {
  await autoImportTg();
  const data = await chrome.runtime.sendMessage({type:'getAll'});
  state.prompts = data.prompts || [];
  state.tools = data.tools || [];
  renderPrompts(state.prompts);
  renderTools(state.tools);
  $('#cnt-prompts').textContent = state.prompts.length;
  $('#cnt-tools').textContent = state.tools.length;
  setupOllamaStatus();
}

function renderPrompts(list) {
  const c = $('#prompts-list');
  if (!list.length) { c.innerHTML = '<div class="empty">Пока пусто. Открой нейросеть и нажми «Сохранить промпт» или добавь вручную.</div>'; return; }
  c.innerHTML = list.map(p => `
    <div class="card" data-id="${p.id}">
      <button class="del" data-del="${p.id}" title="Удалить">×</button>
      <div class="title">
        <span>${esc(titleFromText(p.text))}${p.score?` <span class="score">${p.score}</span>`:''}</span>
        <span style="font-size:10px;color:#86868B">${fmtDate(p.createdAt)}</span>
      </div>
      ${p.ai?`<div style="color:#86868B;font-size:11px;margin-bottom:4px">${esc(p.ai)}</div>`:''}
      <div class="text">${linkify(esc(p.text||''))}</div>
      ${(p.tags||[]).length?`<div class="tags">${p.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>`:''}
    </div>`).join('');
  c.querySelectorAll('.del').forEach(b => b.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Удалить этот промпт?')) return;
    await chrome.runtime.sendMessage({type:'deletePrompt', id: b.dataset.del});
    load();
  }));
  c.querySelectorAll('.card').forEach(el => el.addEventListener('click', () =>
    openPromptView(state.prompts.find(p => p.id === el.dataset.id))));
}

function openPromptView(item) {
  if (!item) return;
  $('#modal-title').textContent = titleFromText(item.text);
  const tagsHtml = (item.tags||[]).length
    ? `<div class="tags" style="margin-top:10px">${item.tags.map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>` : '';
  $('#modal-body').innerHTML = `
    <div style="color:#86868B;font-size:11px;margin-bottom:10px">
      ${item.ai?esc(item.ai)+' · ':''}${fmtDate(item.createdAt)}
    </div>
    <div id="v-text" style="background:#F5F5F7;padding:12px;border-radius:10px;
         max-height:300px;overflow-y:auto;font-size:13px;line-height:1.5;
         white-space:pre-wrap;word-break:break-word">${linkify(esc(item.text||''))}</div>
    ${tagsHtml}
    <div class="modal-actions">
      <button class="danger" id="v-del">Удалить</button>
      <button class="ghost" id="v-edit">Редактировать</button>
      <button class="primary" id="v-copy" style="min-width:160px">Копировать в буфер</button>
    </div>`;
  showModal();
  async function doCopy(text, label) {
    try {
      await navigator.clipboard.writeText(text||'');
      $('#v-copy').textContent = '✓ ' + label;
      $('#v-copy').style.background = '#2D8C3C';
      setTimeout(() => { $('#v-copy').textContent = 'Копировать в буфер'; $('#v-copy').style.background = ''; }, 1800);
    } catch(e) { alert('Не удалось скопировать'); }
  }
  $('#v-copy').onclick = async () => {
    if (item.cleanText) return doCopy(item.cleanText, 'Чистый');
    const key = await getApiKey();
    if (!key) { doCopy(item.text||'', 'Скопировано'); return; }
    $('#v-copy').textContent = 'Чищу через ИИ…'; $('#v-copy').disabled = true;
    try {
      const sys = `Ты извлекаешь из текста ТОЛЬКО сам промпт, готовый к вставке в нейросеть. Убирай: заголовки ("Промпт для X:", описания "Этот промпт делает то-то"), приписки тг-каналов ("Сохраняем себе", "Подписаться", "@channel", "Бэкдор" и т.п.), эмодзи-разделители, рекламу. Сохраняй: всю саму инструкцию для ИИ как есть, переменные [paste...], системные промпты <system_prompt>, примеры. Если в тексте несколько промптов — верни их через двойной перенос строки. Верни ТОЛЬКО JSON {"clean":"чистый текст промпта"}.`;
      const res = await callGroq(sys, `Текст:\n"""${(item.text||'').slice(0,12000)}"""`);
      const clean = (res.clean || item.text || '').trim();
      const updated = {...item, cleanText: clean};
      state.prompts = state.prompts.map(p => p.id===item.id ? updated : p);
      await chrome.runtime.sendMessage({type:'setPrompts', list: state.prompts});
      item.cleanText = clean;
      doCopy(clean, 'Чистый');
    } catch(e) {
      doCopy(item.text||'', 'Скопировано');
    }
    $('#v-copy').disabled = false;
  };
  $('#v-edit').onclick = () => { hideModal(); setTimeout(() => openPromptModal(item), 50); };
  $('#v-del').onclick = async () => {
    if (!confirm('Удалить?')) return;
    await chrome.runtime.sendMessage({type:'deletePrompt', id: item.id});
    hideModal(); load();
  };
}

function renderTools(list) {
  const c = $('#tools-list');
  if (!list.length) { c.innerHTML = '<div class="empty">База нейросетей пуста.</div>'; return; }
  c.innerHTML = list.map(t => `
    <div class="card" data-id="${t.id}">
      <button class="del" data-del-tool="${t.id}" title="Удалить">×</button>
      <div class="title">
        <span>${esc(t.name)}${t.score?` <span class="score">${t.score}</span>`:''}</span>
        ${t.url?`<a href="${esc(t.url)}" target="_blank" data-link>↗ открыть</a>`:''}
      </div>
      <div class="text">${esc(t.desc||'')}</div>
      ${(t.tags||[]).length?`<div class="tags">${t.tags.map(x=>`<span class="tag">${esc(x)}</span>`).join('')}</div>`:''}
    </div>`).join('');
  c.querySelectorAll('.del').forEach(b => b.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!confirm('Удалить эту нейросеть?')) return;
    await chrome.runtime.sendMessage({type:'deleteTool', id: b.dataset.delTool});
    load();
  }));
  c.querySelectorAll('.card').forEach(el => el.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') return;
    openToolModal(state.tools.find(t => t.id === el.dataset.id));
  }));
}

$('#search-prompts').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) return renderPrompts(state.prompts);
  renderPrompts(state.prompts.filter(p =>
    (p.text||'').toLowerCase().includes(q)
    || (p.ai||'').toLowerCase().includes(q)
    || (p.tags||[]).join(' ').toLowerCase().includes(q)));
});
$('#search-tools').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  if (!q) return renderTools(state.tools);
  renderTools(state.tools.filter(t =>
    (t.name||'').toLowerCase().includes(q)
    || (t.desc||'').toLowerCase().includes(q)
    || (t.tags||[]).join(' ').toLowerCase().includes(q)));
});

$('#clear-prompts').addEventListener('click', async () => {
  if (!state.prompts.length) return;
  if (!confirm(`Удалить ВСЕ ${state.prompts.length} промптов? Это нельзя отменить.`)) return;
  await chrome.runtime.sendMessage({type:'clearAllPrompts'});
  load();
});

async function getApiKey() {
  const o = await chrome.storage.local.get('pk_groq_key');
  return o.pk_groq_key || '';
}

async function isOllamaAvailable() {
  try {
    const r = await fetch('http://localhost:11434/api/tags', {method:'GET'});
    return r.ok;
  } catch { return false; }
}

async function callOllama(sys, usr, json=true) {
  const prompt = sys + '\n\n' + usr;
  const body = {
    model: 'gemma:2b',
    prompt,
    stream: false,
    options: {temperature: 0.2}
  };
  if (json) body.format = 'json';
  const r = await fetch('http://localhost:11434/api/generate', {
    method:'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('Ollama '+r.status);
  const j = await r.json();
  const content = (j.response || '').trim();
  if (!json) return content;
  try { return JSON.parse(content); }
  catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch {}
    }
    return {clean: content, results: []};
  }
}

async function callGroq(sys, usr, json=true) {
  const useLocal = await isOllamaAvailable();
  if (useLocal) {
    try { return await callOllama(sys, usr, json); }
    catch { /* fall through to OpenRouter */ }
  }

  const key = await getApiKey();
  if (!key) {
    if (confirm('Не задан API-ключ OpenRouter. Открыть настройки?')) chrome.runtime.openOptionsPage();
    throw new Error('no api key');
  }
  const body = {
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    messages: [{role:'system', content: sys + (json?'\n\nОтвечай ТОЛЬКО валидным JSON, без обёртки в код-блок.':'')}, {role:'user', content: usr}],
    temperature: 0.2
  };
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method:'POST',
    headers: {
      'Content-Type':'application/json',
      'Authorization':'Bearer '+key,
      'HTTP-Referer':'https://promptkeeper.local',
      'X-Title':'PromptKeeper'
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error('OpenRouter '+r.status+': '+await r.text());
  const j = await r.json();
  const content = j.choices?.[0]?.message?.content || '';
  if (!json) return content;
  try { return JSON.parse(content); }
  catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Не удалось распарсить ответ ИИ');
  }
}

$('#ai-search-prompts').addEventListener('click', async () => {
  const q = $('#search-prompts').value.trim();
  if (!q) return alert('Введи запрос');
  const btn = $('#ai-search-prompts'); btn.textContent = '...';
  try {
    const items = state.prompts.map((p,i) => ({i, ai:p.ai, text:(p.text||'').slice(0,400), tags:p.tags}));
    const sys = 'Ищешь релевантные промпты в базе. Верни ТОЛЬКО JSON {"results":[{"i":индекс,"score":0-100,"why":"кратко"}]} — до 10, по убыванию score.';
    const res = await callGroq(sys, `Запрос: ${q}\n\nПромпты:\n${JSON.stringify(items)}`);
    renderPrompts((res.results||[]).map(r => ({...state.prompts[r.i], score:r.score})).filter(Boolean));
  } catch(e) { alert('Ошибка ИИ: '+e.message); }
  btn.textContent = 'ИИ';
});

$('#ai-search-tools').addEventListener('click', async () => {
  const q = $('#search-tools').value.trim();
  if (!q) return alert('Опиши что хочешь сделать');
  const btn = $('#ai-search-tools'); btn.textContent = '...';
  try {
    const items = state.tools.map((t,i) => ({i, name:t.name, desc:t.desc, tags:t.tags}));
    const sys = 'Подбираешь нейросеть под задачу. Верни ТОЛЬКО JSON {"results":[{"i":индекс,"score":0-100,"why":"кратко"}]} — до 5, по убыванию score.';
    const res = await callGroq(sys, `Задача: ${q}\n\nИнструменты:\n${JSON.stringify(items)}`);
    renderTools((res.results||[]).map(r => ({...state.tools[r.i], score:r.score, why:r.why})).filter(Boolean));
  } catch(e) { alert('Ошибка ИИ: '+e.message); }
  btn.textContent = 'ИИ';
});

$('#add-prompt').addEventListener('click', () => openPromptModal(null));
$('#add-tool').addEventListener('click', () => openToolModal(null));

function openPromptModal(item) {
  const isNew = !item;
  $('#modal-title').textContent = isNew ? 'Новый промпт' : 'Промпт';
  $('#modal-body').innerHTML = `
    <label>Текст промпта</label>
    <textarea id="m-text" rows="6">${esc(item?.text||'')}</textarea>
    <label>Нейросеть / источник</label>
    <input id="m-ai" type="text" value="${esc(item?.ai||'')}">
    <label>URL</label>
    <input id="m-url" type="url" value="${esc(item?.url||'')}">
    <label>Теги (через запятую)</label>
    <input id="m-tags" type="text" value="${esc((item?.tags||[]).join(', '))}">
    <div class="modal-actions">
      ${isNew?'':'<button class="danger" id="m-del">Удалить</button>'}
      <button class="ghost" id="m-copy">Копировать</button>
      <button class="primary" id="m-save">${isNew?'Сохранить':'Обновить'}</button>
    </div>`;
  showModal();
  $('#m-save').onclick = async () => {
    const text = $('#m-text').value.trim(); if (!text) return;
    const e = {
      id: item?.id || Date.now()+'-m',
      text, ai: $('#m-ai').value.trim()||'manual', url: $('#m-url').value.trim(),
      tags: $('#m-tags').value.split(',').map(s=>s.trim()).filter(Boolean),
      createdAt: item?.createdAt || new Date().toISOString()
    };
    if (isNew) state.prompts.unshift(e);
    else state.prompts = state.prompts.map(p => p.id===item.id ? e : p);
    await chrome.runtime.sendMessage({type:'setPrompts', list: state.prompts});
    hideModal(); load();
  };
  $('#m-copy').onclick = () => { navigator.clipboard.writeText($('#m-text').value); $('#m-copy').textContent='✓'; };
  if (!isNew) $('#m-del').onclick = async () => {
    if (!confirm('Удалить?')) return;
    await chrome.runtime.sendMessage({type:'deletePrompt', id: item.id});
    hideModal(); load();
  };
}

function openToolModal(item) {
  const isNew = !item;
  $('#modal-title').textContent = isNew ? 'Новая нейросеть' : 'Нейросеть';
  $('#modal-body').innerHTML = `
    <label>Название</label>
    <input id="m-name" type="text" value="${esc(item?.name||'')}">
    <label>URL</label>
    <input id="m-url" type="url" value="${esc(item?.url||'')}">
    <label>Описание</label>
    <textarea id="m-desc" rows="3">${esc(item?.desc||'')}</textarea>
    <label>Теги</label>
    <input id="m-tags" type="text" value="${esc((item?.tags||[]).join(', '))}">
    ${item?.why?`<p class="hint" style="margin-top:8px">${esc(item.why)}</p>`:''}
    <div class="modal-actions">
      ${isNew?'':'<button class="danger" id="m-del">Удалить</button>'}
      ${item?.url?`<button class="ghost" id="m-open">Открыть</button>`:''}
      <button class="primary" id="m-save">${isNew?'Сохранить':'Обновить'}</button>
    </div>`;
  showModal();
  $('#m-save').onclick = async () => {
    const name = $('#m-name').value.trim(); if (!name) return;
    const e = {
      id: item?.id || 'manual-'+Date.now(),
      name, url: $('#m-url').value.trim(), desc: $('#m-desc').value.trim(),
      tags: $('#m-tags').value.split(',').map(s=>s.trim()).filter(Boolean),
      createdAt: item?.createdAt || new Date().toISOString()
    };
    if (isNew) state.tools.unshift(e);
    else state.tools = state.tools.map(t => t.id===item.id ? e : t);
    await chrome.runtime.sendMessage({type:'setTools', list: state.tools});
    hideModal(); load();
  };
  if (item?.url && $('#m-open')) $('#m-open').onclick = () => chrome.tabs.create({url: item.url});
  if (!isNew) $('#m-del').onclick = async () => {
    if (!confirm('Удалить?')) return;
    await chrome.runtime.sendMessage({type:'deleteTool', id: item.id});
    hideModal(); load();
  };
}

function showModal(){ $('#modal').classList.remove('hidden'); }
function hideModal(){ $('#modal').classList.add('hidden'); }
$('#modal-close').onclick = hideModal;
$('#modal').addEventListener('click', e => { if (e.target.id==='modal') hideModal(); });

$('#ai-import').addEventListener('click', async () => {
  const text = $('#import-text').value.trim();
  if (!text) return alert('Вставь текст');
  const mode = document.querySelector('input[name="imp-mode"]:checked').value;
  const btn = $('#ai-import'); btn.textContent = '...'; btn.disabled = true;
  $('#import-result').innerHTML = '';
  try {
    const sys = `Извлекай данные из текста. Верни ТОЛЬКО JSON.
"prompts" → {"prompts":[{"text":"...","ai":"...","tags":["..."]}]}
"tools" → {"tools":[{"name":"...","url":"только реально присутствующие в тексте","desc":"...","tags":["..."]}]}
"both" → оба массива.`;
    const res = await callGroq(sys, `Режим: ${mode}\nТекст:\n"""${text}"""`);
    let pp=0, tt=0;
    if (res.prompts && (mode==='prompts'||mode==='both')) {
      for (const p of res.prompts) {
        state.prompts.unshift({id:'imp-'+Date.now()+Math.random().toString(36).slice(2,5), text:p.text, ai:p.ai||'импорт', url:'', tags:p.tags||[], createdAt:new Date().toISOString()});
        pp++;
      }
      await chrome.runtime.sendMessage({type:'setPrompts', list: state.prompts});
    }
    if (res.tools && (mode==='tools'||mode==='both')) {
      for (const t of res.tools) {
        state.tools.unshift({id:'imp-'+Date.now()+Math.random().toString(36).slice(2,5), name:t.name, url:t.url||'', desc:t.desc||'', tags:t.tags||[], createdAt:new Date().toISOString()});
        tt++;
      }
      await chrome.runtime.sendMessage({type:'setTools', list: state.tools});
    }
    $('#import-result').innerHTML = `<b>Готово.</b> Добавлено: промптов — ${pp}, нейросетей — ${tt}.`;
    load();
  } catch(e) {
    $('#import-result').innerHTML = '<span style="color:#E30000">Ошибка: '+esc(e.message)+'</span>';
  }
  btn.textContent = 'Распарсить через ИИ'; btn.disabled = false;
});

$('#export-all').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({prompts:state.prompts, tools:state.tools, exportedAt:new Date().toISOString()}, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `promptkeeper-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
$('#import-json').addEventListener('click', () => $('#import-file').click());
$('#import-file').addEventListener('change', async (e) => {
  const f = e.target.files[0]; if (!f) return;
  try {
    const j = JSON.parse(await f.text());
    if (Array.isArray(j.prompts)) {
      state.prompts = [...j.prompts, ...state.prompts];
      await chrome.runtime.sendMessage({type:'setPrompts', list: state.prompts});
    }
    if (Array.isArray(j.tools)) {
      state.tools = [...j.tools, ...state.tools];
      await chrome.runtime.sendMessage({type:'setTools', list: state.tools});
    }
    alert('Импорт готов');
    load();
  } catch(err) { alert('Ошибка: '+err.message); }
});

$('#settings-btn').addEventListener('click', () => chrome.runtime.openOptionsPage());

function esc(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDate(iso) { try { return new Date(iso).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'2-digit'}); } catch { return ''; } }
function titleFromText(t) {
  const s = String(t||'').trim().split(/[\r\n.!?]/)[0].trim();
  return s.length > 50 ? s.slice(0,50) + '…' : (s || 'промпт');
}
function linkify(htmlEscaped) {
  return String(htmlEscaped||'').replace(/(https?:\/\/[^\s<]+[^\s.,;:!?<\)\]])/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()" style="color:#0066CC">$1</a>');
}

load();
