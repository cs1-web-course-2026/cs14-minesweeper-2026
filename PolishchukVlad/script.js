// ============================================================
//  MINESWEEPER — Game Logic (script.js)
// ============================================================

// ── 0. Constants ─────────────────────────────────────────────

const GAME_STATUS = {
  PROCESS: 'process',
  WIN:     'win',
  LOSE:    'lose',
};

const CELL_STATE = {
  OPENED:   'opened',
  CLOSED:   'closed',
  FLAGGED:  'flagged',
  EXPLODED: 'exploded',
  REVEALED: 'revealed',
};

const CELL_TYPE = {
  MINE:  'mine',
  EMPTY: 'empty',
};

const DEFAULT_ROWS        = 10;
const DEFAULT_COLS        = 10;
const DEFAULT_MINES_COUNT = 15;
const TIMER_TICK_MS       = 1000;
const MAX_HUD_VALUE       = 999;
const HUD_PAD_WIDTH       = 3;


// ── 1. Game State ────────────────────────────────────────────

const gameState = {
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  minesCount: DEFAULT_MINES_COUNT,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
};

/** @type {Array<Array<{type: string, state: string, neighborMines: number}>>} */
let field = [];


// ── 2. Field Generation ──────────────────────────────────────

/**
 * Creates an empty grid of cells.
 * @param {number} rows
 * @param {number} cols
 * @returns {Array<Array<{type: string, state: string, neighborMines: number}>>}
 */
function createEmptyField(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      type: CELL_TYPE.EMPTY,
      state: CELL_STATE.CLOSED,
      neighborMines: 0,
    }))
  );
}


/**
 * Generates a game field with randomly placed mines.
 * @param {number} rows
 * @param {number} cols
 * @param {number} minesCount
 * @returns {Array<Array<{type: string, state: string, neighborMines: number}>>}
 */
function generateField(rows, cols, minesCount) {
  const grid = createEmptyField(rows, cols);
  let placed = 0;

  while (placed < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    if (grid[row][col].type !== CELL_TYPE.MINE) {
      grid[row][col].type = CELL_TYPE.MINE;
      placed++;
    }
  }

  countNeighbourMines(grid, rows, cols);

  return grid;
}


// ── 3. Business Logic ────────────────────────────────────────

/**
 * Returns all valid neighbour coordinates for a given cell.
 * @param {number} row
 * @param {number} col
 * @param {number} rows
 * @param {number} cols
 * @returns {Array<[number, number]>}
 */
function getNeighbours(row, col, rows, cols) {
  const neighbours = [];

  for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
    for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
      if (directionalRow === 0 && directionalCol === 0) continue;

      const neighbourRow = row + directionalRow;
      const neighbourCol = col + directionalCol;

      if (neighbourRow >= 0 && neighbourRow < rows && neighbourCol >= 0 && neighbourCol < cols) {
        neighbours.push([neighbourRow, neighbourCol]);
      }
    }
  }

  return neighbours;
}


/**
 * Calculates and stores neighborMines count for every empty cell.
 * @param {Array<Array<object>>} grid
 * @param {number} rows
 * @param {number} cols
 */
function countNeighbourMines(grid, rows, cols) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col].type === CELL_TYPE.MINE) continue;

      const mineCount = getNeighbours(row, col, rows, cols)
        .filter(([neighbourRow, neighbourCol]) => grid[neighbourRow][neighbourCol].type === CELL_TYPE.MINE)
        .length;

      grid[row][col].neighborMines = mineCount;
    }
  }
}


/**
 * Recursively opens a cell and all connected empty neighbours.
 * Does NOT render — rendering is handled by the public openCell wrapper.
 * @param {number} row
 * @param {number} col
 */
function openCellRecursive(row, col) {
  const cell = field[row][col];

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

  cell.state = CELL_STATE.OPENED;

  if (cell.type === CELL_TYPE.EMPTY && cell.neighborMines === 0) {
    getNeighbours(row, col, gameState.rows, gameState.cols)
      .forEach(([neighbourRow, neighbourCol]) => openCellRecursive(neighbourRow, neighbourCol));
  }
}


/**
 * Opens a cell, handles win/lose logic, then re-renders.
 * This is the public entry point called from UI event listeners.
 * @param {number} row
 * @param {number} col
 */
function openCell(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS) return;

  const cell = field[row][col];

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

  if (cell.type === CELL_TYPE.MINE) {
    cell.state = CELL_STATE.OPENED;
    gameState.status = GAME_STATUS.LOSE;
    stopTimer();
    revealAllMines(row, col);
  } else {
    openCellRecursive(row, col);
    checkWin();
  }

  renderBoard();
  updateHUD();
}


/**
 * Reveals all mines after a loss.
 * Marks the triggered mine as 'exploded', others as 'revealed'.
 * @param {number} triggeredRow
 * @param {number} triggeredCol
 */
function revealAllMines(triggeredRow, triggeredCol) {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = field[row][col];

      if (cell.type === CELL_TYPE.MINE && cell.state !== CELL_STATE.FLAGGED) {
        cell.state = row === triggeredRow && col === triggeredCol
          ? CELL_STATE.EXPLODED
          : CELL_STATE.REVEALED;
      }
    }
  }
}


/**
 * Checks whether all non-mine cells are opened.
 * Sets status to 'win' if so.
 */
function checkWin() {
  const allClear = field.every(row =>
    row.every(cell =>
      cell.type === CELL_TYPE.MINE || cell.state === CELL_STATE.OPENED
    )
  );

  if (allClear) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
  }
}


// ── 4. Flags & Timer ─────────────────────────────────────────

/**
 * Toggles a flag on a closed cell.
 * @param {number} row
 * @param {number} col
 */
function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PROCESS) return;

  const cell = field[row][col];

  if (cell.state === CELL_STATE.OPENED) return;

  cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;

  renderBoard();
  updateHUD();
}


/** Starts the game timer (increments every second). */
function startTimer() {
  if (gameState.timerId) return;

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateHUD();
  }, TIMER_TICK_MS);
}


/** Stops the game timer. */
function stopTimer() {
  if (gameState.timerId) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}


// ── 5. Game Flow ─────────────────────────────────────────────

/** Resets and starts a new game. */
function startGame() {
  stopTimer();

  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.timerId = null;

  field = generateField(gameState.rows, gameState.cols, gameState.minesCount);

  startTimer();
  renderBoard();
  updateHUD();
}


// ── 6. Helpers ───────────────────────────────────────────────

/**
 * Counts flags placed on the board.
 * @returns {number}
 */
function countFlags() {
  return field.reduce((sum, row) =>
    sum + row.filter(cell => cell.state === CELL_STATE.FLAGGED).length, 0
  );
}


/**
 * Pads a number with leading zeros to a given width.
 * @param {number} count
 * @param {number} width
 * @returns {string}
 */
function padNumber(count, width = HUD_PAD_WIDTH) {
  return String(Math.min(count, MAX_HUD_VALUE)).padStart(width, '0');
}


// ── 7. Rendering ─────────────────────────────────────────────

/** Updates the HUD: flag counter, timer, and face emoji. */
function updateHUD() {
  const remaining = gameState.minesCount - countFlags();

  document.getElementById('flag-count').textContent = padNumber(remaining);
  document.getElementById('timer').textContent      = padNumber(gameState.gameTime);

  const faceMap = {
    [GAME_STATUS.PROCESS]: '🙂',
    [GAME_STATUS.WIN]:     '😎',
    [GAME_STATUS.LOSE]:    '😵',
  };

  document.getElementById('face').textContent = faceMap[gameState.status];
}


/**
 * Builds the CSS class list for a cell.
 * @param {{type: string, state: string, neighborMines: number}} cell
 * @returns {string}
 */
function getCellClasses(cell) {
  const classes = ['cell'];

  if (cell.state === CELL_STATE.OPENED) {
    classes.push('open');

    if (cell.type === CELL_TYPE.MINE) {
      classes.push('mine', 'revealed');
    } else if (cell.neighborMines === 0) {
      classes.push('empty');
    } else {
      classes.push(`n${cell.neighborMines}`);
    }
  } else if (cell.state === CELL_STATE.EXPLODED) {
    classes.push('mine', 'exploded');
  } else if (cell.state === CELL_STATE.REVEALED) {
    classes.push('mine', 'revealed');
  } else if (cell.state === CELL_STATE.FLAGGED) {
    classes.push('closed', 'flagged');

    if (cell.type === CELL_TYPE.MINE) classes.push('mine-under');
  } else {
    classes.push('closed');
  }

  return classes.join(' ');
}


/**
 * Returns the visible text content for a cell button.
 * @param {{type: string, state: string, neighborMines: number}} cell
 * @returns {string}
 */
function getCellContent(cell) {
  if (cell.state === CELL_STATE.FLAGGED)  return '⚑';
  if (cell.state === CELL_STATE.EXPLODED || cell.state === CELL_STATE.REVEALED) return '💣';

  if (cell.state === CELL_STATE.OPENED && cell.type !== CELL_TYPE.MINE && cell.neighborMines > 0) {
    return String(cell.neighborMines);
  }

  return '';
}


/**
 * Returns an accessible aria-label for a cell.
 * @param {{type: string, state: string, neighborMines: number}} cell
 * @returns {string}
 */
function getCellAriaLabel(cell) {
  if (cell.state === CELL_STATE.FLAGGED)  return 'Прапорець';
  if (cell.state === CELL_STATE.EXPLODED) return 'Підірвана міна';
  if (cell.state === CELL_STATE.REVEALED) return 'Міна';

  if (cell.state === CELL_STATE.OPENED) {
    return cell.neighborMines > 0 ? String(cell.neighborMines) : 'Порожня клітинка';
  }

  return 'Закрита клітинка';
}


/** Re-renders the entire game board into #game-board. */
function renderBoard() {
  const board = document.getElementById('game-board');
  board.innerHTML = '';

  field.forEach((rowData, row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'row';

    rowData.forEach((cell, col) => {
      const button = document.createElement('button');
      button.className    = getCellClasses(cell);
      button.textContent  = getCellContent(cell);
      button.setAttribute('aria-label', getCellAriaLabel(cell));

      button.addEventListener('click', () => {
        if (gameState.status !== GAME_STATUS.PROCESS) return;
        openCell(row, col);
      });

      button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        toggleFlag(row, col);
      });

      rowEl.appendChild(button);
    });

    board.appendChild(rowEl);
  });
}


// ── 8. Event Listeners ───────────────────────────────────────

document.getElementById('start-btn').addEventListener('click', startGame);


// ── 9. Bootstrap ─────────────────────────────────────────────

startGame();
