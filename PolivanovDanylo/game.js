/**
 * MINESWEEPER GAME LOGIC - Refactored
 */

// Перерахування для безпеки коду
const CellType = { EMPTY: 'empty', MINE: 'mine' };
const CellState = { CLOSED: 'closed', OPENED: 'opened', FLAGGED: 'flagged' };
const GameStatus = { PROCESS: 'process', WIN: 'win', LOSE: 'lose' };

const GAME_MESSAGE = {
  WIN: 'Перемога! Гру завершено.',
  LOSE: 'Програш! Гру завершено.',
  NONE: '',
};

let gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GameStatus.PROCESS,
  gameTime: 0,
  timerId: null,
  field: [] // Поле тепер всередині стану
};

const gameBoardElement = document.getElementById('gameBoard');
const flagCounterElement = document.getElementById('flagCounter');
const timerDisplayElement = document.getElementById('timerDisplay');
const restartButton = document.getElementById('restartBtn');
const gameMessageElement = document.getElementById('gameMessage');

const neighbourDirections = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

function createCell() {
  return { type: CellType.EMPTY, state: CellState.CLOSED, neighborMines: 0 };
}

function isInsideField(row, col) {
  return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

function generateField(rows, cols, minesCount) {
  const newField = [];
  for (let row = 0; row < rows; row++) {
    newField[row] = [];
    for (let col = 0; col < cols; col++) {
      newField[row][col] = createCell();
    }
  }

  let placedMines = 0;
  while (placedMines < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (newField[r][c].type === CellType.EMPTY) {
      newField[r][c].type = CellType.MINE;
      placedMines++;
    }
  }

  countNeighbourMines(newField, rows, cols);
  return newField;
}

function countNeighbourMines(field, rows, cols) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (field[row][col].type === CellType.EMPTY) {
        let count = 0;
        for (const [dr, dc] of neighbourDirections) {
          const nr = row + dr;
          const nc = col + dc;
          if (isInsideField(nr, nc) && field[nr][nc].type === CellType.MINE) {
            count++;
          }
        }
        field[row][col].neighborMines = count;
      }
    }
  }
}

function toggleFlag(row, col) {
  if (gameState.status !== GameStatus.PROCESS) return;
  const cell = gameState.field[row][col];
  if (cell.state === CellState.OPENED) return;

  if (cell.state === CellState.CLOSED) {
    // Обмеження на кількість прапорців
    if (getFlagCount() < gameState.minesCount) {
      cell.state = CellState.FLAGGED;
    }
  } else {
    cell.state = CellState.CLOSED;
  }
  updateView();
}

function openCell(row, col) {
  if (gameState.status !== GameStatus.PROCESS) return;
  
  const cell = gameState.field[row][col];
  if (cell.state !== CellState.CLOSED) return;

  if (cell.type === CellType.MINE) {
    cell.state = CellState.OPENED;
    gameState.status = GameStatus.LOSE;
    stopTimer();
    revealAllMines();
  } else {
    openRecursive(row, col);
    checkWinCondition();
  }
  updateView();
}

function openRecursive(row, col) {
  if (!isInsideField(row, col)) return;
  const cell = gameState.field[row][col];
  if (cell.state !== CellState.CLOSED || cell.type === CellType.MINE) return;

  cell.state = CellState.OPENED;
  if (cell.neighborMines === 0) {
    for (const [dr, dc] of neighbourDirections) {
      openRecursive(row + dr, col + dc);
    }
  }
}

function revealAllMines() {
  gameState.field.forEach(row => {
    row.forEach(cell => {
      if (cell.type === CellType.MINE) cell.state = CellState.OPENED;
    });
  });
}

function checkWinCondition() {
  const totalCells = gameState.rows * gameState.cols;
  let openedCount = 0;
  gameState.field.forEach(row => {
    row.forEach(cell => {
      if (cell.state === CellState.OPENED) openedCount++;
    });
  });

  if (openedCount === totalCells - gameState.minesCount) {
    gameState.status = GameStatus.WIN;
    stopTimer();
  }
}

function getFlagCount() {
  return gameState.field.flat().filter(c => c.state === CellState.FLAGGED).length;
}

function renderBoard() {
  if (!gameBoardElement) return;

  // Встановлюємо лише кількість колонок через CSS змінні
  gameBoardElement.style.setProperty('--cols', gameState.cols);
  gameBoardElement.style.setProperty('--rows', gameState.rows);
  gameBoardElement.innerHTML = '';

  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.field[r][c];
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cell ${cell.state} ${cell.type === CellType.MINE && cell.state === CellState.OPENED ? 'mine' : ''}`.trim();
      
      if (cell.state === CellState.OPENED && cell.type === CellType.EMPTY) {
        btn.textContent = cell.neighborMines || '';
        if (cell.neighborMines) btn.classList.add(`number-${cell.neighborMines}`);
      } else if (cell.state === CellState.FLAGGED) {
        btn.textContent = '🚩';
      } else if (cell.state === CellState.OPENED && cell.type === CellType.MINE) {
        btn.textContent = '💣';
      }

      btn.onclick = () => openCell(r, c);
      btn.oncontextmenu = (e) => { e.preventDefault(); toggleFlag(r, c); };
      gameBoardElement.appendChild(btn);
    }
  }
}

function updateHeader() {
  if (flagCounterElement) flagCounterElement.textContent = String(gameState.minesCount - getFlagCount()).padStart(2, '0');
  if (timerDisplayElement) timerDisplayElement.textContent = String(gameState.gameTime).padStart(3, '0');
  if (restartButton) {
    const isWin = gameState.status === GameStatus.WIN;
    const isLose = gameState.status === GameStatus.LOSE;
    restartButton.textContent = isWin ? '😎' : isLose ? '💥' : '🙂';
    const label = isWin ? 'Перемога. Нова гра' : isLose ? 'Поразка. Нова гра' : 'Старт / Рестарт';
    restartButton.title = label;
    restartButton.setAttribute('aria-label', label);
  }
  if (gameBoardElement) {
    gameBoardElement.dataset.status = gameState.status;
  }
  if (gameMessageElement) {
    if (gameState.status === GameStatus.WIN) {
      gameMessageElement.textContent = GAME_MESSAGE.WIN;
    } else if (gameState.status === GameStatus.LOSE) {
      gameMessageElement.textContent = GAME_MESSAGE.LOSE;
    } else {
      gameMessageElement.textContent = GAME_MESSAGE.NONE;
    }
  }
}

function updateView() {
  renderBoard();
  updateHeader();
}

function startTimer() {
  stopTimer();
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateHeader();
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
  gameState.timerId = null;
}

function resetGame() {
  gameState.status = GameStatus.PROCESS;
  gameState.gameTime = 0;
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  startTimer();
  updateView();
}

function initGame() {
  resetGame();
  if (restartButton) restartButton.onclick = resetGame;
}

document.addEventListener('DOMContentLoaded', initGame);