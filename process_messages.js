const fs = require('fs');
const path = require('path');

async function callOllama(sys, usr) {
  const prompt = sys + '\n\n' + usr;
  const r = await fetch('http://localhost:11434/api/generate', {
    method:'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({model:'gemma:2b', prompt, stream:false, temperature:0.3})
  });
  if (!r.ok) throw new Error('Ollama '+r.status);
  const j = await r.json();
  const content = j.response || '';
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    return {};
  }
}

async function processMessages() {
  const msgFile = 'C:\\PromptKeeper\\_new_tg_messages.txt';
  const content = fs.readFileSync(msgFile, 'utf-8');
  const messages = content.split('---SEPARATOR---').map(m => m.trim()).filter(m => m.length > 30);

  console.log(`Processing ${messages.length} messages...`);

  const prompts = [];
  const tools = [];

  // Process in batches of 5
  for (let i = 0; i < messages.length; i += 5) {
    const batch = messages.slice(i, i + 5);
    const batchText = batch.map((m, j) => `${j+1}. ${m}`).join('\n\n');

    try {
      const sys = `Из этих сообщений извлеки:
1. ПРОМПТЫ - инструкции для ИИ (если есть)
2. НЕЙРОСЕТИ/СЕРВИСЫ - названия AI инструментов упомянутых

Верни JSON: {
  "items":[
    {"type":"prompt", "text":"...", "source":"оригинальное сообщение"},
    {"type":"tool", "name":"...", "desc":"...", "source":"оригинальное сообщение"}
  ]
}`;

      console.log(`Processing batch ${i/5 + 1}/${Math.ceil(messages.length/5)}...`);
      const result = await callOllama(sys, batchText);

      if (result.items && Array.isArray(result.items)) {
        result.items.forEach(item => {
          if (item.type === 'prompt' && item.text) {
            prompts.push({
              id: 'tg-p-' + prompts.length + '-' + Date.now(),
              text: item.text,
              source: item.source || '',
              tags: ['imported', 'telegram'],
              createdAt: new Date().toISOString()
            });
          } else if (item.type === 'tool' && item.name) {
            tools.push({
              id: 'tg-t-' + tools.length + '-' + Date.now(),
              name: item.name,
              desc: item.desc || '',
              source: item.source || '',
              tags: ['imported', 'telegram'],
              createdAt: new Date().toISOString()
            });
          }
        });
      }
    } catch(e) {
      console.error(`Batch ${i/5 + 1} error:`, e.message);
    }

    // Small delay between batches
    await new Promise(r => setTimeout(r, 500));
  }

  const output = { prompts, tools };
  fs.writeFileSync('C:\\PromptKeeper\\imported_tg_new.json', JSON.stringify(output, null, 2));
  console.log(`\nCompleted!`);
  console.log(`Found ${prompts.length} prompts`);
  console.log(`Found ${tools.length} tools`);
  console.log(`Saved to imported_tg_new.json`);
}

processMessages().catch(console.error);
