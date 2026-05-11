/**
 * Minesweeper Game Logic
 * Внутрішня логіка гри Minesweeper з реалізацією структур даних та бізнес-логіки
 */

// ============================================================================
// 1. МОДЕЛЮВАННЯ ДАНИХ (DATA LAYER)
// ============================================================================

/**
 * Константи для статусів гри
 */
const GAME_STATUS = {
  IDLE: 'idle',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

/**
 * Константи для типів клітинок
 */
const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine',
};

/**
 * Константи для станів клітинок
 */
const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

/**
 * Об'єкт стану гри
 * Зберігає глобальні параметри гри та її поточний стан
 */
const gameState = {
  rows: 8,
  cols: 8,
  minesCount: 10,
  status: GAME_STATUS.IDLE,
  gameTime: 0,
  timerId: null,
  flagCount: 0,
  field: [], // Ігрове поле
};

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
        type: CELL_TYPE.EMPTY,
        state: CELL_STATE.CLOSED,
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
  const maxMines = rows * cols;
  const safeMinesCount = Math.max(0, Math.min(minesCount, maxMines));
  let placedMines = 0;

  // Розміщуємо міни випадковим чином
  while (placedMines < safeMinesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    // Перевіряємо, чи не міна вже в цьому місці
    if (field[randomRow][randomCol].type !== CELL_TYPE.MINE) {
      field[randomRow][randomCol].type = CELL_TYPE.MINE;
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
  let mineCount = 0;
  const rows = field.length;
  const cols = field[0].length;

  // Перевіряємо всі 8 сусідів
  for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
    for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
      // Пропускаємо саму клітинку
      if (directionalRow === 0 && directionalCol === 0) continue;

      const neighbourRow = row + directionalRow;
      const neighbourCol = col + directionalCol;

      // Перевіряємо, чи координати в межах поля
      if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
        if (field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) {
          mineCount++;
        }
      }
    }
  }

  return mineCount;
}

/**
 * Обраховує сусідних мін для всіх пустих клітинок
 * @param {Array} field - Ігрове поле
 */
function calculateAllNeighbourMines(field) {
  for (let row = 0; row < field.length; row++) {
    for (let col = 0; col < field[row].length; col++) {
      if (field[row][col].type === CELL_TYPE.EMPTY) {
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
  for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
    for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
      const neighbourRow = row + directionalRow;
      const neighbourCol = col + directionalCol;

      // Перевіряємо межі поля
      if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
        const cell = field[neighbourRow][neighbourCol];

        // Не відкриваємо закриті прапорці та міни
        if (cell.state === CELL_STATE.FLAGGED || cell.type === CELL_TYPE.MINE) continue;

        // Якщо клітинка ще закрита, відкриваємо її
        if (cell.state === CELL_STATE.CLOSED) {
          cell.state = CELL_STATE.OPENED;

          // Якщо це порожня клітинка, рекурсивно відкриваємо її сусідів
          if (cell.neighborMines === 0) {
            openNeighbours(neighbourRow, neighbourCol, field, visited);
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
 * @returns {void}
 */
function openCell(row, col) {
  // Перевіряємо, чи гра ще не закінчилася
  if (gameState.status !== GAME_STATUS.PLAYING) return;

  const cell = getCell(row, col);
  if (cell === null) return;

  // Якщо клітинка вже відкрита або має прапорець, нічого не робимо
  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

  // Якщо натиснули на міну
  if (cell.type === CELL_TYPE.MINE) {
    gameState.status = GAME_STATUS.LOST;
    cell.state = CELL_STATE.OPENED;
    stopTimer();
    revealAllMines();
    return;
  }

  // Відкриваємо клітинку
  cell.state = CELL_STATE.OPENED;

  // Якщо клітинка порожня, рекурсивно відкриваємо сусідів
  if (cell.neighborMines === 0) {
    openNeighbours(row, col, gameState.field);
  }

  // Перевіряємо умову перемоги
  checkWinCondition();
}

/**
 * Перевіряє, чи виконана умова перемоги
 * Гра виграна, якщо всі безпечні клітинки відкриті
 */
function checkWinCondition() {
  let notOpenedCount = 0;
  let notOpenedMinesCount = 0;

  for (let row = 0; row < gameState.field.length; row++) {
    for (let col = 0; col < gameState.field[row].length; col++) {
      const cell = gameState.field[row][col];

      if (cell.state !== CELL_STATE.OPENED) {
        notOpenedCount++;

        if (cell.type === CELL_TYPE.MINE) {
          notOpenedMinesCount++;
        }
      }
    }
  }

  // Гра виграна, якщо не відкриті тільки міни
  if (notOpenedCount === notOpenedMinesCount && notOpenedMinesCount > 0) {
    gameState.status = GAME_STATUS.WON;
    stopTimer();
    revealAllMines();
  }
}

/**
 * Розкриває всі міни при закінченні гри
 */
function revealAllMines() {
  for (let row = 0; row < gameState.field.length; row++) {
    for (let col = 0; col < gameState.field[row].length; col++) {
      const cell = gameState.field[row][col];
      if (cell.type === CELL_TYPE.MINE && cell.state !== CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.OPENED;
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
 * @returns {void}
 */
function toggleFlag(row, col) {
  // Перевіряємо, чи гра ще не закінчилася
  if (gameState.status !== GAME_STATUS.PLAYING) return;

  const cell = getCell(row, col);
  if (cell === null) return;

  // Не можна ставити прапорець на відкриту клітинку
  if (cell.state === CELL_STATE.OPENED) return;

  // Переключаємо прапорець
  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
    gameState.flagCount++;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
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
  gameState.status = GAME_STATUS.PLAYING;
  gameState.flagCount = 0;
  resetTimer();

  // Генеруємо нове поле
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  // Обраховуємо сусідних мін
  calculateAllNeighbourMines(gameState.field);
}

/**
 * Отримує інформацію про клітинку
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 * @returns {Object} Об'єкт клітинки
 */
function getCell(row, col) {
  if (
    gameState.field.length === 0 ||
    row < 0 ||
    row >= gameState.field.length ||
    col < 0 ||
    col >= gameState.field[0].length
  ) {
    return null;
  }
  return gameState.field[row][col];
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
    GAME_STATUS,
    CELL_TYPE,
    CELL_STATE,
    gameState,
    initializeGame,
    openCell,
    toggleFlag,
    getCell,
    getGameStatus,
    formatTime,
    startTimer,
    stopTimer,
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
