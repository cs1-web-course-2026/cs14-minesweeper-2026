# Інструкція з запуску та демонстрації гри

## Швидкий старт

### Варіант 1: HTTP Server (Mac)
```bash
cd /Users/maksim2605bgmail.com/Documents/БеседінМаксим/cs14-minesweeper-2026/BesedinMaxym
python3 -m http.server 8000
```
Потім відкрити: `http://localhost:8000`

### Варіант 2: Live Server (VS Code)
1. Встановити розширення "Live Server"
2. Клікнути "Go Live" у правому нижньому куті

### Варіант 3: npm http-server
```bash
cd /Users/maksim2605bgmail.com/Documents/БеседінМаксим/cs14-minesweeper-2026/BesedinMaxym
npx http-server
```

---

## Тестування в браузерній консолі

### Відкрити консоль
- Mac: `Cmd + Option + J`
- Windows: `Ctrl + Shift + J`

### Тестові команди

```javascript
// 1. Новая игра (9x9 с 10 минами)
game.resetGame(9, 9, 10);
game.startTimer();

// 2. Подивись стан гри
game.getState();

// 3. Відкрий клітинку та спостерігай рекурсію
game.openCell(4, 4);

// 4. Уклади флаг
game.toggleFlag(0, 0);

// 5. Перевір конкретну клітинку
game.getCell(4, 4);

// 6. Скільки мін на полі?
const state = game.getState();
let mineCount = 0;
for (let r = 0; r < state.rows; r++) {
  for (let c = 0; c < state.cols; c++) {
    if (state.grid[r][c].type === 'mine') mineCount++;
  }
}
console.log('Мін на полі:', mineCount); // повинно бути 10

// 7. Таблиця поля (компактний вигляд)
console.table(game.getState().grid);
```

---

## Демонстрація функцій

### Генерація поля
```javascript
// Малу дошку для тестування
game.resetGame(3, 3, 1);
console.table(game.getState().grid);
// Видно: 9 клітинок, 1 міна, neighborMines обчислено
```

### Рекурсивне відкриття
```javascript
game.resetGame(5, 5, 1);
// Клік на пусту клітинку спричиняє рекурсивне відкриття сусідніх
game.openCell(0, 0); 
console.log('Вітриті клітинки:', 
  game.getState().grid.flat().filter(c => c.state === 'opened').length);
```

### Програш
```javascript
game.resetGame(3, 3, 1);
// Знайти міну та клікнути
const state = game.getState();
for (let r = 0; r < 3; r++) {
  for (let c = 0; c < 3; c++) {
    if (state.grid[r][c].type === 'mine') {
      game.openCell(r, c);
      console.log('Статус гри:', game.getState().status); // 'lose'
      return;
    }
  }
}
```

### Таймер
```javascript
game.resetGame(3, 3, 1);
console.log('Час до старту:', game.getState().gameTime); // 0
game.startTimer();
setTimeout(() => {
  console.log('Час через 2 сек:', game.getState().gameTime); // ~2
}, 2000);
```

---

## Структура файлів

```
BesedinMaxym/
├── index.html        # HTML розмітка з демо-полем
├── script.js         # Основна логіка гри (275 строк)
├── style.css         # Стилізація (готична тема)
├── REPORT.md         # Детальний звіт (цей файл)
└── INSTRUCTIONS.md   # Інструкція з запуску
```

---

## Що реалізовано

### Data Layer
- ✅ gameState об'єкт з усіма параметрами
- ✅ Двовимірний масив grid
- ✅ Модель клітинки (type, state, neighborMines)

### Business Logic
- ✅ generateField() - генерація та розстановка мін
- ✅ countNeighbourMines() - обчислення сусідніх мін
- ✅ openCell() - відкриття з рекурсією та перевіркою перемоги
- ✅ toggleFlag() - системя прапорців
- ✅ startTimer() / stopTimer() - таймер
- ✅ checkWinCondition() - логіка перемоги

### Додаткові функції
- ✅ revealAllMines() - показ мін при програші
- ✅ getCell() - отримання клітинки
- ✅ resetGame() - перезапуск
- ✅ window.game - експорт для HTML

---

## Якість коду

### DRY
- Масив directions визначено один раз (константа)
- Валідація винесена в окремі перевірки

### KISS
- Код простий та зрозумілий
- Без складних конструкцій
- Логіка розділена за відповідальністю

### Чистота
- JSDoc для кожної функції
- Інлайн коментарі для складної логіки
- Зрозумілі назви (mineCount, randomRow, directions)
- Правильна обробка помилок

---

## Примітка щодо інтеграції з DOM

HTML/CSS готові, але для повної гри потрібно:
1. Підключити script.js до index.html
2. Обробити клацання на клітинках (ліва = openCell, права = toggleFlag)
3. Оновлювати UI при змінах стану

Основна логіка в script.js повністю готова та не залежить від DOM.
