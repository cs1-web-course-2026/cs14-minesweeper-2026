const GAME_STATUS = {
  PROCESS: 'process',
  WIN: 'win',
  LOSE: 'lose',
};

const CELL_TYPE = {
  EMPTY: 'empty',
  MINE: 'mine',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPENED: 'opened',
  FLAGGED: 'flagged',
};

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PROCESS,
  gameTime: 0,
  timerId: null,
  flagsCount: 0,
  openedCellsCount: 0,
  field: [],
};

const boardElement = document.getElementById('board');
const flagCounterElement = document.getElementById('flagCounter');
const timerElement = document.getElementById('timer');
const restartButton = document.getElementById('restartButton');
const gameMessageElement = document.getElementById('game-message');

function createCell() {
  return {
    type: CELL_TYPE.EMPTY,
    neighborMines: 0,
    state: CELL_STATE.CLOSED,
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
  gameState.status = GAME_STATUS.PROCESS;
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

    if (newField[randomRow][randomCol].type !== CELL_TYPE.MINE) {
      newField[randomRow][randomCol].type = CELL_TYPE.MINE;
      placedMines += 1;
    }
  }

  gameState.field = newField;
  countNeighbourMines();
}

function countNeighbourMines() {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = gameState.field[row][col];

      if (cell.type === CELL_TYPE.MINE) {
        continue;
      }

      const neighbours = getNeighbours(row, col);
      let minesCount = 0;

      for (const [neighbourRow, neighbourCol] of neighbours) {
        if (
          gameState.field[neighbourRow][neighbourCol].type === CELL_TYPE.MINE
        ) {
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
    if (gameState.status === GAME_STATUS.PROCESS) {
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

  if (gameState.status !== GAME_STATUS.PROCESS) {
    return;
  }

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) {
    return;
  }

  startTimer();

  cell.state = CELL_STATE.OPENED;
  gameState.openedCellsCount += 1;

  if (cell.type === CELL_TYPE.MINE) {
    cell.isHit = true;
    gameState.status = GAME_STATUS.LOSE;
    stopTimer();
    openAllMines();
    renderGame();
    showGameMessage();
    return;
  }

  if (cell.neighborMines === 0) {
    const neighbours = getNeighbours(row, col);

    for (const [neighbourRow, neighbourCol] of neighbours) {
      const neighbourCell = gameState.field[neighbourRow][neighbourCol];

      if (
        neighbourCell.state === CELL_STATE.CLOSED &&
        neighbourCell.type === CELL_TYPE.EMPTY
      ) {
        openCell(neighbourRow, neighbourCol);
      }
    }
  }

  checkWin();
  renderGame();

  if (gameState.status === GAME_STATUS.WIN) {
    showGameMessage();
  }
}

function toggleFlag(row, col) {
  if (!isInsideField(row, col)) {
    return;
  }

  if (gameState.status !== GAME_STATUS.PROCESS) {
    return;
  }

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPENED) {
    return;
  }

  if (cell.state === CELL_STATE.CLOSED) {
    if (gameState.flagsCount >= gameState.minesCount) {
      return;
    }

    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsCount += 1;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsCount -= 1;
  }

  renderGame();
}

function openAllMines() {
  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      if (gameState.field[row][col].type === CELL_TYPE.MINE) {
        gameState.field[row][col].state = CELL_STATE.OPENED;
      }
    }
  }
}

function checkWin() {
  const safeCellsCount = gameState.rows * gameState.cols - gameState.minesCount;

  if (gameState.openedCellsCount === safeCellsCount) {
    gameState.status = GAME_STATUS.WIN;
    stopTimer();
  }
}

function restartGame() {
  generateField(10, 10, 15);
  showGameMessage();
  renderGame();
}

function updateHeader() {
  const flagsLeft = gameState.minesCount - gameState.flagsCount;

  flagCounterElement.textContent = String(flagsLeft).padStart(3, '0');
  timerElement.textContent = String(gameState.gameTime).padStart(3, '0');

  if (gameState.status === GAME_STATUS.WIN) {
    restartButton.textContent = '😎';
  } else if (gameState.status === GAME_STATUS.LOSE) {
    restartButton.textContent = '😵';
  } else {
    restartButton.textContent = '🙂';
  }
}

function getCellAriaLabel(cell, row, col) {
  const position = `Рядок ${row + 1}, стовпець ${col + 1}`;

  if (cell.state === CELL_STATE.CLOSED) {
    return `${position}, закрита клітинка`;
  }

  if (cell.state === CELL_STATE.FLAGGED) {
    return `${position}, клітинка з прапорцем`;
  }

  if (cell.type === CELL_TYPE.MINE && cell.isHit) {
    return `${position}, натиснута міна`;
  }

  if (cell.type === CELL_TYPE.MINE) {
    return `${position}, міна`;
  }

  if (cell.neighborMines > 0) {
    return `${position}, клітинка з числом ${cell.neighborMines}`;
  }

  return `${position}, порожня клітинка`;
}

function renderBoard() {
  boardElement.innerHTML = '';
  boardElement.style.gridTemplateColumns = `repeat(${gameState.cols}, 28px)`;

  for (let row = 0; row < gameState.rows; row += 1) {
    for (let col = 0; col < gameState.cols; col += 1) {
      const cell = gameState.field[row][col];
      const button = document.createElement('button');

      button.type = 'button';
      button.classList.add('cell');
      button.setAttribute('aria-label', getCellAriaLabel(cell, row, col));

      if (cell.state === CELL_STATE.CLOSED) {
        button.classList.add('closed');
      }

      if (cell.state === CELL_STATE.FLAGGED) {
        button.classList.add('closed', 'flag');
      }

      if (cell.state === CELL_STATE.OPENED) {
        button.classList.add('open');

        if (cell.type === CELL_TYPE.MINE) {
          button.classList.add('mine');

          if (cell.isHit) {
            button.classList.add('hit');
          }
        } else if (cell.neighborMines > 0) {
          button.textContent = cell.neighborMines;
          button.classList.add(`n${cell.neighborMines}`);
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
  if (gameState.status === GAME_STATUS.WIN) {
    gameMessageElement.textContent = 'Вітаю! Ви перемогли!';
  } else if (gameState.status === GAME_STATUS.LOSE) {
    gameMessageElement.textContent = 'Гру завершено! Ви натиснули на міну.';
  } else {
    gameMessageElement.textContent = '';
  }
}

restartButton.addEventListener('click', restartGame);

restartGame();
