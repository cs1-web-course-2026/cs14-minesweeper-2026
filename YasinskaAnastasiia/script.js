const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
  field: []
};

function createCell() {
  return {
    type: 'empty',
    neighborMines: 0,
    state: 'closed'
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

  for (let dRow = -1; dRow <= 1; dRow++) {
    for (let dCol = -1; dCol <= 1; dCol++) {
      if (dRow === 0 && dCol === 0) {
        continue;
      }

      const newRow = row + dRow;
      const newCol = col + dCol;

      if (isInsideField(newRow, newCol)) {
        neighbors.push([newRow, newCol]);
      }
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

    if (field[randomRow][randomCol].type !== 'mine') {
      field[randomRow][randomCol].type = 'mine';
      placedMines++;
    }
  }

  return field;
}

function countNeighbourMines(field) {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (field[row][col].type === 'mine') {
        continue;
      }

      const neighbors = getNeighbors(row, col);
      let minesAround = 0;

      for (const [neighborRow, neighborCol] of neighbors) {
        if (field[neighborRow][neighborCol].type === 'mine') {
          minesAround++;
        }
      }

      field[row][col].neighborMines = minesAround;
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

function initGame(rows = 10, cols = 10, minesCount = 15) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.status = 'process';
  gameState.gameTime = 0;

  stopTimer();

  gameState.field = generateField(rows, cols, minesCount);
  countNeighbourMines(gameState.field);

  startTimer();
}

function revealAllMines() {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].type === 'mine') {
        gameState.field[row][col].state = 'opened';
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

      if (cell.type === 'empty' && cell.state === 'opened') {
        openedSafeCells++;
      }
    }
  }

  if (openedSafeCells === safeCellsCount) {
    gameState.status = 'win';
    stopTimer();
  }
}

function openCell(row, col) {
  if (!isInsideField(row, col)) {
    return;
  }

  if (gameState.status !== 'process') {
    return;
  }

  const cell = gameState.field[row][col];

  if (cell.state === 'opened' || cell.state === 'flagged') {
    return;
  }

  cell.state = 'opened';

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    revealAllMines();
    stopTimer();
    return;
  }

  if (cell.neighborMines === 0) {
    const neighbors = getNeighbors(row, col);

    for (const [neighborRow, neighborCol] of neighbors) {
      if (gameState.field[neighborRow][neighborCol].state === 'closed') {
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

  if (gameState.status !== 'process') {
    return;
  }

  const cell = gameState.field[row][col];

  if (cell.state === 'opened') {
    return;
  }

  if (cell.state === 'closed') {
    cell.state = 'flagged';
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
  }
}

function printField() {
  const result = gameState.field.map((row) => {
    return row.map((cell) => {
      if (cell.state === 'closed') {
        return '■';
      }

      if (cell.state === 'flagged') {
        return '⚑';
      }

      if (cell.type === 'mine') {
        return '*';
      }

      return cell.neighborMines === 0 ? ' ' : String(cell.neighborMines);
    }).join(' ');
  });

  console.log(result.join('\n'));
  console.log('Статус гри:', gameState.status);
  console.log('Час гри:', gameState.gameTime, 'сек');
}

initGame(10, 10, 15);

// Приклади перевірки:
// openCell(0, 0);
// toggleFlag(1, 1);
// printField();