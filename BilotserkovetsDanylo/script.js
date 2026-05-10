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

const boardElement = document.getElementById('board');
const flagCounterElement = document.getElementById('flagCounter');
const timerElement = document.getElementById('timer');
const restartButton = document.getElementById('restartButton');

function createCell() {
  return {
    type: 'empty',
    neighborMines: 0,
    state: 'closed',
    isHit: false,
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
  if (minesCount >= rows * cols) {
    throw new Error('Mines count must be less than total cells count');
  }

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
      updateHeader();
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
    cell.isHit = true;
    gameState.status = 'lose';
    stopTimer();
    openAllMines();
    renderGame();
    showGameMessage();
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
  renderGame();

  if (gameState.status === 'win') {
    showGameMessage();
  }
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
    if (gameState.flagsCount >= gameState.minesCount) {
      return;
    }

    cell.state = 'flagged';
    gameState.flagsCount += 1;
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
    gameState.flagsCount -= 1;
  }

  renderGame();
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

function restartGame() {
  generateField(10, 10, 15);
  renderGame();
}

function updateHeader() {
  const flagsLeft = gameState.minesCount - gameState.flagsCount;

  flagCounterElement.textContent = String(flagsLeft).padStart(3, '0');
  timerElement.textContent = String(gameState.gameTime).padStart(3, '0');

  if (gameState.status === 'win') {
    restartButton.textContent = '😎';
  } else if (gameState.status === 'lose') {
    restartButton.textContent = '😵';
  } else {
    restartButton.textContent = '🙂';
  }
}

function renderBoard() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 28px)`;

  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = field[row][col];
      const button = document.createElement('button');

      button.type = 'button';
      button.classList.add('cell');

      if (cell.state === 'closed') {
        button.classList.add('closed');
        button.setAttribute('aria-label', 'Закрита клітинка');
      }

      if (cell.state === 'flagged') {
        button.classList.add('closed', 'flag');
        button.setAttribute('aria-label', 'Прапорець');
      }

      if (cell.state === 'opened') {
        button.classList.add('open');

        if (cell.type === 'mine') {
          button.classList.add('mine');

          if (cell.isHit) {
            button.classList.add('hit');
            button.setAttribute('aria-label', 'Натиснута міна');
          } else {
            button.setAttribute('aria-label', 'Міна');
          }
        } else if (cell.neighborMines > 0) {
          button.textContent = cell.neighborMines;
          button.classList.add(`n${cell.neighborMines}`);
          button.setAttribute(
            'aria-label',
            `Клітинка з числом ${cell.neighborMines}`,
          );
        } else {
          button.setAttribute('aria-label', 'Порожня клітинка');
        }
      }

      button.addEventListener('click', () => {
        openCell(row, col);
      });

      button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        toggleFlag(row, col);
      });

      boardElement.appendChild(button);
    }
  }
}

function renderGame() {
  updateHeader();
  renderBoard();
}

function showGameMessage() {
  setTimeout(() => {
    if (gameState.status === 'win') {
      alert('Вітаю! Ви перемогли!');
    }

    if (gameState.status === 'lose') {
      alert('Гру завершено! Ви натиснули на міну.');
    }
  }, 100);
}

restartButton.addEventListener('click', restartGame);

restartGame();
