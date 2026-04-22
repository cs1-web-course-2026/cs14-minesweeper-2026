/**
 * MINESWEEPER GAME LOGIC
 * Внутрішня логіка гри Minesweeper з усіма необхідними структурами даних та функціями
 */

// ============================================================================
// 1. МОДЕЛЮВАННЯ ДАНИХ (DATA LAYER)
// ============================================================================

/**
 * Глобальний об'єкт стану гри
 */
let gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15, // Налаштування складності
  status: 'process', // 'process', 'win', 'lose'
  gameTime: 0, // Час гри у секундах
  timerId: null, // Посилання на ідентифікатор таймера
};

/**
 * Двовимірний масив поля
 * Кожна клітинка: { type, state, neighborMines }
 */
let field = [];

const hasDocument = typeof document !== 'undefined';
const gameBoardElement = hasDocument ? document.getElementById('gameBoard') : null;
const flagCounterElement = hasDocument ? document.getElementById('flagCounter') : null;
const timerDisplayElement = hasDocument ? document.getElementById('timerDisplay') : null;
const restartButton = hasDocument ? document.getElementById('restartBtn') : null;

const neighbourDirections = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],            [0, 1],
  [1, -1],  [1, 0],   [1, 1],
];

function createCell() {
  return {
    type: 'empty',
    state: 'closed',
    neighborMines: 0,
  };
}

function isInsideField(row, col) {
  return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

function getCell(row, col) {
  return isInsideField(row, col) ? field[row][col] : null;
}

// ============================================================================
// 2. ГЕНЕРАЦІЯ ПОЛЯ ТА МІН
// ============================================================================

/**
 * Генерує ігрове поле з розставленими мінами
 * @param {number} rows - Кількість рядків
 * @param {number} cols - Кількість стовпців
 * @param {number} minesCount - Кількість мін
 * @returns {Array<Array<Object>>} Двовимірний масив поля
 */
function generateField(rows, cols, minesCount) {
  // Крок 1: Ініціалізація порожної сітки
  const field = [];
  for (let i = 0; i < rows; i++) {
    field[i] = [];
    for (let j = 0; j < cols; j++) {
      field[i][j] = createCell();
    }
  }

  // Крок 2: Випадкова розстановка мін
  let placedMines = 0;
  while (placedMines < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    // Слідкуємо, щоб дві міни не потрапили в одну клітинку
    if (field[randomRow][randomCol].type === 'empty') {
      field[randomRow][randomCol].type = 'mine';
      placedMines++;
    }
  }

  // Крок 3: Підрахунок сусідніх мін
  countNeighbourMines(field, rows, cols);

  return field;
}

// ============================================================================
// 3. АЛГОРИТМІЧНА ЧАСТИНА (BUSINESS LOGIC)
// ============================================================================

/**
 * Підраховує кількість мін для кожної порожної клітинки
 * @param {Array<Array<Object>>} field - Ігрове поле
 * @param {number} rows - Кількість рядків
 * @param {number} cols - Кількість стовпців
 */
function countNeighbourMines(field, rows, cols) {
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // Обробляємо тільки порожні клітинки
      if (field[i][j].type === 'empty') {
        let count = 0;

        // Перевіряємо всіх 8 сусідів
        for (const [di, dj] of neighbourDirections) {
          const ni = i + di;
          const nj = j + dj;

          // Перевіряємо межі поля
          if (ni >= 0 && ni < rows && nj >= 0 && nj < cols) {
            if (field[ni][nj].type === 'mine') {
              count++;
            }
          }
        }

        field[i][j].neighborMines = count;
      }
    }
  }
}

/**
 * Логіка відкриття клітинки з рекурсією
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 */
function openCell(row, col) {
  // Перевіряємо, чи гра все ще в процесі
  if (gameState.status !== 'process') {
    return;
  }

  const openedCells = openCellRecursive(row, col, new Set());

  if (openedCells > 0) {
    updateView();
  }
}

function openCellRecursive(row, col, visited) {
  if (!isInsideField(row, col)) {
    return 0;
  }

  const cellKey = `${row}:${col}`;
  if (visited.has(cellKey)) {
    return 0;
  }

  visited.add(cellKey);

  const cell = field[row][col];

  if (cell.state === 'opened' || cell.state === 'flagged') {
    return 0;
  }

  cell.state = 'opened';

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    stopTimer();
    revealAllMines();
    return 1;
  }

  let openedCount = 1;

  if (cell.neighborMines === 0) {
    for (const [di, dj] of neighbourDirections) {
      openedCount += openCellRecursive(row + di, col + dj, visited);
    }
  }

  checkWinCondition();
  return openedCount;
}

/**
 * Встановлює або знімає прапорець з клітинки
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 */
function toggleFlag(row, col) {
  // Перевіряємо, чи гра все ще в процесі
  if (gameState.status !== 'process') {
    return;
  }

  // Перевіряємо межі поля
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) {
    return;
  }

  const cell = field[row][col];

  // Якщо клітинка вже відкрита, ставити прапорець не можна
  if (cell.state === 'opened') {
    return;
  }

  // Перемикаємо прапорець
  if (cell.state === 'closed') {
    cell.state = 'flagged';
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
  }

  updateView();
}

/**
 * Перевіряє умову перемоги (всі не-мінні клітинки відкриті)
 */
function checkWinCondition() {
  let openedCount = 0;
  const totalNonMines = gameState.rows * gameState.cols - gameState.minesCount;

  for (let i = 0; i < gameState.rows; i++) {
    for (let j = 0; j < gameState.cols; j++) {
      if (field[i][j].state === 'opened' && field[i][j].type === 'empty') {
        openedCount++;
      }
    }
  }

  if (openedCount === totalNonMines) {
    gameState.status = 'win';
    stopTimer();
    updateView();
  }
}

/**
 * Розкриває всі міни при програші
 */
function revealAllMines() {
  for (let i = 0; i < gameState.rows; i++) {
    for (let j = 0; j < gameState.cols; j++) {
      if (field[i][j].type === 'mine' && field[i][j].state !== 'flagged') {
        field[i][j].state = 'opened';
      }
    }
  }
}

// ============================================================================
// 4. ІНТЕРАКТИВ ТА ТАЙМЕР
// ============================================================================

/**
 * Запускає таймер гри
 */
function startTimer() {
  if (gameState.timerId !== null) {
    return; // Таймер вже працює
  }

  gameState.timerId = setInterval(() => {
    if (gameState.status === 'process') {
      gameState.gameTime++;
      updateHeader();
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

function formatTimerValue(value) {
  return String(value).padStart(3, '0');
}

function getCellDisplayClass(cell) {
  if (cell.state === 'closed') {
    return 'closed';
  }

  if (cell.state === 'flagged') {
    return 'flagged';
  }

  return cell.type === 'mine' ? 'opened mine' : 'opened';
}

function getCellDisplayContent(cell) {
  if (cell.state === 'closed') {
    return '';
  }

  if (cell.state === 'flagged') {
    return '🚩';
  }

  if (cell.type === 'mine') {
    return '💣';
  }

  return cell.neighborMines === 0 ? '' : String(cell.neighborMines);
}

function getNumberClass(neighborMines) {
  return neighborMines > 0 ? `number-${neighborMines}` : '';
}

function updateHeader() {
  if (flagCounterElement) {
    flagCounterElement.textContent = String(gameState.minesCount - getFlagCount()).padStart(2, '0');
  }

  if (timerDisplayElement) {
    timerDisplayElement.textContent = formatTimerValue(gameState.gameTime);
  }

  if (restartButton) {
    restartButton.textContent = gameState.status === 'win' ? '😎' : gameState.status === 'lose' ? '💥' : '🙂';
  }
}

function renderBoard() {
  if (!gameBoardElement) {
    return;
  }

  gameBoardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 42px)`;
  gameBoardElement.style.gridTemplateRows = `repeat(${gameState.rows}, 42px)`;
  gameBoardElement.innerHTML = '';

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = field[row][col];
      const cellElement = document.createElement('button');
      cellElement.type = 'button';
      cellElement.className = `cell ${getCellDisplayClass(cell)}`.trim();
      cellElement.dataset.row = String(row);
      cellElement.dataset.col = String(col);
      cellElement.textContent = getCellDisplayContent(cell);

      const numberClass = getNumberClass(cell.neighborMines);
      if (numberClass) {
        cellElement.classList.add(numberClass);
      }

      cellElement.addEventListener('click', () => openCell(row, col));
      cellElement.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        toggleFlag(row, col);
      });

      gameBoardElement.appendChild(cellElement);
    }
  }
}

function updateView() {
  renderBoard();
  updateHeader();
}

/**
 * Скидає гру до початкового стану
 */
function resetGame() {
  // Зупиняємо таймер
  stopTimer();

  // Скидаємо параметри гри
  gameState.status = 'process';
  gameState.gameTime = 0;
  gameState.timerId = null;

  // Генеруємо нове поле
  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  // Запускаємо новий таймер
  startTimer();

  updateView();
}

/**
 * Отримує кількість розставлених прапорців
 * @returns {number} Кількість прапорців
 */
function getFlagCount() {
  let count = 0;
  for (let i = 0; i < gameState.rows; i++) {
    for (let j = 0; j < gameState.cols; j++) {
      if (field[i][j].state === 'flagged') {
        count++;
      }
    }
  }
  return count;
}

/**
 * Отримує значення для відображення на клітинці
 * @param {number} row - Рядок клітинки
 * @param {number} col - Стовпець клітинки
 * @returns {string} Значення для відображення ('', число, 'М', '💣')
 */
function getCellDisplay(row, col) {
  const cell = field[row][col];

  if (cell.state === 'closed') {
    return ''; // Закрита клітинка
  }

  if (cell.state === 'flagged') {
    return '🚩'; // Прапорець
  }

  // cell.state === 'opened'
  if (cell.type === 'mine') {
    return '💣'; // Міна
  }

  if (cell.neighborMines === 0) {
    return ''; // Порожня клітинка
  }

  return cell.neighborMines; // Число
}

// ============================================================================
// 5. ІНІЦІАЛІЗАЦІЯ ГЕРИ
// ============================================================================

/**
 * Ініціалізує гру при завантаженні сторінки
 */
function initGame() {
  // Генеруємо перше поле
  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  // Запускаємо таймер
  startTimer();

  if (restartButton) {
    restartButton.addEventListener('click', resetGame);
  }

  updateView();

  console.log('✅ Гра ініціалізована!');
  console.log('Стан гри:', gameState);
  console.log('Поле:', field);
}

// Ініціалізуємо гру при завантаженні
document.addEventListener('DOMContentLoaded', initGame);

// ============================================================================
// ЕКСПОРТ ДЛЯ ВИКОРИСТАННЯ В ІНШИХ МОДУЛЯХ (якщо потрібно)
// ============================================================================

// Якщо це Node.js модуль
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    gameState,
    field,
    generateField,
    countNeighbourMines,
    openCell,
    toggleFlag,
    checkWinCondition,
    revealAllMines,
    startTimer,
    stopTimer,
    resetGame,
    getFlagCount,
    getCellDisplay,
    initGame,
  };
}
