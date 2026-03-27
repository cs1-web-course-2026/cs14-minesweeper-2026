const GAME_STATUS = { PROCESS: 'process', WIN: 'win', LOSE: 'lose' };
const CELL_TYPE = { MINE: 'mine', EMPTY: 'empty' };
const CELL_STATE = { CLOSED: 'closed', OPENED: 'opened', FLAGGED: 'flagged' };

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  field: []
};

// 1. Допоміжна функція для перевірки меж (порада Аліни)
function isValidCell(r, c) {
  return r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols;
}

function generateField(rows, cols, minesCount) {
  const field = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: CELL_TYPE.EMPTY,
        neighborMines: 0,
        state: CELL_STATE.CLOSED
      });
    }
    field.push(row);
  }

  let placedMines = 0;
  while (placedMines < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (field[r][c].type !== CELL_TYPE.MINE) {
      field[r][c].type = CELL_TYPE.MINE;
      placedMines++;
    }
  }
  return field;
}

function countNeighbourMines(field) {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (field[r][c].type === CELL_TYPE.MINE) continue;
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nr = r + i;
          const nc = c + j;
          // Використовуємо нову функцію isValidCell
          if (isValidCell(nr, nc) && field[nr][nc].type === CELL_TYPE.MINE) {
            count++;
          }
        }
      }
      field[r][c].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state !== CELL_STATE.CLOSED || gameState.status !== GAME_STATUS.PROCESS) return;

  if (cell.type === CELL_TYPE.MINE) {
    cell.state = CELL_STATE.OPENED;
    endGame(GAME_STATUS.LOSE);
    return;
  }

  cell.state = CELL_STATE.OPENED;

  if (cell.neighborMines === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nr = row + i;
        const nc = col + j;
        // Використовуємо нову функцію isValidCell
        if (isValidCell(nr, nc)) {
          openCell(nr, nc);
        }
      }
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
    console.log(`Час гри: ${gameState.gameTime} сек.`);
  }, 1000);
}

function endGame(status) {
  gameState.status = status;
  clearInterval(gameState.timerId);
  console.log(`Гра завершена: ${status === GAME_STATUS.WIN ? 'ПЕРЕМОГА!' : 'ПОРАЗКА!'}`);
}

// 2. Оптимізована перевірка перемоги (через return, щоб вийти з обох циклів одразу)
function checkWin() {
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      const cell = gameState.field[r][c];
      // Якщо знайшли хоча б одну закриту порожню клітинку — гра продовжується
      if (cell.type === CELL_TYPE.EMPTY && cell.state === CELL_STATE.CLOSED) {
        return; 
      }
    }
  }
  // Якщо пройшли всі цикли і не знайшли закритих порожніх клітинок — перемога
  endGame(GAME_STATUS.WIN);
}

function initGame() {
  gameState.status = GAME_STATUS.PROCESS;
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field);
  startTimer();
}

initGame();
