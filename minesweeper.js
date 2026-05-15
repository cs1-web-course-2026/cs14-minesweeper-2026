/**
 * Minesweeper Game Logic
 * Внутрішня логіка гри Minesweeper з реалізацією структур даних та бізнес-логіки
 */

// ============================================================================
// 1. МОДЕЛЮВАННЯ ДАНИХ (DATA LAYER)
// ============================================================================

/**
 * Об'єкт стану гри
 * Зберігає глобальні параметри гри та її поточний стан
 */
const gameState = {
  rows: 8,
  cols: 8,
  minesCount: 10,
  status: 'process', // 'process' | 'win' | 'lose'
  gameTime: 0,
  timerId: null,
  flagCount: 0, // Кількість встановлених прапорців
  hitMine: null, // {row, col} якщо вибух відбувся
};

/**
 * Двовимірний масив ігрового поля
 * Кожна клітинка має структуру:
 * {
 *   type: 'empty' | 'mine',
 *   state: 'closed' | 'opened' | 'flagged',
 *   neighborMines: 0-8
 * }
 */
let gameField = [];

// ============================================================================
// 2. ГЕНЕРАЦІЯ ПОЛЯ ТА МІН
// ============================================================================

/**
 * Ініціалізує порожне ігрове поле
 * @param {number} rows - Кількість рядків
 * @param {number} cols - Кількість стовпців
 * @returns {Array} Двовимірний масив з пустими клітинками
 */
function initializeField(rows, cols) {
  const field = [];
  for (let row = 0; row < rows; row++) {
    field[row] = [];
    for (let col = 0; col < cols; col++) {
      field[row][col] = {
        type: 'empty',
        state: 'closed',
        neighborMines: 0,
      };
    }
  }
  return field;
}

/**
 * Генерує ігрове поле з випадково розміщеними мінами
 * @param {number} rows - Кількість рядків
 * @param {number} cols - Кількість стовпців
 * @param {number} minesCount - Кількість мін для розміщення
 * @returns {Array} Ігрове поле з мінами
 */
function generateField(rows, cols, minesCount) {
  const field = initializeField(rows, cols);
  let placedMines = 0;

  // Розміщуємо міни випадковим чином
  while (placedMines < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    // Перевіряємо, чи не міна вже в цьому місці
    if (field[randomRow][randomCol].type !== 'mine') {
      field[randomRow][randomCol].type = 'mine';
      placedMines++;
    }
  }

  return field;
}

/**
 * Підраховує кількість мін у сусідніх клітинках
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 * @param {Array} field - Ігрове поле
 * @returns {number} Кількість мін у сусідніх клітинках
 */
function countNeighbourMines(row, col, field) {
  let count = 0;
  const rows = field.length;
  const cols = field[0].length;

  // Перевіряємо всі 8 сусідів
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      // Пропускаємо саму клітинку
      if (dx === 0 && dy === 0) continue;

      const newRow = row + dx;
      const newCol = col + dy;

      // Перевіряємо, чи координати в межах поля
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        if (field[newRow][newCol].type === 'mine') {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Обраховує сусідних мін для всіх пустих клітинок
 * @param {Array} field - Ігрове поле
 */
function calculateAllNeighbourMines(field) {
  for (let row = 0; row < field.length; row++) {
    for (let col = 0; col < field[row].length; col++) {
      if (field[row][col].type === 'empty') {
        field[row][col].neighborMines = countNeighbourMines(row, col, field);
      }
    }
  }
}

// ============================================================================
// 3. АЛГОРИТМІЧНА ЧАСТИНА (BUSINESS LOGIC)
// ============================================================================

/**
 * Рекурсивно відкриває сусідні клітинки для пустої клітинки
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 * @param {Array} field - Ігрове поле
 * @param {Set} visited - Множина вже оброблених клітинок (для запобігання циклів)
 */
function openNeighbours(row, col, field, visited = new Set()) {
  const rows = field.length;
  const cols = field[0].length;
  const key = `${row},${col}`;

  // Пропускаємо, якщо вже обробили цю клітинку
  if (visited.has(key)) return;
  visited.add(key);

  // Перевіряємо всіх 8 сусідів
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const newRow = row + dx;
      const newCol = col + dy;

      // Перевіряємо межі поля
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        const cell = field[newRow][newCol];

        // Не відкриваємо закриті прапорці та міни
        if (cell.state === 'flagged' || cell.type === 'mine') continue;

        // Якщо клітинка ще закрита, відкриваємо її
        if (cell.state === 'closed') {
          cell.state = 'opened';

          // Якщо це порожня клітинка, рекурсивно відкриваємо її сусідів
          if (cell.neighborMines === 0) {
            openNeighbours(newRow, newCol, field, visited);
          }
        }
      }
    }
  }
}

/**
 * Логіка відкриття клітинки
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 */
function openCell(row, col) {
  // Перевіряємо, чи гра ще не закінчилася
  if (gameState.status !== 'process') return;

  const cell = gameField[row][col];

  // Якщо клітинка вже відкрита або має прапорець, нічого не робимо
  if (cell.state === 'opened' || cell.state === 'flagged') return;

  // Якщо натиснули на міну
  if (cell.type === 'mine') {
    gameState.status = 'lose';
    gameState.hitMine = { row, col };
    cell.state = 'opened';
    stopTimer();
    revealAllMines();
    return;
  }

  // Відкриваємо клітинку
  cell.state = 'opened';

  // Якщо клітинка порожня, рекурсивно відкриваємо сусідів
  if (cell.neighborMines === 0) {
    openNeighbours(row, col, gameField);
  }

  // Перевіряємо умову перемоги
  checkWinCondition();
}

/**
 * Перевіряє, чи виконана умова перемоги
 * Гра виграна, якщо всі небезпечні клітинки відкриті
 */
function checkWinCondition() {
  let closedCount = 0;
  let closedMinesCount = 0;

  for (let row = 0; row < gameField.length; row++) {
    for (let col = 0; col < gameField[row].length; col++) {
      const cell = gameField[row][col];
      if (cell.state === 'closed') {
        closedCount++;
        if (cell.type === 'mine') {
          closedMinesCount++;
        }
      }
    }
  }

  // Гра виграна, якщо закриті тільки міни
  if (closedCount === closedMinesCount && closedMinesCount > 0) {
    gameState.status = 'win';
    stopTimer();
    revealAllMines();
  }
}

/**
 * Розкриває всі міни при закінченні гри
 */
function revealAllMines() {
  for (let row = 0; row < gameField.length; row++) {
    for (let col = 0; col < gameField[row].length; col++) {
      const cell = gameField[row][col];
      if (cell.type === 'mine' && cell.state !== 'flagged') {
        cell.state = 'opened';
      }
    }
  }
}

// ============================================================================
// 4. ІНТЕРАКТИВ ТА ТАЙМЕР
// ============================================================================

/**
 * Переключає прапорець на клітинці
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 */
function toggleFlag(row, col) {
  // Перевіряємо, чи гра ще не закінчилася
  if (gameState.status !== 'process') return;

  const cell = gameField[row][col];

  // Не можна ставити прапорець на відкриту клітинку
  if (cell.state === 'opened') return;

  // Переключаємо прапорець
  if (cell.state === 'closed') {
    cell.state = 'flagged';
    gameState.flagCount++;
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
    gameState.flagCount--;
  }
}

/**
 * Запускає таймер гри
 */
function startTimer() {
  if (gameState.timerId !== null) return; // Таймер вже запущений

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    // Если есть UI, обновляем отображение времени
    if (typeof updateDisplays === 'function') {
      try { updateDisplays(); } catch (e) { /* ignore */ }
    }
  }, 1000);
}

/**
 * Зупиняє таймер гри
 */
function stopTimer() {
  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

/**
 * Скидає таймер на нуль
 */
function resetTimer() {
  stopTimer();
  gameState.gameTime = 0;
}

// ============================================================================
// 5. ІНІЦІАЛІЗАЦІЯ ТА КЕРУВАННЯ ГРОЮ
// ============================================================================

/**
 * Ініціалізує нову гру
 */
function initializeGame() {
  // Скидаємо стан гри
  gameState.status = 'process';
  gameState.flagCount = 0;
  resetTimer();

  // Генеруємо нове поле
  gameField = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  // Обраховуємо сусідних мін
  calculateAllNeighbourMines(gameField);

  // Запускаємо таймер
  startTimer();
}

/**
 * Отримує інформацію про клітинку
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 * @returns {Object} Об'єкт клітинки
 */
function getCell(row, col) {
  if (
    row < 0 ||
    row >= gameField.length ||
    col < 0 ||
    col >= gameField[0].length
  ) {
    return null;
  }
  return gameField[row][col];
}

/**
 * Отримує поточний стан гри
 * @returns {Object} Об'єкт з інформацією про стан гри
 */
function getGameStatus() {
  return {
    status: gameState.status,
    time: gameState.gameTime,
    flags: gameState.flagCount,
    minesCount: gameState.minesCount,
  };
}

/**
 * Форматує час у формат MM:SS
 * @param {number} seconds - Кількість секунд
 * @returns {string} Форматований час
 */
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// ============================================================================
// ЭКСПОРТ ДЛЯ ВИКОРИСТАННЯ
// ============================================================================

// Якщо цей файл використовується як модуль, експортуємо функції
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    gameField,
    initializeGame,
    openCell,
    toggleFlag,
    getCell,
    getGameStatus,
    formatTime,
    generateField,
    countNeighbourMines,
    calculateAllNeighbourMines,
  };
}

// ============================================================================
// ДЕМОНСТРАЦІЯ РОБОТИ
// ============================================================================

// Розкоментуйте для тестування логіки
/*
console.log('=== Ініціалізація гри ===');
initializeGame();
console.log('Стан гри:', getGameStatus());
console.log('Ігрове поле:', gameField);

console.log('\n=== Відкриття клітинки ===');
openCell(0, 0);
console.log('Після відкриття (0, 0):', getCell(0, 0));

console.log('\n=== Розміщення прапорця ===');
toggleFlag(1, 1);
console.log('Після встановлення прапорця (1, 1):', getCell(1, 1));
console.log('Кількість прапорців:', gameState.flagCount);
*/

// ============================================================================
// DOM Integration: рендер поля, обробники подій, оновлення UI
// ============================================================================

// Безопасно вызываем только в браузере
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const fieldEl = document.getElementById('field');
  const timerEl = document.getElementById('timer');
  const flagsEl = document.getElementById('flags');
  const newGameBtn = document.getElementById('newGame');

  function renderField() {
    if (!fieldEl) return;

    // Обновляем колонку в соответствии с размерами поля
    fieldEl.style.gridTemplateColumns = `repeat(${gameState.cols}, minmax(0, 1fr))`;
    fieldEl.innerHTML = '';

    for (let row = 0; row < gameState.rows; row++) {
      for (let col = 0; col < gameState.cols; col++) {
        const cell = gameField[row][col];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cell';
        btn.dataset.row = String(row);
        btn.dataset.col = String(col);

        // ARIA
        btn.setAttribute('aria-label', 'Closed cell');

        if (cell.state === 'flagged') {
          btn.classList.add('cell--flag');
          btn.setAttribute('aria-label', 'Flagged cell');
        }

        if (cell.state === 'opened') {
          btn.classList.add('cell--open');

          if (cell.type === 'mine') {
            // Помічена міна, яка вибухнула
            if (gameState.hitMine && gameState.hitMine.row === row && gameState.hitMine.col === col) {
              btn.classList.add('cell--mine-hit');
              btn.setAttribute('aria-label', 'Mine hit');
            } else {
              btn.classList.add('cell--mine');
              btn.setAttribute('aria-label', 'Mine');
            }
          } else if (cell.neighborMines > 0) {
            const n = cell.neighborMines;
            btn.classList.add(`n${n}`);
            btn.textContent = String(n);
            btn.setAttribute('aria-label', `Opened cell ${n}`);
          } else {
            btn.setAttribute('aria-label', 'Opened empty cell');
          }
        }

        fieldEl.appendChild(btn);
      }
    }
  }

  function updateDisplays() {
    if (timerEl) timerEl.textContent = formatTime(gameState.gameTime);
    if (flagsEl) {
      const remaining = Math.max(0, gameState.minesCount - gameState.flagCount);
      flagsEl.textContent = String(remaining).padStart(3, '0');
    }

    if (newGameBtn) {
      if (gameState.status === 'win') {
        newGameBtn.textContent = 'WIN';
      } else if (gameState.status === 'lose') {
        newGameBtn.textContent = 'LOSE';
      } else {
        newGameBtn.textContent = 'NEW';
      }
    }
  }

  // Делегирование кликов
  if (fieldEl) {
    fieldEl.addEventListener('click', (ev) => {
      const btn = ev.target.closest('.cell');
      if (!btn) return;
      const row = Number(btn.dataset.row);
      const col = Number(btn.dataset.col);

      // Игровая логика
      openCell(row, col);
      renderField();
      updateDisplays();

      if (gameState.status !== 'process') {
        setTimeout(() => {
          if (gameState.status === 'win') alert('Поздравляем! Вы выиграли.');
          else if (gameState.status === 'lose') alert('Упс! Вы подорвались.');
        }, 50);
      }
    });

    // Правый клик — установка/снятие флага
    fieldEl.addEventListener('contextmenu', (ev) => {
      const btn = ev.target.closest('.cell');
      if (!btn) return;
      ev.preventDefault();
      const row = Number(btn.dataset.row);
      const col = Number(btn.dataset.col);

      toggleFlag(row, col);
      renderField();
      updateDisplays();
    });
  }

  // Заблокировать стандартное контекстное меню в пределах поля
  document.addEventListener('contextmenu', (ev) => {
    if (ev.target.closest && ev.target.closest('#field')) ev.preventDefault();
  });

  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      gameState.hitMine = null;
      initializeGame();
      renderField();
      updateDisplays();
    });
  }

  // Инициализация при загрузке DOM
  document.addEventListener('DOMContentLoaded', () => {
    // Если поле ещё не сгенерировано логически — инициализируем
    if (!gameField || gameField.length === 0) initializeGame();
    renderField();
    updateDisplays();
  });
}
