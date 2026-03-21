const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process', 
  gameTime: 0,
  timerId: null,
  field: [] 
};

function generateField(rows, cols, minesCount) {
  const field = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        type: 'empty', 
        neighborMines: 0,
        state: 'closed' 
      });
    }
    field.push(row);
  }

  let placedMines = 0;
  while (placedMines < minesCount) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    if (field[r][c].type !== 'mine') {
      field[r][c].type = 'mine';
      placedMines++;
    }
  }
  return field;
}

function countNeighbourMines(field) {
  const rows = field.length;
  const cols = field[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (field[r][c].type === 'mine') continue;

      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nr = r + i;
          const nc = c + j;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            if (field[nr][nc].type === 'mine') count++;
          }
        }
      }
      field[r][c].neighborMines = count;
    }
  }
}

function openCell(row, col) {
  const cell = gameState.field[row][col];

  if (cell.state !== 'closed' || gameState.status !== 'process') return;

  if (cell.type === 'mine') {
    cell.state = 'opened';
    endGame('lose');
    return;
  }

  cell.state = 'opened';

  if (cell.neighborMines === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nr = row + i;
        const nc = col + j;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
          openCell(nr, nc);
        }
      }
    }
  }
  checkWin();
}

function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state === 'opened' || gameState.status !== 'process') return;

  cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
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
  console.log(`Гра завершена: ${status === 'win' ? 'ПЕРЕМОГА!' : 'ПОРАЗКА!'}`);
}

function checkWin() {
  let hasClosedEmpty = false;
  for (let r = 0; r < gameState.rows; r++) {
    for (let c = 0; c < gameState.cols; c++) {
      if (gameState.field[r][c].type === 'empty' && gameState.field[r][c].state === 'closed') {
        hasClosedEmpty = true;
        break;
      }
    }
  }
  if (!hasClosedEmpty) endGame('win');
}
function initGame() {
  gameState.status = 'process';
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field);
  startTimer();
}

initGame();
