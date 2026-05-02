(() => {
  if (window.__pkInjected) return;
  window.__pkInjected = true;

  const SITE_MAP = {
    'chatgpt.com':'ChatGPT','chat.openai.com':'ChatGPT','claude.ai':'Claude',
    'gemini.google.com':'Gemini','aistudio.google.com':'Google AI Studio',
    'chat.mistral.ai':'Le Chat (Mistral)','grok.com':'Grok','chat.qwenlm.ai':'Qwen',
    'chat.deepseek.com':'DeepSeek','yiyan.baidu.com':'Baidu Yiyan','you.com':'You.com',
    'perplexity.ai':'Perplexity','www.perplexity.ai':'Perplexity','poe.com':'Poe',
    'copilot.microsoft.com':'Copilot','huggingface.co':'HuggingChat'
  };
  const aiName = SITE_MAP[location.hostname] || location.hostname;

  function findPromptText() {
    const selectors = [
      'textarea#prompt-textarea',
      'div[contenteditable="true"][data-virtualkeyboard]',
      'div.ProseMirror[contenteditable="true"]',
      'rich-textarea textarea',
      'textarea[placeholder*="Ask"]','textarea[placeholder*="Спросить"]',
      'textarea[placeholder*="Введите"]',
      'div[contenteditable="true"]','textarea'
    ];
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const txt = (el.value || el.innerText || '').trim();
        if (txt.length > 3) return txt;
      }
    }
    return window.getSelection().toString().trim() || '';
  }
  function findLastUserMessage() {
    const sels = ['div[data-message-author-role="user"]','div[data-testid*="user"]','article[data-author="user"]','.message.user'];
    for (const s of sels) {
      const n = document.querySelectorAll(s);
      if (n.length) return n[n.length-1].innerText.trim();
    }
    return '';
  }
  function toast(msg, ok=true) {
    const old = document.getElementById('pk-toast'); if (old) old.remove();
    const t = document.createElement('div'); t.id = 'pk-toast'; t.textContent = msg;
    if (!ok) t.style.background = '#dc2626';
    document.body.appendChild(t); setTimeout(() => t.remove(), 2800);
  }

  const btn = document.createElement('button');
  btn.id = 'pk-save-btn'; btn.textContent = 'Сохранить промпт';
  btn.title = 'PromptKeeper';
  btn.addEventListener('click', async (e) => {
    e.stopPropagation(); e.preventDefault();
    let text = findPromptText() || findLastUserMessage();
    if (!text) {
      const m = prompt('Не нашёл промпт автоматом. Вставь сюда:'); if (!m) return;
      text = m;
    }
    const tagsInput = prompt('Теги через запятую (необязательно):', '');
    const tags = (tagsInput||'').split(',').map(s=>s.trim()).filter(Boolean);
    const entry = {
      id: Date.now()+'-'+Math.random().toString(36).slice(2,7),
      text, ai: aiName, url: location.href, title: document.title,
      tags, createdAt: new Date().toISOString()
    };
    chrome.runtime.sendMessage({type:'savePrompt', entry}, (r) => {
      if (r && r.ok) {
        btn.classList.add('saved'); btn.textContent = 'Сохранено ✓';
        toast(`Сохранено в PromptKeeper (${aiName})`);
        setTimeout(() => { btn.classList.remove('saved'); btn.textContent = 'Сохранить промпт'; }, 1800);
      } else toast('Ошибка сохранения', false);
    });
  });
  document.body.appendChild(btn);
})();
