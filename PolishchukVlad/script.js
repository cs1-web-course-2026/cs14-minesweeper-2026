// ============================================================
//  MINESWEEPER — Game Logic (script.js)
// ============================================================

// ── 1. Game State ────────────────────────────────────────────

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process', // 'process' | 'win' | 'lose'
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
      type: 'empty',
      state: 'closed',
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

    if (grid[row][col].type !== 'mine') {
      grid[row][col].type = 'mine';
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
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        neighbours.push([r, c]);
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
      if (grid[row][col].type === 'mine') continue;

      const mineCount = getNeighbours(row, col, rows, cols)
        .filter(([r, c]) => grid[r][c].type === 'mine')
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

  if (cell.state === 'opened' || cell.state === 'flagged') return;

  cell.state = 'opened';

  // Flood-fill: keep going while cells have no neighbouring mines
  if (cell.type === 'empty' && cell.neighborMines === 0) {
    getNeighbours(row, col, gameState.rows, gameState.cols)
      .forEach(([r, c]) => openCellRecursive(r, c));
  }
}

/**
 * Opens a cell, handles win/lose logic, then re-renders.
 * This is the public entry point called from UI event listeners.
 * @param {number} row
 * @param {number} col
 */
function openCell(row, col) {
  if (gameState.status !== 'process') return;

  const cell = field[row][col];
  if (cell.state === 'opened' || cell.state === 'flagged') return;

  if (cell.type === 'mine') {
    cell.state = 'opened';
    gameState.status = 'lose';
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
      if (cell.type === 'mine' && cell.state !== 'flagged') {
        cell.state = row === triggeredRow && col === triggeredCol
          ? 'exploded'
          : 'revealed';
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
      cell.type === 'mine' || cell.state === 'opened'
    )
  );

  if (allClear) {
    gameState.status = 'win';
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
  if (gameState.status !== 'process') return;

  const cell = field[row][col];
  if (cell.state === 'opened') return;

  cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';

  renderBoard();
  updateHUD();
}

/** Starts the game timer (increments every second). */
function startTimer() {
  if (gameState.timerId) return; // already running
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateHUD();
  }, 1000);
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

  gameState.status = 'process';
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
    sum + row.filter(cell => cell.state === 'flagged').length, 0
  );
}

/**
 * Pads a number with leading zeros to a given width.
 * @param {number} n
 * @param {number} width
 * @returns {string}
 */
function padNumber(n, width = 3) {
  return String(Math.min(n, 999)).padStart(width, '0');
}

// ── 7. Rendering ─────────────────────────────────────────────

/** Updates the HUD: flag counter, timer, and face emoji. */
function updateHUD() {
  const remaining = gameState.minesCount - countFlags();
  document.getElementById('flag-count').textContent = padNumber(remaining);
  document.getElementById('timer').textContent      = padNumber(gameState.gameTime);

  const faceMap = { process: '🙂', win: '😎', lose: '😵' };
  document.getElementById('face').textContent = faceMap[gameState.status];
}

/**
 * Builds the CSS class list for a cell.
 * @param {{type: string, state: string, neighborMines: number}} cell
 * @returns {string}
 */
function getCellClasses(cell) {
  const classes = ['cell'];

  if (cell.state === 'opened') {
    classes.push('open');
    if (cell.type === 'mine') {
      classes.push('mine', 'revealed');
    } else if (cell.neighborMines === 0) {
      classes.push('empty');
    } else {
      classes.push(`n${cell.neighborMines}`);
    }
  } else if (cell.state === 'exploded') {
    classes.push('mine', 'exploded');
  } else if (cell.state === 'revealed') {
    classes.push('mine', 'revealed');
  } else if (cell.state === 'flagged') {
    classes.push('closed', 'flagged');
    if (cell.type === 'mine') classes.push('mine-under');
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
  if (cell.state === 'flagged')  return '⚑';
  if (cell.state === 'exploded' || cell.state === 'revealed') return '💣';
  if (cell.state === 'opened' && cell.type !== 'mine' && cell.neighborMines > 0) {
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
  if (cell.state === 'flagged')  return 'Прапорець';
  if (cell.state === 'exploded') return 'Підірвана міна';
  if (cell.state === 'revealed') return 'Міна';
  if (cell.state === 'opened') {
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
      const btn = document.createElement('button');
      btn.className    = getCellClasses(cell);
      btn.textContent  = getCellContent(cell);
      btn.setAttribute('aria-label', getCellAriaLabel(cell));

      // Left click — open cell (start timer on first click)
      btn.addEventListener('click', () => {
        if (gameState.status !== 'process') return;
        openCell(row, col);
      });

      // Right click — toggle flag
      btn.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(row, col);
      });

      rowEl.appendChild(btn);
    });

    board.appendChild(rowEl);
  });
}

// ── 8. Event Listeners ───────────────────────────────────────

document.getElementById('start-btn').addEventListener('click', startGame);

// ── 9. Bootstrap ─────────────────────────────────────────────

startGame();