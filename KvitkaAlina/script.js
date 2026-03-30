"use strict";

const GAME_CONFIG = {
  ROWS: 10,
  COLS: 10,
  MINES_COUNT: 10
};

const GAME_STATUS = {
  PROCESS: "process",
  WIN: "win",
  LOSE: "lose"
};

const CELL_TYPE = {
  EMPTY: "empty",
  MINE: "mine"
};

const CELL_STATE = {
  CLOSED: "closed",
  OPENED: "opened",
  FLAGGED: "flagged"
};

const FACE = {
  NORMAL: "🙂",
  WIN: "😎",
  LOSE: "😵"
};

const SELECTORS = {
  BOARD: ".game-board",
  CELL: ".game-board .cell",
  TIMER: "#timer",
  FLAGS: "#flags-count",
  NEW_GAME_BUTTON: ".panel-button"
};

const boardElement = document.querySelector(SELECTORS.BOARD);
const cellElements = Array.from(document.querySelectorAll(SELECTORS.CELL));
const timerElement = document.querySelector(SELECTORS.TIMER);
const flagsElement = document.querySelector(SELECTORS.FLAGS);
const newGameButton = document.querySelector(SELECTORS.NEW_GAME_BUTTON);

function validateDom() {
  const expectedCellsCount = GAME_CONFIG.ROWS * GAME_CONFIG.COLS;

  if (!boardElement || !timerElement || !flagsElement || !newGameButton) {
    throw new Error("DOM elements not found");
  }

  if (cellElements.length !== expectedCellsCount) {
    throw new Error("Invalid number of cells");
  }
}

const gameState = {
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: [],
  openedSafeCells: 0,
  flagsPlaced: 0,
  isFirstMove: true
};

function formatCounter(value) {
  return String(Math.max(0, value)).padStart(3, "0");
}

function isInsideBoard(row, col) {
  return (
    row >= 0 &&
    row < GAME_CONFIG.ROWS &&
    col >= 0 &&
    col < GAME_CONFIG.COLS
  );
}

function getCellIndex(row, col) {
  return row * GAME_CONFIG.COLS + col;
}

function getCellElement(row, col) {
  return cellElements[getCellIndex(row, col)];
}

function getCellData(row, col) {
  return gameState.field[row][col];
}

function forEachNeighbour(row, col, callback) {
  for (let directionalRow = -1; directionalRow <= 1; directionalRow++) {
    for (let directionalCol = -1; directionalCol <= 1; directionalCol++) {
      if (directionalRow === 0 && directionalCol === 0) continue;

      const neighbourRow = row + directionalRow;
      const neighbourCol = col + directionalCol;

      if (isInsideBoard(neighbourRow, neighbourCol)) {
        callback(neighbourRow, neighbourCol);
      }
    }
  }
}

function isGameActive() {
  return gameState.status === GAME_STATUS.PROCESS;
}

function createCell() {
  return {
    type: CELL_TYPE.EMPTY,
    neighborMines: 0,
    state: CELL_STATE.CLOSED,
    isExploded: false
  };
}

function createEmptyField() {
  return Array.from({ length: GAME_CONFIG.ROWS }, () =>
    Array.from({ length: GAME_CONFIG.COLS }, () => createCell())
  );
}

function placeMines(field, excludedRow = null, excludedCol = null) {
  let placed = 0;

  while (placed < GAME_CONFIG.MINES_COUNT) {
    const row = Math.floor(Math.random() * GAME_CONFIG.ROWS);
    const col = Math.floor(Math.random() * GAME_CONFIG.COLS);

    if (row === excludedRow && col === excludedCol) continue;
    if (field[row][col].type === CELL_TYPE.MINE) continue;

    field[row][col].type = CELL_TYPE.MINE;
    placed++;
  }
}

function countNeighbourMines(field, row, col) {
  let count = 0;

  forEachNeighbour(row, col, (neighbourRow, neighbourCol) => {
  if (field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) count++;
});

  return count;
}

function fillNeighbourCounts(field) {
  for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
      if (field[row][col].type === CELL_TYPE.MINE) continue;

      field[row][col].neighborMines = countNeighbourMines(field, row, col);
    }
  }
}

function generateField(excludedRow = null, excludedCol = null) {
  const field = createEmptyField();

  placeMines(field, excludedRow, excludedCol);
  fillNeighbourCounts(field);

  return field;
}

function clearCellPresentation(element) {
  el.className = "cell";
  el.textContent = "";
}

function renderClosedCell(element) {
  el.classList.add("cell--closed");
  el.setAttribute("aria-label", "Закрита клітинка");
}

function renderFlaggedCell(element) {
  el.classList.add("cell--closed", "cell--flag");
  el.setAttribute("aria-label", "Клітинка з прапорцем");
}

function renderMineCell(element, cell) {
  el.classList.add("cell--open");

  if (cell.isExploded) {
    el.classList.add("cell--mine-hit");
    el.setAttribute("aria-label", "Міна, яку підірвав користувач");
    return;
  }

  el.classList.add("cell--mine");
  el.setAttribute("aria-label", "Відкрита міна");
}

function renderOpenedSafeCell(element, cell) {
  el.classList.add("cell--open");

  if (cell.neighborMines > 0) {
    el.classList.add(`cell--number-${cell.neighborMines}`);
    el.textContent = String(cell.neighborMines);
    el.setAttribute(
      "aria-label",
      `Відкрита клітинка, ${cell.neighborMines} мін поруч`
    );
    
    return;
  }

  el.setAttribute("aria-label", "Відкрита порожня клітинка");
}

function renderCell(row, col) {
  const cell = getCellData(row, col);
  const el = getCellElement(row, col);

  clearCellPresentationelement;

  if (cell.state === CELL_STATE.CLOSED) {
    renderClosedCellelement;
    return;
  }

  if (cell.state === CELL_STATE.FLAGGED) {
    renderFlaggedCellelement;
    return;
  }

  if (cell.type === CELL_TYPE.MINE) {
    renderMineCell(el, cell);
  } else {
    renderOpenedSafeCell(el, cell);
  }
}

function renderBoard() {
  for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
      renderCell(row, col);
    }
  }
}

function renderTimer() {
  timerElement.textContent = formatCounter(gameState.gameTime);
}

function renderFlagsCounter() {
  const left = GAME_CONFIG.MINES_COUNT - gameState.flagsPlaced;
  flagsElement.textContent = formatCounter(left);
}

function renderFace() {
  if (gameState.status === GAME_STATUS.WIN) {
    newGameButton.textContent = FACE.WIN;
  } else if (gameState.status === GAME_STATUS.LOSE) {
    newGameButton.textContent = FACE.LOSE;
  } else {
    newGameButton.textContent = FACE.NORMAL;
  }
}

function renderGame() {
  renderBoard();
  renderTimer();
  renderFlagsCounter();
  renderFace();
}

function stopTimer() {
  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function startTimer() {
  if (gameState.timerId !== null) return;

  gameState.timerId = setInterval(() => {
    if (!isGameActive()) {
      stopTimer();
      return;
    }

    gameState.gameTime++;
    renderTimer();
  }, 1000);
}

function resetGameState() {
  stopTimer();

  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;
  gameState.timerId = null;
  gameState.field = [];
  gameState.openedSafeCells = 0;
  gameState.flagsPlaced = 0;
  gameState.isFirstMove = true;
}

function createNewGame() {
  resetGameState();
  gameState.field = generateField();
  renderGame();
}

function regenerateFieldForSafeFirstMove(row, col) {
  gameState.field = generateField(row, col);
}

function openSafeCell(row, col) {
  const cell = getCellData(row, col);

  if (cell.state !== CELL_STATE.CLOSED) return;

  cell.state = CELL_STATE.OPENED;
  gameState.openedSafeCells++;
}

function revealAllMines() {
  for (let row = 0; row < GAME_CONFIG.ROWS; row++) {
    for (let col = 0; col < GAME_CONFIG.COLS; col++) {
      const cell = getCellData(row, col);

      if (cell.type === CELL_TYPE.MINE) {
        cell.state = CELL_STATE.OPENED;
      }
    }
  }
}

function handleLose(row, col) {
  const cell = getCellData(row, col);

  cell.isExploded = true;
  gameState.status = GAME_STATUS.LOSE;

  revealAllMines();
  stopTimer();
  renderGame();
}

function handleWin() {
  gameState.status = GAME_STATUS.WIN;
  stopTimer();
  renderFace();
}

function checkWin() {
  const totalSafe =
    GAME_CONFIG.ROWS * GAME_CONFIG.COLS - GAME_CONFIG.MINES_COUNT;

  if (gameState.openedSafeCells === totalSafe) {
    handleWin();
  }
}

function floodOpen(row, col) {
  if (!isInsideBoard(row, col)) return;

  const cell = getCellData(row, col);

  if (cell.state !== CELL_STATE.CLOSED) return;
  if (cell.type === CELL_TYPE.MINE) return;

  openSafeCell(row, col);

  if (cell.neighborMines !== 0) return;

  forEachNeighbour(row, col, (neighbourRow, neighbourCol) => floodOpen(neighbourRow, neighbourCol));
}

function ensureSafeFirstMove(row, col) {
  if (!gameState.isFirstMove) return;

  if (getCellData(row, col).type === CELL_TYPE.MINE) {
    regenerateFieldForSafeFirstMove(row, col);
  }

  gameState.isFirstMove = false;
  startTimer();
}

function openCell(row, col) {
  if (!isGameActive()) return;
  if (!isInsideBoard(row, col)) return;

  const cell = getCellData(row, col);

  if (cell.state !== CELL_STATE.CLOSED) return;

  ensureSafeFirstMove(row, col);

  const actual = getCellData(row, col);

  if (actual.type === CELL_TYPE.MINE) {
    actual.state = CELL_STATE.OPENED;
    handleLose(row, col);
    return;
  }

  floodOpen(row, col);
  renderBoard();
  checkWin();
}

function toggleFlag(row, col) {
  if (!isGameActive()) return;
  if (!isInsideBoard(row, col)) return;

  const cell = getCellData(row, col);

  if (cell.state === CELL_STATE.OPENED) return;

  if (cell.state === CELL_STATE.CLOSED) {
    if (gameState.flagsPlaced >= GAME_CONFIG.MINES_COUNT) return;

    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsPlaced++;
  } else {
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsPlaced--;
  }

  renderCell(row, col);
  renderFlagsCounter();
}

function handleClick(e) {
  const el = e.target.closest(".cell");
  if (!el || !boardElement.containselement) return;

  const index = cellElements.indexOfelement;
  const row = Math.floor(index / GAME_CONFIG.COLS);
  const col = index % GAME_CONFIG.COLS;

  openCell(row, col);
}

function handleRightClick(e) {
  const el = e.target.closest(".cell");
  if (!el || !boardElement.containselement) return;

  e.preventDefault();

  const index = cellElements.indexOfelement;
  const row = Math.floor(index / GAME_CONFIG.COLS);
  const col = index % GAME_CONFIG.COLS;

  toggleFlag(row, col);
}

function bindEvents() {
  boardElement.addEventListener("click", handleClick);
  boardElement.addEventListener("contextmenu", handleRightClick);

  newGameButton.addEventListener("click", createNewGame);
}

function init() {
  validateDom();
  bindEvents();
  createNewGame();
}

document.addEventListener("DOMContentLoaded", init);
