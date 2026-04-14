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

// ===== UI ФУНКЦІЇ =====

// Параметри гри
const GAME_CONFIG = {
  rows: 9,
  cols: 9,
  minesCount: 10
};

/**
 * Відображає поле гри в DOM
 * Створює вкладену структуру div-елементів зі слухачами подій
 */
function renderBoard() {
  const fieldElement = document.getElementById('field');
  fieldElement.innerHTML = ''; // Очищуємо старе поле
  fieldElement.classList.add('field-grid');

  if (!gameState) return;

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.grid[row][col];
      const cellElement = document.createElement('div');

      cellElement.className = 'cell';
      cellElement.dataset.row = row;
      cellElement.dataset.col = col;

      // Застосовуємо CSS-класи на основі стану клітинки
      applyCellClasses(cellElement, cell);

      // Додаємо текстовий вміст для чисел
      if (cell.state === CELL_STATE.OPENED && cell.neighborMines > 0) {
        cellElement.textContent = cell.neighborMines;
      }

      fieldElement.appendChild(cellElement);
    }
  }

  // Налаштовуємо делегування подій після рендеринга
  setupEventDelegation();
}

/**
 * Застосовує CSS-класи до елемента клітинки на основі її стану
 * @param {HTMLElement} element - елемент клітинки
 * @param {Object} cell - об'єкт клітинки з логіки гри
 */
function applyCellClasses(element, cell) {
  element.classList.remove('closed', 'opened', 'flagged', 'mine', 'flagged-mine', 'number-1', 'number-2', 'number-3', 'number-4', 'number-5', 'number-6', 'number-7', 'number-8');

  if (cell.state === CELL_STATE.CLOSED) {
    element.classList.add('closed');
  } else if (cell.state === CELL_STATE.FLAGGED) {
    element.classList.add('flagged');
    if (cell.type === CELL_TYPE.MINE) {
      element.classList.add('flagged-mine');
    }
  } else if (cell.state === CELL_STATE.OPENED) {
    element.classList.add('opened');
    if (cell.type === CELL_TYPE.MINE) {
      element.classList.add('mine');
    } else if (cell.neighborMines > 0) {
      element.classList.add(`number-${cell.neighborMines}`);
    }
  }
}

/**
 * Оновлює чисельне представлення таймера у лічильниках
 * Розділяє час на три цифри (с максимум 999 секунд)
 */
function updateTimer() {
  if (!gameState) return;

  const time = Math.min(gameState.gameTime, 999); // Максимум 999 секунд
  const d1 = Math.floor(time / 100);
  const d2 = Math.floor((time % 100) / 10);
  const d3 = time % 10;

  document.getElementById('time-d1').textContent = d1;
  document.getElementById('time-d2').textContent = d2;
  document.getElementById('time-d3').textContent = d3;
}

/**
 * Оновлює відображення лічильника прапорців
 * Підраховує скільки клітинок позначено прапорцями
 */
function updateFlagCounter() {
  if (!gameState) return;

  let flagCount = 0;
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.grid[row][col].state === CELL_STATE.FLAGGED) {
        flagCount++;
      }
    }
  }

  const remaining = Math.max(0, gameState.minesCount - flagCount);
  const d1 = Math.floor(remaining / 100);
  const d2 = Math.floor((remaining % 100) / 10);
  const d3 = remaining % 10;

  document.getElementById('flag-d1').textContent = d1;
  document.getElementById('flag-d2').textContent = d2;
  document.getElementById('flag-d3').textContent = d3;
}

/**
 * Оновлює лице кнопки старту залежно від стану гри
 */
function updateStartButton() {
  if (!gameState) {
    document.querySelector('.btn-start .face').textContent = '💀';
    return;
  }

  if (gameState.status === GAME_STATUS.WIN) {
    document.querySelector('.btn-start .face').textContent = '😎';
  } else if (gameState.status === GAME_STATUS.LOSE) {
    document.querySelector('.btn-start .face').textContent = '😵';
  } else {
    document.querySelector('.btn-start .face').textContent = '💀';
  }
}

/**
 * Оновлює окремену клітинку на дисплеї (без перерендеру всього поля)
 * Ефективніше для великих полів
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 */
function updateCellDisplay(row, col) {
  const cell = gameState.grid[row][col];
  const cellElement = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

  if (!cellElement) return;

  applyCellClasses(cellElement, cell);

  // Обновлюємо текстовий вміст
  cellElement.textContent = '';
  if (cell.state === CELL_STATE.OPENED && cell.neighborMines > 0) {
    cellElement.textContent = cell.neighborMines;
  }
}

/**
 * Показує повідомлення про завершення гри в модальному вікні
 * @param {boolean} isWin - чи гра виграна
 */
function showGameOverMessage(isWin) {
  const modal = document.getElementById('gameOverModal');
  const message = document.getElementById('gameOverMessage');

  if (isWin) {
    message.textContent = '🎉 ВИ ПЕРЕМОГЛИ! 🎉';
    message.style.color = '#50d890';
  } else {
    message.textContent = '💣 ГРА ПРОГРАНА 💣';
    message.style.color = '#ff6b6b';
  }

  modal.classList.add('show');
  setTimeout(() => {
    modal.classList.remove('show');
  }, 3000);
}

/**
 * Налаштовує делегування подій на всьому полі для оптимізації
 * Один слухач для всього поля замість одного на кожну клітинку
 */
function setupEventDelegation() {
  const field = document.getElementById('field');
  if (!field) return;

  // ВАЖЛИВО: Не видаляємо елемент, тільки встановлюємо слухачів!
  // Видалимо попередні слухачі
  const newField = field.cloneNode(true); // true = з дітьми
  field.parentNode.replaceChild(newField, field);

  const updatedField = document.getElementById('field');

  // Ліве кліку (відкриття клітинки)
  updatedField.addEventListener('click', handleLeftClick);

  // Праве кліку (прапорець)
  updatedField.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    handleRightClick(e);
  });
}

/**
 * Обробник лівого кліку по клітинці
 * @param {MouseEvent} event - подія кліку
 */
function handleLeftClick(event) {
  if (event.target.classList.contains('cell')) {
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);

    openCellUI(row, col);
  }
}

/**
 * Обробник правого кліку по клітинці (встановлення/зняття прапорця)
 * @param {MouseEvent} event - подія контекстного меню
 */
function handleRightClick(event) {
  const cellElement = event.target.closest('.cell');
  if (cellElement) {
    const row = parseInt(cellElement.dataset.row);
    const col = parseInt(cellElement.dataset.col);

    toggleFlagUI(row, col);
  }
}

/**
 * Обробник відкриття клітинки з оновленням UI
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 */
function openCellUI(row, col) {
  if (!gameState) return;

  const previousStatus = gameState.status;

  // Запускаємо таймер при першому кліку
  if (gameState.gameTime === 0 && previousStatus === GAME_STATUS.PROCESS) {
    gameState = startTimer(gameState);
  }

  // Відкриваємо клітинку (це може відкрити й сусідні клітинки)
  gameState = openCell(gameState, row, col);

  // Оновлюємо все поле, оскільки rекурсивне відкриття може змінити багато клітинок
  renderBoard();
  updateTimer();
  updateFlagCounter();
  updateStartButton();

  // Перевіряємо закінчення гри
  if (gameState.status !== previousStatus) {
    gameState = stopTimer(gameState);
    showGameOverMessage(gameState.status === GAME_STATUS.WIN);
  }
}

/**
 * Обробник встановлення/зняття прапорця з оновленням UI
 * @param {number} row - номер рядка
 * @param {number} col - номер стовпця
 */
function toggleFlagUI(row, col) {
  if (!gameState) return;

  gameState = toggleFlag(gameState, row, col);

  // Оновлюємо тільки цю клітинку (ефективніше)
  updateCellDisplay(row, col);
  updateFlagCounter();
}

/**
 * Обробник кліку на кнопку "Нова гра"
 */
function handleStartButtonClick() {
  if (gameState) {
    gameState = stopTimer(gameState);
  }

  // Переіціалізуємо гру
  gameState = generateField(GAME_CONFIG.rows, GAME_CONFIG.cols, GAME_CONFIG.minesCount);

  // Відображаємо нове поле
  renderBoard();
  
  // Налаштовуємо слухачі подій ПІСЛЯ рендеру
  setupEventDelegation();
  
  updateTimer();
  updateFlagCounter();
  updateStartButton();

  // Сховаємо модальне вікно
  document.getElementById('gameOverModal').classList.remove('show');

  // Таймер не запускаємо, поки користувач не клікне на поле
}

/**
 * Оновлює таймер кожну секунду
 */
setInterval(() => {
  if (gameState && gameState.status === GAME_STATUS.PROCESS) {
    updateTimer();
  }
}, 100); // Оновлюємо кожні 100мс для гладкого оновлення, але таймер інкрементується на 1000мс

// ===== ІНІЦІАЛІЗАЦІЯ ГЕРИ ПРИ ЗАВАНТАЖЕННІ СТОРІНКИ =====
document.addEventListener('DOMContentLoaded', () => {
  // Ініціалізуємо гру
  gameState = generateField(GAME_CONFIG.rows, GAME_CONFIG.cols, GAME_CONFIG.minesCount);

  // Відображаємо поле
  renderBoard();

  // Оновлюємо UI вперше
  updateTimer();
  updateFlagCounter();
  updateStartButton();

  // Берізаємо слухач подій для кнопки "Нова гра"
  document.getElementById('btn-start').addEventListener('click', handleStartButtonClick);

  // Налаштовуємо делегування подій на полі
  setupEventDelegation();
});

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
  
  // UI функції
  renderBoard,
  updateTimer,
  updateFlagCounter,
  updateStartButton,
  
  // Прямий доступ до глобального стану (для UI)
  getState: () => gameState
};
