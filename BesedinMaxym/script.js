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

// Глобальний об'єкт стану гри (тільки для консольних демонстрацій і UI інтеграції)
let gameState = null;

/**
 * Ініціалізує поле гри з випадковим розставленням мін
 * @param {number} rows - кількість рядків
 * @param {number} cols - кількість стовпців
 * @param {number} minesCount - кількість мін
 * @returns {Object} - новий об'єкт стану гри
 */
function generateField(rows, cols, minesCount) {
  // Валідація вхідних даних
  if (minesCount >= rows * cols) {
    console.warn('minesCount не повинно бути >= rows * cols');
    return null;
  }

  // Створюємо новий стан
  const state = {
    rows: rows,
    cols: cols,
    minesCount: minesCount,
    status: GAME_STATUS.PROCESS,
    gameTime: 0,
    timerId: null,
    grid: []
  };

  // Створюємо порожне поле
  for (let row = 0; row < rows; row++) {
    state.grid[row] = [];
    for (let col = 0; col < cols; col++) {
      state.grid[row][col] = {
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
    if (state.grid[randomRow][randomCol].type === CELL_TYPE.MINE) {
      continue;
    }

    state.grid[randomRow][randomCol].type = CELL_TYPE.MINE;
    placedMines++;
  }

  // Обчислюємо кількість сусідніх мін для кожної клітинки
  return countNeighbourMines(state);
}

/**
 * Обчислює кількість мін у сусідніх клітинках для всього поля
 * @param {Object} state - об'єкт стану гри
 * @returns {Object} - оновлено стан гри
 */
function countNeighbourMines(state) {
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      // Пропускаємо клітинки з мінами
      if (state.grid[row][col].type === CELL_TYPE.MINE) {
        continue;
      }

      let mineCount = 0;

      // Перевіряємо всіх 8 сусідів
      for (const [dRow, dCol] of DIRECTIONS) {
        const newRow = row + dRow;
        const newCol = col + dCol;

        // Перевіряємо межі поля
        if (newRow >= 0 && newRow < state.rows &&
            newCol >= 0 && newCol < state.cols) {
          if (state.grid[newRow][newCol].type === CELL_TYPE.MINE) {
            mineCount++;
          }
        }
      }

      state.grid[row][col].neighborMines = mineCount;
    }
  }
  return state;
}

/**
 * Відкриває клітинку. Якщо міна — гра програна.
 * Якщо навколо 0 мін — рекурсивно відкриває сусідів.
 * @param {Object} state - об'єкт стану гри
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 * @returns {Object} - оновлено стан гри
 */
function openCell(state, row, col) {
  // Перевіряємо валідність координат
  if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) {
    return state;
  }

  const cell = state.grid[row][col];

  // Клітинка вже відкрита або позначена флагом
  if (cell.state !== CELL_STATE.CLOSED) {
    return state;
  }

  // Гра вже закінчена
  if (state.status !== GAME_STATUS.PROCESS) {
    return state;
  }

  // Відкриваємо клітинку
  cell.state = CELL_STATE.OPENED;

  // Гра провалена
  if (cell.type === CELL_TYPE.MINE) {
    state.status = GAME_STATUS.LOSE;
    revealAllMines(state);
    return state;
  }

  // Рекурсивне відкриття сусідніх порожніх клітинок
  if (cell.neighborMines === 0) {
    for (const [dRow, dCol] of DIRECTIONS) {
      openCell(state, row + dRow, col + dCol);
    }
  }

  // Перевіряємо умову перемоги
  return checkWinCondition(state);
}

/**
 * Перемикає флаг на клітинці між 'closed' і 'flagged'
 * @param {Object} state - об'єкт стану гри
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 * @returns {Object} - оновлено стан гри
 */
function toggleFlag(state, row, col) {
  // Перевіряємо валідність координат
  if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) {
    return state;
  }

  const cell = state.grid[row][col];

  // Гра вже закінчена
  if (state.status !== GAME_STATUS.PROCESS) {
    return state;
  }

  // Можна позначити флагом тільки закриту клітинку
  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }
  // Якщо клітинка відкрита, нічого не робимо

  return state;
}

/**
 * Стартує таймер для об'єкту стану гри
 * @param {Object} state - об'єкт стану гри
 * @returns {Object} - оновлено стан гри
 */
function startTimer(state) {
  if (state.timerId !== null) {
    return state; // Таймер уже працює
  }

  state.timerId = setInterval(() => {
    state.gameTime++;
  }, 1000);
  
  return state;
}

/**
 * Зупиняє таймер для об'єкту стану гри
 * @param {Object} state - об'єкт стану гри
 * @returns {Object} - оновлено стан гри
 */
function stopTimer(state) {
  if (state.timerId !== null) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
  return state;
}

/**
 * Перевіряє умову перемоги: усі не-мінні клітинки повинні бути відкриті
 * @param {Object} state - об'єкт стану гри
 * @returns {Object} - оновлено стан гри
 */
function checkWinCondition(state) {
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const cell = state.grid[row][col];
      // Якщо порожня клітинка закрита — гра не закінчена
      if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) {
        return state;
      }
    }
  }

  // Усі порожні клітинки відкриті — гра виграна
  state.status = GAME_STATUS.WIN;
  return state;
}

/**
 * Розкриває всі міни при програші
 * @param {Object} state - об'єкт стану гри
 * @returns {Object} - оновлено стан гри
 */
function revealAllMines(state) {
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      if (state.grid[row][col].type === CELL_TYPE.MINE) {
        state.grid[row][col].state = CELL_STATE.OPENED;
      }
    }
  }
  return state;
}

/**
 * Отримує клітинку за координатами
 * @param {Object} state - об'єкт стану гри
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 * @returns {Object|null} - об'єкт клітинки або null
 */
function getCell(state, row, col) {
  if (row < 0 || row >= state.rows || col < 0 || col >= state.cols) {
    return null;
  }
  return state.grid[row][col];
}

/**
 * Перезапускає гру
 * @param {number} rows - кількість рядків
 * @param {number} cols - кількість стовпців
 * @param {number} minesCount - кількість мін
 * @returns {Object} - новий об'єкт стану гри
 */
function resetGame(rows, cols, minesCount) {
  return generateField(rows, cols, minesCount);
}

/**
 * Повертає масив координат усіх мін на полі
 * @param {Object} state - об'єкт стану гри
 * @returns {Array<[number, number]>} - масив координат мін [row, col]
 */
function findMines(state) {
  const mines = [];
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      if (state.grid[row][col].type === CELL_TYPE.MINE) {
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
 * @param {Object} state - об'єкт стану гри
 */
function debugPrintField(state) {
  let output = '';
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      const cell = state.grid[row][col];
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

// ===== ГЛОБАЛЬНІ ФУНКЦІЇ ДЛЯ UI (обгортки навколо чистих функцій) =====

/**
 * Ініціалізує глобальний стан гри і запускає таймер
 * @param {number} rows - кількість рядків
 * @param {number} cols - кількість стовпців
 * @param {number} minesCount - кількість мін
 */
function initializeGame(rows, cols, minesCount) {
  gameState = generateField(rows, cols, minesCount);
  if (gameState) {
    gameState = startTimer(gameState);
  }
  return gameState;
}

/**
 * Глобальна функція для відкриття клітинки
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 */
function openCellGlobal(row, col) {
  if (gameState) {
    gameState = openCell(gameState, row, col);
    if (gameState.status !== GAME_STATUS.PROCESS) {
      gameState = stopTimer(gameState);
    }
  }
}

/**
 * Глобальна функція для перемикання флага
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 */
function toggleFlagGlobal(row, col) {
  if (gameState) {
    gameState = toggleFlag(gameState, row, col);
  }
}

/**
 * Глобальна функція для перезапуску гри
 * @param {number} rows - кількість рядків
 * @param {number} cols - кількість стовпців
 * @param {number} minesCount - кількість мін
 */
function resetGameGlobal(rows, cols, minesCount) {
  if (gameState) {
    gameState = stopTimer(gameState);
  }
  return initializeGame(rows, cols, minesCount);
}

/**
 * Глобальна функція для зупинки таймера
 */
function stopTimerGlobal() {
  if (gameState) {
    gameState = stopTimer(gameState);
  }
}

// Експортуємо для можливості використання в HTML
window.game = {
  // Чисті функції для тестування
  generateField,
  openCell,
  toggleFlag,
  countNeighbourMines,
  checkWinCondition,
  revealAllMines,
  getCell,
  resetGame,
  findMines,
  debugPrintField,
  startTimer,
  stopTimer,
  
  // Глобальні функції для UI
  initializeGame,
  openCellGlobal,
  toggleFlagGlobal,
  resetGameGlobal,
  stopTimerGlobal,
  
  // Прямий доступ до глобального стану (для UI)
  getState: () => gameState
};
