# 🚀 PromptKeeper — Как запустить

## Быстрый старт (рекомендуется)

### Способ 1: Полностью автоматический (самый простой)

**Двойной клик:**
```
C:\PromptKeeper\launch-promptkeeper.bat
```

или в PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File C:\PromptKeeper\launch-promptkeeper.ps1
```

**Что происходит автоматически:**
1. ✓ Проверяет, запущена ли Ollama
2. ✓ Если нет → запускает Ollama в фоне
3. ✓ Ждёт, пока Ollama будет готова
4. ✓ Открывает PromptKeeper в браузере

---

## Если нужен полный контроль

### Способ 2: Запустить Ollama вручную

1. **Откройте PowerShell** (Win + X → PowerShell)

2. **Запустите Ollama:**
```powershell
ollama serve
```

3. **В отдельном окне PowerShell откройте веб-приложение:**
```powershell
start "C:\PromptKeeper\webapp\index.html"
```

4. **Или загрузите расширение:**
   - Откройте `chrome://extensions/` (или `browser://extensions/` в Яндексе)
   - Включите "Режим разработчика"
   - Нажмите "Загрузить распакованное расширение"
   - Выберите папку `C:\PromptKeeper\extension`

---

## Структура файлов

```
C:\PromptKeeper\
├── launch-promptkeeper.ps1      ← Универсальный лаунчер (PowerShell)
├── launch-promptkeeper.bat      ← Простой лаунчер (батник)
├── webapp/
│   └── index.html               ← Веб-приложение
├── extension/
│   └── [расширение для браузера]
└── start-ollama.ps1             ← Если нужно запустить Ollama отдельно
```

---

## Что использует PromptKeeper

### 🤖 Ollama (локально, БЫСТРО)
- Модель: `gemma:2b`
- Работает на `localhost:11434`
- **Скорость:** ~2-3 секунды на запрос
- **Требует:** ~2-4 GB RAM
- **Статус:** Зелёный ✓ в интерфейсе

### ☁️ OpenRouter API (облачно, если нет Ollama)
- Модель: `meta-llama/llama-3.3-70b-instruct:free`
- Требует API ключ
- **Скорость:** ~5-10 секунд на запрос
- **Статус:** Красный ⚠ в интерфейсе

---

## Если Ollama не запускается

### Проверка 1: Ollama установлена?
```powershell
ollama --version
```

Если ошибка — установите с https://ollama.ai

### Проверка 2: Порт 11434 занят?
```powershell
netstat -ano | findstr :11434
```

Если виден процесс — значит Ollama уже запущена ✓

### Проверка 3: Убить все процессы Ollama и перезапустить
```powershell
taskkill /IM ollama.exe /F
ollama serve
```

---

## Опции запуска

### Запустить с другой моделью Gemma

Отредактируйте в коде `webapp/index.html` и `extension/popup.js`:

```javascript
// Найти строку:
body: JSON.stringify({model:'gemma:2b', ...

// Заменить на:
body: JSON.stringify({model:'gemma:7b', ...  // Более мощная модель
```

Затем скачайте модель:
```powershell
ollama pull gemma:7b
```

---

## Горячие клавиши и команды

| Действие | Команда |
|----------|---------|
| Запустить PromptKeeper | `launch-promptkeeper.ps1` |
| Остановить Ollama | `taskkill /IM ollama.exe /F` |
| Проверить статус Ollama | `curl http://localhost:11434/api/tags` |
| Очистить кэш браузера | F12 → Storage → Clear All |

---

## Решение проблем

| Проблема | Решение |
|----------|---------|
| "Ollama не запущена" | Запустите `launch-promptkeeper.ps1` |
| "Ошибка API ключа" | Добавьте OpenRouter ключ в Параметры |
| "Промпты не сохраняются" | Проверьте Storage → IndexedDB в DevTools |
| "Расширение не видна кнопка" | Перезагрузите расширение в `chrome://extensions/` |
| "Медленные ответы ИИ" | Проверьте, запущена ли Ollama (зелёный статус) |

---

## Поддерживаемые браузеры

- ✓ **Chrome** 90+
- ✓ **Яндекс.Браузер** (на базе Chromium)
- ✓ **Edge** 90+
- ✓ **Opera** 76+
- ⚠ Firefox (V3 расширения ещё не поддерживаются)

---

## Производительность

| Операция | Ollama (локально) | OpenRouter (облачно) |
|----------|------------------|----------------------|
| Поиск промптов (ИИ) | ~2-3 сек | ~5-10 сек |
| Очистка промпта | ~1-2 сек | ~3-5 сек |
| Импорт текста | ~2-5 сек | ~5-10 сек |
| Подбор нейросети | ~2-3 сек | ~5-10 сек |

**Рекомендуется:** Используйте Ollama для лучшей скорости!

---

## Видео гайд

[Если создадите видео, можно ссылку сюда]

---

**Готовы?** Запустите:
```powershell
powershell -ExecutionPolicy Bypass -File C:\PromptKeeper\launch-promptkeeper.ps1
```

Enjoy! 🎉
