// 1. Моделювання даних (Data Layer)
const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process', // 'process' | 'win' | 'lose'
  gameTime: 0,
  timerId: null,
  field: [] // Тут зберігатиметься стан кожної клітинки
};

// 2. Генерація поля та мін
function generateField(rows, cols, minesCount) {
  const field = [];

  // Створюємо порожню сітку
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty', // 'empty' або 'mine'
        neighborMines: 0,
        state: 'closed' // 'closed', 'opened', 'flagged'
      });
    }
    field.push(row);
  }

  // Випадкова розстановка мін
  let placedMines = 0;
  while (placedMines < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (field[r][c].type !== 'mine') {
      field[r][c].type = 'mine';
      placedMines++;
    }
  }
  return field;
}

// 3. Підрахунок сусідніх мін (Business Logic)
function countNeighbourMines(field) {
  const rows = field.length;
  const cols = field[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (field[r][c].type === 'mine') continue;

      let count = 0;
      // Перевіряємо всіх 8 сусідів
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nr = r + i;
          const nc = c + j;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (field[nr][nc].type === 'mine') count++;
          }
        }
      }
      field[r][c].neighborMines = count;
    }
  }
}

// 4. Логіка відкриття клітинки (openCell) з рекурсією
function openCell(row, col) {
  const cell = gameState.field[row][col];

  // Якщо клітинка вже відкрита або з прапорцем — ігноруємо
  if (cell.state !== 'closed' || gameState.status !== 'process') return;

  // Якщо наступили на міну
  if (cell.type === 'mine') {
    cell.state = 'opened';
    endGame('lose');
    return;
  }

  cell.state = 'opened';

  // Рекурсія: якщо порожня (0 мін навколо), відкриваємо сусідів
  if (cell.neighborMines === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nr = row + i;
        const nc = col + j;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          openCell(nr, nc);
        }
      }
    }
  }
  checkWin();
}

// 5. Робота з прапорцями
function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state === 'opened' || gameState.status !== 'process') return;

  cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
}

// 6. Таймер
function startTimer() {
  // Очищуємо старий таймер, якщо він був
  if (gameState.timerId) clearInterval(gameState.timerId);
  
  gameState.gameTime = 0;
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    // Вивід у консоль для перевірки (як вимагає лаба)
    console.log(`Час гри: ${gameState.gameTime} сек.`);
  }, 1000);
}

function endGame(status) {
  gameState.status = status;
  clearInterval(gameState.timerId);
  console.log(`Гра завершена: ${status === 'win' ? 'ПЕРЕМОГА!' : 'ПОРАЗКА!'}`);
}

function checkWin() {
  let hasClosedEmpty = false;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === 'empty' && gameState.field[r][c].state === 'closed') {
        hasClosedEmpty = true;
        break;
      }
    }
  }
  if (!hasClosedEmpty) endGame('win');
}

// Ініціалізація гри
function initGame() {
  gameState.status = 'process';
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field);
  startTimer();
}

// Запускаємо логіку
initGame();