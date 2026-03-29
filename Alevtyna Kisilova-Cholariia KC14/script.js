const GAME_STATUS = { PROCESS: 'process', WIN: 'win', LOSE: 'lose' };
const CELL_TYPE = { MINE: 'mine', EMPTY: 'empty' };
const CELL_STATE = { CLOSED: 'closed', OPENED: 'opened', FLAGGED: 'flagged' };

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: []
};


function isValidCell(row, col) {
  return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}


function generateField(rows, cols, minesCount) {
  const field = [];
  for (let row = 0; row < rows; row++) {
    const rowArray = [];
    for (let col = 0; col < cols; col++) {
      rowArray.push({
        type: CELL_TYPE.EMPTY,
        neighborMines: 0,
        state: CELL_STATE.CLOSED
      });
    }
    field.push(rowArray);
  }

  let placedMines = 0;
  while (placedMines < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (field[row][col].type !== CELL_TYPE.MINE) {
      field[row][col].type = CELL_TYPE.MINE;
      placedMines++;
    }
  }
  return field;
}


function countNeighbourMines(field) {
  const rows = field.length;
  const cols = field[0].length;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (field[row][col].type === CELL_TYPE.MINE) continue;
      
      let count = 0;
      for (const [directionalRow, directionalCol] of DIRECTIONS) {
        const neighbourRow = row + directionalRow;
        const neighbourCol = col + directionalCol;
        if (isValidCell(neighbourRow, neighbourCol) && field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE) {
          count++;
        }
      }
      field[row][col].neighborMines = count;
    }
  }
}


function openCell(row, col) {
  if (!isValidCell(row, col)) return;

  const cell = gameState.field[row][col];
  if (cell.state !== CELL_STATE.CLOSED || gameState.status !== GAME_STATUS.PROCESS) return;

  if (cell.type === CELL_TYPE.MINE) {
    cell.state = CELL_STATE.OPENED;
    endGame(GAME_STATUS.LOSE);
    return;
  }

  cell.state = CELL_STATE.OPENED;

  if (cell.neighborMines === 0) {
    for (const [directionalRow, directionalCol] of DIRECTIONS) {
      const neighbourRow = row + directionalRow;
      const neighbourCol = col + directionalCol;
      openCell(neighbourRow, neighbourCol);
    }
  }
  checkWin();
}


function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPENED || gameState.status !== GAME_STATUS.PROCESS) return;
  cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
}


function startTimer() {
  if (gameState.timerId) clearInterval(gameState.timerId);
  gameState.gameTime = 0;
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    console.log(`Таймер: ${gameState.gameTime} сек.`);
  }, 1000);
}


function endGame(status) {
  gameState.status = status;
  clearInterval(gameState.timerId);
  console.log(`Гру завершено зі статусом: ${status}`);
}


function checkWin() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cell = gameState.field[row][col];
      if (cell.type === CELL_TYPE.EMPTY && cell.state !== CELL_STATE.OPENED) {
        return; 
      }
    }
  }
  endGame(GAME_STATUS.WIN);
}


function initGame() {
  gameState.status = GAME_STATUS.PROCESS;
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field);
  startTimer();
}

initGame();
