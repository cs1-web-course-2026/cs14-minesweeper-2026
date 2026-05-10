const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
  flagsCount: 0,
  openedCellsCount: 0,
};

let field = [];

function createCell() {
  return {
    type: 'empty',
    neighborMines: 0,
    state: 'closed',
  };
}

function isInsideField(row, col) {
  return row >= 0 && row < gameState.rows && col >= 0 && col < gameState.cols;
}

function getNeighbours(row, col) {
  const neighbours = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
      if (rowOffset === 0 && colOffset === 0) {
        continue;
      }

      const neighbourRow = row + rowOffset;
      const neighbourCol = col + colOffset;

      if (isInsideField(neighbourRow, neighbourCol)) {
        neighbours.push([neighbourRow, neighbourCol]);
      }
    }
  }

  return neighbours;
}

function generateField(rows, cols, minesCount) {
  gameState.rows = rows;
  gameState.cols = cols;
  gameState.minesCount = minesCount;
  gameState.status = 'process';
  gameState.gameTime = 0;
  gameState.flagsCount = 0;
  gameState.openedCellsCount = 0;

  stopTimer();

  const newField = [];

  for (let row = 0; row < rows; row += 1) {
    const fieldRow = [];

    for (let col = 0; col < cols; col += 1) {
      fieldRow.push(createCell());
    }

    newField.push(fieldRow);
  }

  let placedMines = 0;

  while (placedMines < minesCount) {
    const randomRow = Math.floor(Math.random() * rows);
    const randomCol = Math.floor(Math.random() * cols);

    if (newField[randomRow][randomCol].type !== 'mine') {
      newField[randomRow][randomCol].type = 'mine';
      placedMines += 1;
    }
  }

  field = newField;
  countNeighbourMines();

  return field;
}

function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = field[row][col];

      if (cell.type === 'mine') {
        continue;
      }

      const neighbours = getNeighbours(row, col);
      let minesCount = 0;

      for (const [neighbourRow, neighbourCol] of neighbours) {
        if (field[neighbourRow][neighbourCol].type === 'mine') {
          minesCount += 1;
        }
      }

      cell.neighborMines = minesCount;
    }
  }
}

function startTimer() {
  if (gameState.timerId !== null) {
    return;
  }

  gameState.timerId = setInterval(() => {
    if (gameState.status === 'process') {
      gameState.gameTime += 1;
    }
  }, 1000);
}

function stopTimer() {
  if (gameState.timerId !== null) {
    clearInterval(gameState.timerId);
    gameState.timerId = null;
  }
}

function openCell(row, col) {
  if (!isInsideField(row, col)) {
    return;
  }

  if (gameState.status !== 'process') {
    return;
  }

  const cell = field[row][col];

  if (cell.state === 'opened' || cell.state === 'flagged') {
    return;
  }

  startTimer();

  cell.state = 'opened';
  gameState.openedCellsCount += 1;

  if (cell.type === 'mine') {
    gameState.status = 'lose';
    stopTimer();
    openAllMines();
    return;
  }

  if (cell.neighborMines === 0) {
    const neighbours = getNeighbours(row, col);

    for (const [neighbourRow, neighbourCol] of neighbours) {
      const neighbourCell = field[neighbourRow][neighbourCol];

      if (neighbourCell.state === 'closed' && neighbourCell.type === 'empty') {
        openCell(neighbourRow, neighbourCol);
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

  const cell = field[row][col];

  if (cell.state === 'opened') {
    return;
  }

  if (cell.state === 'closed') {
    cell.state = 'flagged';
    gameState.flagsCount += 1;
    return;
  }

  if (cell.state === 'flagged') {
    cell.state = 'closed';
    gameState.flagsCount -= 1;
  }
}

function openAllMines() {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      if (field[row][col].type === 'mine') {
        field[row][col].state = 'opened';
      }
    }
  }
}

function checkWin() {
  const safeCellsCount = gameState.rows * gameState.cols - gameState.minesCount;

  if (gameState.openedCellsCount === safeCellsCount) {
    gameState.status = 'win';
    stopTimer();
  }
}

function restartGame(
  rows = gameState.rows,
  cols = gameState.cols,
  minesCount = gameState.minesCount,
) {
  return generateField(rows, cols, minesCount);
}

function printField(showMines = false) {
  const result = field
    .map((row) =>
      row
        .map((cell) => {
          if (cell.state === 'flagged') {
            return 'F';
          }

          if (cell.state === 'closed' && !showMines) {
            return 'C';
          }

          if (cell.type === 'mine') {
            return 'M';
          }

          return String(cell.neighborMines);
        })
        .join(' '),
    )
    .join('\n');

  console.log(result);
}

generateField(10, 10, 15);
console.log('Гру створено. Стан гри:', gameState);
printField(true);
іі;
