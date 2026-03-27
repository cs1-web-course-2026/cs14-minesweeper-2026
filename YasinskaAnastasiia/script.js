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
  field: []
};

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

  if (cell.type === CELL_TYPE.MINE) {
    gameState.status = GAME_STATUS.LOSE;
    revealAllMines();
    stopTimer();
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
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
  }
}

function printField() {
  const result = gameState.field.map((row) => {
    return row.map((cell) => {
      if (cell.state === CELL_STATE.CLOSED) {
        return '■';
      }

      if (cell.state === CELL_STATE.FLAGGED) {
        return '⚑';
      }

      if (cell.type === CELL_TYPE.MINE) {
        return '*';
      }

      return cell.neighborMines === 0 ? ' ' : String(cell.neighborMines);
    }).join(' ');
  });

  console.log(result.join('\n'));
  console.log('Статус гри:', gameState.status);
  console.log('Час гри:', gameState.gameTime, 'сек');
}

initGame();

// Приклади перевірки:
// openCell(0, 0);
// toggleFlag(1, 1);
// printField();
