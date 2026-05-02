const KP = 'pk_prompts', KT = 'pk_tools';

async function getAll(k){ const o = await chrome.storage.local.get(k); return o[k] || []; }
async function setAll(k, v){ await chrome.storage.local.set({[k]: v}); }

chrome.runtime.onInstalled.addListener(async () => {
  if ((await getAll(KT)).length === 0) {
    try {
      const r = await fetch(chrome.runtime.getURL('data/ai-tools.json'));
      const list = await r.json();
      await setAll(KT, list.map((t,i) => ({id:'seed-'+i, ...t, createdAt:new Date().toISOString()})));
    } catch(e){ console.warn('seed', e); }
  }
  chrome.contextMenus.create({id:'pk-save-selection', title:'PromptKeeper: сохранить выделение как промпт', contexts:['selection']});
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'pk-save-selection' && info.selectionText) {
    const list = await getAll(KP);
    list.unshift({
      id: Date.now()+'-ctx', text: info.selectionText,
      ai: tab?.title || 'unknown', url: tab?.url || '', title: tab?.title || '',
      tags: [], createdAt: new Date().toISOString()
    });
    await setAll(KP, list);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      if (msg.type === 'savePrompt') {
        const list = await getAll(KP); list.unshift(msg.entry);
        await setAll(KP, list); sendResponse({ok:true});
      } else if (msg.type === 'getAll') {
        sendResponse({prompts: await getAll(KP), tools: await getAll(KT)});
      } else if (msg.type === 'setPrompts') { await setAll(KP, msg.list); sendResponse({ok:true}); }
      else if (msg.type === 'setTools')   { await setAll(KT, msg.list); sendResponse({ok:true}); }
      else if (msg.type === 'deletePrompt') {
        const list = (await getAll(KP)).filter(p => p.id !== msg.id);
        await setAll(KP, list); sendResponse({ok:true});
      }
      else if (msg.type === 'deleteTool') {
        const list = (await getAll(KT)).filter(t => t.id !== msg.id);
        await setAll(KT, list); sendResponse({ok:true});
      }
      else if (msg.type === 'clearAllPrompts') { await setAll(KP, []); sendResponse({ok:true}); }
    } catch(e) { sendResponse({ok:false, error:e.message}); }
  })();
  return true;
});
