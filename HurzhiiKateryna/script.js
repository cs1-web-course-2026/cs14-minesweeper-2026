const GAME_STATUS = {
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
};

const CELL_STATE = {
  CLOSED: 'closed',
  OPEN: 'opened',
  FLAGGED: 'flagged',
};

const CELL_CONTENT = {
  MINE: 'mine',
  EMPTY: 'empty',
};

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1],
];

const timerElement = document.getElementById('timer');
const flagsElement = document.getElementById('flags');
const gameMessageElement = document.getElementById('game-message');

const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: GAME_STATUS.PLAYING,
  gameTime: 0,
  timerId: null,
  flagsCount: 0,
  field: [],
};

function createCell() {
  return {
    type: CELL_CONTENT.EMPTY,
    state: CELL_STATE.CLOSED,
    neighborMines: 0,
  };
}

function generateField(rows, cols, minesCount) {
  const field = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => createCell())
  );

  let placedMines = 0;

  while (placedMines < minesCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);

    if (field[row][col].type !== CELL_CONTENT.MINE) {
      field[row][col].type = CELL_CONTENT.MINE;
      placedMines++;
    }
  }

  countNeighborMines(field, rows, cols);
  return field;
}

function countNeighborMines(field, rows, cols) {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {

      if (field[row][col].type === CELL_CONTENT.MINE) continue;

      let mineCount = 0;

      
      for (const [directionalRow, directionalCol] of DIRECTIONS) {
        const neighbourRow = row + directionalRow;
        const neighbourCol = col + directionalCol;

        if (
          neighbourRow >= 0 &&
          neighbourRow < rows &&
          neighbourCol >= 0 &&
          neighbourCol < cols &&
          field[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE
        ) {
          mineCount++;
        }
      }

      field[row][col].neighborMines = mineCount;
    }
  }
}

function openCell(row, col) {
  if (gameState.status !== GAME_STATUS.PLAYING) return;

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPEN || cell.state === CELL_STATE.FLAGGED) return;

  cell.state = CELL_STATE.OPEN;
  updateCellUI(row, col);

  if (cell.type === CELL_CONTENT.MINE) {
    gameOver(false);
    return;
  }

  if (cell.neighborMines === 0) {
    for (const [directionalRow, directionalCol] of DIRECTIONS) {
      const neighbourRow = row + directionalRow;
      const neighbourCol = col + directionalCol;

      if (
        neighbourRow >= 0 &&
        neighbourRow < gameState.rows &&
        neighbourCol >= 0 &&
        neighbourCol < gameState.cols
      ) {
        openCell(neighbourRow, neighbourCol);
      }
    }
  }

  checkWin();
}

function toggleFlag(row, col) {
  if (gameState.status !== GAME_STATUS.PLAYING) return;

  const cell = gameState.field[row][col];

  if (cell.state === CELL_STATE.OPEN) return;

  if (cell.state === CELL_STATE.CLOSED) {
    cell.state = CELL_STATE.FLAGGED;
    gameState.flagsCount++;
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
    gameState.flagsCount--;
  }

  updateCellUI(row, col);
  updateFlagsUI();
}

function startTimer() {
  stopTimer();

  gameState.gameTime = 0;
  timerElement.textContent = gameState.gameTime;

  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    timerElement.textContent = gameState.gameTime;
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
}

function gameOver(win) {
  gameState.status = win ? GAME_STATUS.WON : GAME_STATUS.LOST;

  stopTimer();
  revealAll(win);

  
  gameMessageElement.textContent = win
    ? 'Ви виграли! 🎉'
    : 'Ви програли! 💣';
}

function checkWin() {
  let closedOrFlagged = 0;

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      if (gameState.field[row][col].state !== CELL_STATE.OPEN) {
        closedOrFlagged++;
      }
    }
  }

  if (closedOrFlagged === gameState.minesCount) {
    gameOver(true);
  }
}

function revealAll(win = false) {
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {

      const cell = gameState.field[row][col];

      if (cell.state !== CELL_STATE.OPEN) {

        if (!win && cell.type === CELL_CONTENT.MINE) {
          cell.state = CELL_STATE.OPEN;
        }

        updateCellUI(row, col);
      }
    }
  }
}

function updateCellUI(row, col) {
  const index = row * gameState.cols + col;
  const cellButton = document.querySelectorAll('.game-board .cell')[index];
  const cell = gameState.field[row][col];

  cellButton.className = 'cell';

  if (cell.state === CELL_STATE.OPEN) {
    cellButton.classList.add('revealed');

    if (cell.type === CELL_CONTENT.MINE) {
      cellButton.textContent = '💣';
      cellButton.setAttribute('aria-label', 'Міна');
    } else if (cell.neighborMines > 0) {
      cellButton.textContent = cell.neighborMines;
      cellButton.setAttribute('aria-label', `Клітинка, ${cell.neighborMines} мін поруч`);
    } else {
      cellButton.setAttribute('aria-label', 'Порожня клітинка');
    }

  } else if (cell.state === CELL_STATE.FLAGGED) {
    cellButton.classList.add('flagged');
    cellButton.textContent = '🚩';
    cellButton.setAttribute('aria-label', 'Позначена клітинка');

  } else {
    cellButton.textContent = '';
    cellButton.setAttribute('aria-label', 'Закрита клітинка');
  }
}

function updateFlagsUI() {
  flagsElement.textContent = gameState.flagsCount;
}

function initGame() {
  gameState.field = generateField(
    gameState.rows,
    gameState.cols,
    gameState.minesCount
  );

  gameState.status = GAME_STATUS.PLAYING;
  gameState.flagsCount = 0;

  updateFlagsUI();
  startTimer();

  const board = document.getElementById('gameBoard');
  board.innerHTML = '';

  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {

      const cellButton = document.createElement('button');

      cellButton.type = 'button';
      cellButton.className = 'cell';
      cellButton.setAttribute('role', 'gridcell');
      cellButton.setAttribute(
        'aria-label',
        `Рядок ${row + 1}, стовпець ${col + 1}, закрита клітинка`
      );

      board.appendChild(cellButton);

      cellButton.onclick = () => openCell(row, col);

      cellButton.oncontextmenu = (e) => {
        e.preventDefault();
        toggleFlag(row, col);
      };
    }
  }
}

document.querySelector('.start-button').onclick = initGame;

initGame();