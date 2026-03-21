// ===== КОНСТАНТИ =====
const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine'
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged'
};

const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose'
};

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

// Глобальний об'єкт стану гри
const gameState = {
  rows: 0,
  cols: 0,
  minesCount: 0,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  grid: []
};

/**
 * Ініціалізує поле гри з випадковим розставленням мін
 * @param {number} rows - кількість рядків
 * @param {number} cols - кількість стовпців
 * @param {number} minesCount - кількість мін
 */
function generateField(rows, cols, minesCount) {
  // Валідація вхідних даних
  if (minesCount >= rows * cols) {
    console.warn('minesCount не повинно бути >= rows * cols');
    return;
  }

  // Зупиняємо таймер, якщо гра вже йде
  stopTimer();

  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.grid = [];

  // Створюємо порожне поле
  for (let row = 0; row < rows; row++) {
    gameState.grid[row] = [];
    for (let col = 0; col < cols; col++) {
      gameState.grid[row][col] = {
        type: CELL_TYPE.EMPTY,
        state: CELL_STATE.CLOSED,
        neighborMines: 0
      };
    }
  }

  // Випадково розставляємо міни без дублювання
  let placedMines = 0;
  while (placedMines < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    // Якщо клітинка вже містить міну, пропускаємо
    if (gameState.grid[randomRow][randomCol].type === CELL_TYPE.MINE) {
      continue;
    }

    gameState.grid[randomRow][randomCol].type = CELL_TYPE.MINE;
    placedMines++;
  }

  // Обчислюємо кількість сусідніх мін для кожної клітинки
  countNeighbourMines();
}

/**
 * Обчислює кількість мін у сусідніх клітинках для всього поля
 */
function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      // Пропускаємо клітинки з мінами
      if (gameState.grid[row][col].type === CELL_TYPE.MINE) {
        continue;
      }

      let mineCount = 0;

      // Перевіряємо всіх 8 сусідів
      for (const [dRow, dCol] of DIRECTIONS) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        // Перевіряємо межі поля
        if (newRow >= 0 && newRow < gameState.rows &&
            newCol >= 0 && newCol < gameState.cols) {
          if (gameState.grid[newRow][newCol].type === CELL_TYPE.MINE) {
            mineCount++;
          }
        }
      }

      gameState.grid[row][col].neighborMines = mineCount;
    }
  }
}

/**
 * Відкриває клітинку. Якщо міна — гра програна.
 * Якщо навколо 0 мін — рекурсивно відкриває сусідів.
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 */
function openCell(row, col) {
  // Перевіряємо валідність координат
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) {
    return;
  }

  const cell = gameState.grid[row][col];

  // Клітинка вже відкрита або позначена флагом
  if (cell.state !== CELL_STATE.CLOSED) {
    return;
  }

  // Гра вже закінчена
  if (gameState.status !== GAME_STATUS.PROCESS) {
    return;
  }

  // Відкриваємо клітинку
  cell.state = CELL_STATE.OPENED;

  // Гра провалена
  if (cell.type === CELL_TYPE.MINE) {
    gameState.status = GAME_STATUS.LOSE;
    stopTimer();
    revealAllMines();
    return;
  }

  // Рекурсивне відкриття сусідніх порожніх клітинок
  if (cell.neighborMines === 0) {
    for (const [dRow, dCol] of DIRECTIONS) {
      openCell(row + dRow, col + dCol);
    }
  }

  // Перевіряємо умову перемоги
  checkWinCondition();
}

/**
 * Перемикає флаг на клітинці між 'closed' і 'flagged'
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 */
function toggleFlag(row, col) {
  // Перевіряємо валідність координат
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) {
    return;
  }

  const cell = gameState.grid[row][col];

  // Гра вже закінчена
  if (gameState.status !== GAME_STATUS.PROCESS) {
    return;
  }

  // Можна позначити флагом тільки закриту клітинку
  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }
  // Якщо клітинка відкрита, нічого не робимо
}

/**
 * Стартує таймер гри. Збільшує gameTime щосекунди
 */
function startTimer() {
  if (gameState.timerId !== null) {
    return; // Таймер уже працює
  }

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
 * Перевіряє умову перемоги: усі не-мінні клітинки повинні бути відкриті
 */
function checkWinCondition() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.grid[row][col];
      // Якщо порожня клітинка закрита — гра не закінчена
      if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) {
        return;
      }
    }
  }

  // Усі порожні клітинки відкриті — гра виграна
  gameState.status = GAME_STATUS.WIN;
  stopTimer();
}

/**
 * Розкриває всі міни при програші
 */
function revealAllMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.grid[row][col].type === CELL_TYPE.MINE) {
        gameState.grid[row][col].state = CELL_STATE.OPENED;
      }
    }
  }
}

/**
 * Отримує клітинку за координатами
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 * @returns {Object|null} - об'єкт клітинки або null
 */
function getCell(row, col) {
  if (row < 0 || row >= gameState.rows || col < 0 || col >= gameState.cols) {
    return null;
  }
  return gameState.grid[row][col];
}

/**
 * Перезапускає гру
 * @param {number} rows - кількість рядків
 * @param {number} cols - кількість стовпців
 * @param {number} minesCount - кількість мін
 */
function resetGame(rows, cols, minesCount) {
  stopTimer();
  generateField(rows, cols, minesCount);
}

/**
 * Повертає масив координат усіх мін на полі
 * @returns {Array<[number, number]>} - масив координат мін [row, col]
 */
function findMines() {
  const mines = [];
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.grid[row][col].type === CELL_TYPE.MINE) {
        mines.push([row, col]);
      }
    }
  }
  return mines;
}

/**
 * Виводить поле гри у консоль для налагодження
 * '.' - закрита клітинка
 * 'F' - клітинка з прапорцем
 * '*' - відкрита міна
 * число - відкрита клітинка з кількістю сусідніх мін
 * ' ' - відкрита порожня клітинка
 */
function debugPrintField() {
  let output = '';
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.grid[row][col];
      let char = '';

      if (cell.state === CELL_STATE.CLOSED) {
        char = '.';
      } else if (cell.state === CELL_STATE.FLAGGED) {
        char = 'F';
      } else if (cell.state === CELL_STATE.OPENED) {
        if (cell.type === CELL_TYPE.MINE) {
          char = '*';
        } else if (cell.neighborMines > 0) {
          char = cell.neighborMines.toString();
        } else {
          char = ' ';
        }
      }

      output += char;
    }
    output += '\n';
  }
  console.log(output);
}

// Експортуємо для можливості використання в HTML
window.game = {
  generateField,
  openCell,
  toggleFlag,
  startTimer,
  stopTimer,
  resetGame,
  getCell,
  getState: () => gameState,
  findMines,
  debugPrintField
};
