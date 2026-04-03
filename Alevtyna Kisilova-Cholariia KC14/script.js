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


const fieldElement = document.getElementById('game-field');
const timerElement = document.querySelector('.timer');
const flagsElement = document.querySelector('.flags-count');
const restartButton = document.querySelector('.btn-start');


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
      for (const [dr, dc] of DIRECTIONS) {
        if (isValidCell(row + dr, col + dc) && field[row + dr][col + dc].type === CELL_TYPE.MINE) {
          count++;
        }
      }
      field[row][col].neighborMines = count;
    }
  }
}


function renderField() {
  fieldElement.innerHTML = '';
  for (let row = 0; row < gameState.rows; row++) {
    for (let col = 0; col < gameState.cols; col++) {
      const cellDiv = document.createElement('div');
      cellDiv.dataset.row = row;
      cellDiv.dataset.col = col;

      cellDiv.addEventListener('click', () => openCell(row, col));
      cellDiv.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        toggleFlag(row, col);
      });

      fieldElement.appendChild(cellDiv);
      updateCellUI(row, col);
    }
  }
}


function updateCellUI(row, col) {
  const cell = gameState.field[row][col];
  const cellDiv = fieldElement.querySelector(`[data-row="${row}"][data-col="${col}"]`);
  
  // Використовуємо ТВОЇ класи з CSS
  cellDiv.className = 'cell'; 

  if (cell.state === CELL_STATE.CLOSED) {
    cellDiv.classList.add('closed');
    cellDiv.textContent = '';
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cellDiv.classList.add('flagged');
    cellDiv.textContent = ''; // Прапорець додається через CSS ::after
  } else if (cell.state === CELL_STATE.OPENED) {
    if (cell.type === CELL_TYPE.MINE) {
      cellDiv.classList.add('mine');
      if (gameState.status === GAME_STATUS.LOSE && cell.exploded) {
          cellDiv.classList.add('exploded');
      }
    } else {
      cellDiv.classList.add('open');
      if (cell.neighborMines > 0) {
        cellDiv.textContent = cell.neighborMines;
        cellDiv.setAttribute('data-number', cell.neighborMines); // Для кольорів цифр
      }
    }
  }
}


function openCell(row, col) {
  if (!isValidCell(row, col)) return;
  const cell = gameState.field[row][col];
  if (cell.state !== CELL_STATE.CLOSED || gameState.status !== GAME_STATUS.PROCESS) return;

  cell.state = CELL_STATE.OPENED;

  if (cell.type === CELL_TYPE.MINE) {
    cell.exploded = true;
    updateCellUI(row, col);
    endGame(GAME_STATUS.LOSE);
    return;
  }

  updateCellUI(row, col);

  if (cell.neighborMines === 0) {
    for (const [dr, dc] of DIRECTIONS) {
      openCell(row + dr, col + dc);
    }
  }
  checkWin();
}


function toggleFlag(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state === CELL_STATE.OPENED || gameState.status !== GAME_STATUS.PROCESS) return;

  cell.state = cell.state === CELL_STATE.FLAGGED ? CELL_STATE.CLOSED : CELL_STATE.FLAGGED;
  
  const currentFlags = gameState.field.flat().filter(c => c.state === CELL_STATE.FLAGGED).length;
  flagsElement.textContent = `${gameState.minesCount - currentFlags}🚩`;
  
  updateCellUI(row, col);
}


function startTimer() {
  if (gameState.timerId) clearInterval(gameState.timerId);
  gameState.gameTime = 0;
  timerElement.textContent = '00:00';
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    const mins = Math.floor(gameState.gameTime / 60).toString().padStart(2, '0');
    const secs = (gameState.gameTime % 60).toString().padStart(2, '0');
    timerElement.textContent = `${mins}:${secs}`;
  }, 1000);
}


function endGame(status) {
  gameState.status = status;
  clearInterval(gameState.timerId);
  
  if (status === GAME_STATUS.LOSE) {
    gameState.field.forEach((r, rowIdx) => r.forEach((c, colIdx) => {
      if (c.type === CELL_TYPE.MINE) {
        c.state = CELL_STATE.OPENED;
        updateCellUI(rowIdx, colIdx);
      }
    }));
  }
}


function checkWin() {
  const isWin = gameState.field.every(row => 
    row.every(cell => cell.type === CELL_TYPE.MINE || cell.state === CELL_STATE.OPENED)
  );
  if (isWin) endGame(GAME_STATUS.WIN);
}


function initGame() {
  gameState.status = GAME_STATUS.PROCESS;
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  countNeighbourMines(gameState.field);
  flagsElement.textContent = `${gameState.minesCount}🚩`;
  startTimer();
  renderField();
}


restartButton.addEventListener('click', initGame);
initGame();