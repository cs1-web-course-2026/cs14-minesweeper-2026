const DEFAULT_ROWS = 10;
const DEFAULT_COLS = 10;
const DEFAULT_MINES_COUNT = 15;

const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose'
};

const CELL_TYPE = {
  MINE: 'mine',
  EMPTY: 'empty'
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged'
};

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

const gameState = {
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  minesCount: DEFAULT_MINES_COUNT,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: [],
  openedCellsCount: 0,
  flagsCount: 0
};

const boardElement = document.getElementById('game-board');
const timerElement = document.getElementById('timer-value');
const flagsElement = document.getElementById('flags-count');
const restartButton = document.getElementById('restart-btn');
const statusMessageElement = document.getElementById('game-status-message');

function createCell() {
  return {
    type: CELL_TYPE.EMPTY,
    neighborMines: 0,
    state: CELL_STATE.CLOSED
  };
}

function isInsideField(row, col) {
  return (
    row >= 0 &&
    row < gameState.rows &&
    col >= 0 &&
    col < gameState.cols
  );
}

function getNeighbors(row, col) {
  const neighbors = [];

  for (const [directionalRow, directionalCol] of DIRECTIONS) {
  const neighborRow = row + directionalRow;
  const neighborCol = col + directionalCol;
}

    if (isInsideField(neighborRow, neighborCol)) {
      neighbors.push([neighborRow, neighborCol]);
    }
  }

  return neighbors;
}

function generateField(rows, cols, minesCount) {
  const field = [];

  for (let row = 0; row < rows; row++) {
    const currentRow = [];

    for (let col = 0; col < cols; col++) {
      currentRow.push(createCell());
    }

    field.push(currentRow);
  }

  let placedMines = 0;

  while (placedMines < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    if (field[randomRow][randomCol].type !== CELL_TYPE.MINE) {
      field[randomRow][randomCol].type = CELL_TYPE.MINE;
      placedMines++;
    }
  }

  return field;
}

function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === CELL_TYPE.MINE) {
        continue;
      }

      const neighbors = getNeighbors(row, col);
      let minesAround = 0;

      for (const [neighborRow, neighborCol] of neighbors) {
        if (gameState.field[neighborRow][neighborCol].type === CELL_TYPE.MINE) {
          minesAround++;
        }
      }

      gameState.field[row][col].neighborMines = minesAround;
    }
  }
}

function startTimer() {
  if (gameState.timerId !== null) {
    return;
  }

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function initGame(
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  minesCount = DEFAULT_MINES_COUNT
) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.status = GAME_STATUS.PROCESS;
  gameState.gameTime = 0;

  stopTimer();

  gameState.field = generateField(rows, cols, minesCount);
  countNeighbourMines();

  renderGame();
}

function revealAllMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === CELL_TYPE.MINE) {
        gameState.field[row][col].state = CELL_STATE.OPENED;
      }
    }
  }
}

function checkWin() {
  let openedSafeCells = 0;
  const safeCellsCount = gameState.rows * gameState.cols - gameState.minesCount;

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.field[row][col];

      if (cell.type === CELL_TYPE.EMPTY && cell.state === CELL_STATE.OPENED) {
        openedSafeCells++;
      }
    }
  }

  if (openedSafeCells === safeCellsCount) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
  }
}

function openCell(row, col) {
  if (!isInsideField(row, col)) {
    return;
  }

  if (gameState.status !== GAME_STATUS.PROCESS) {
    return;
  }

  if (gameState.timerId === null) {
    startTimer();
  }

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
    return;
  }

cell.state = CELL_STATE.OPENED;
gameState.openedCellsCount++;

  if (cell.type === CELL_TYPE.MINE) {
    gameState.status = GAME_STATUS.LOSE;
    revealAllMines();
    stopTimer();
    renderGame();
    return;
  }

  if (cell.neighborMines === 0) {
    const neighbors = getNeighbors(row, col);

    for (const [neighborRow, neighborCol] of neighbors) {
      if (gameState.field[neighborRow][neighborCol].state === CELL_STATE.CLOSED) {
        openCell(neighborRow, neighborCol);
      }
    }
  }

  checkWin();
  renderGame();
}

function toggleFlag(row, col) {
  if (!isInsideField(row, col)) {
    return;
  }

  if (gameState.status !== GAME_STATUS.PROCESS) {
    return;
  }

  if (gameState.timerId === null) {
    startTimer();
  }

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPENED) {
    return;
  }

  if (cell.state === CELL_STATE.CLOSED) {
  cell.state = CELL_STATE.FLAGGED;
  gameState.flagsCount++;
} else if (cell.state === CELL_STATE.FLAGGED) {
  cell.state = CELL_STATE.CLOSED;
  gameState.flagsCount--;
}

  renderGame();
}

function getFlagsCount() {
  let flagsCount = 0;

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].state === CELL_STATE.FLAGGED) {
        flagsCount++;
      }
    }
  }

  return flagsCount;
}

function updateTimer() {
  timerElement.textContent = String(gameState.gameTime).padStart(3, '0');
}

function updateFlagsCounter() {
  const availableFlags = gameState.minesCount - gameState.flagsCount;
  flagsElement.textContent = availableFlags;
}

function updateStatusMessage() {
  if (gameState.status === GAME_STATUS.WIN) {
    statusMessageElement.textContent = 'Перемога! Усі безпечні клітинки відкриті.';
  } else if (gameState.status === GAME_STATUS.LOSE) {
    statusMessageElement.textContent = 'Поразка! Ви натрапили на міну.';
  } else {
    statusMessageElement.textContent = 'Гра триває...';
  }
}

function getNumberClass(number) {
  const numberClasses = {
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight'
  };

  return numberClasses[number] || '';
}

function createCellElement(cell, row, col) {
 const cellElement = document.createElement('button');
cellElement.type = 'button';
cellElement.classList.add('cell');

  if (cell.state === CELL_STATE.OPENED) {
    cellElement.classList.add('open');

    if (cell.type === CELL_TYPE.MINE) {
      cellElement.classList.add('mine');
      if (gameState.status === GAME_STATUS.LOSE) {
        cellElement.classList.add('hit');
      }
    } else if (cell.neighborMines > 0) {
      cellElement.classList.add(getNumberClass(cell.neighborMines));
      cellElement.textContent = cell.neighborMines;
    }
  }

  if (cell.state === CELL_STATE.FLAGGED) {
    cellElement.classList.add('flag');
  }

  cellElement.addEventListener('click', () => {
    openCell(row, col);
  });

  cellElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    toggleFlag(row, col);
  });

  return cellElement;
}

function renderField() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 40px)`;

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.field[row][col];
      const cellElement = createCellElement(cell, row, col);
      boardElement.appendChild(cellElement);
    }
  }
}

function renderGame() {
  renderField();
  updateTimer();
  updateFlagsCounter();
  updateStatusMessage();
}

restartButton.addEventListener('click', () => {
  initGame();
});

initGame();
