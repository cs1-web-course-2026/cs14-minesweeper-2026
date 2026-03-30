const CELL_STATE = { CLOSED: 'closed', OPEN: 'open', FLAGGED: 'flagged' };
const GAME_STATUS = { PLAYING: 'playing', WON: 'won', LOST: 'lost' };
const GRID_SIZE = 9;
const MINE_COUNT = 10;
const DIRECTIONS = [
  [-1, -1],
  [-1,  0],
  [-1,  1],
  [ 0, -1],
  [ 0,  1],
  [ 1, -1],
  [ 1,  0],
  [ 1,  1],
];

let board = [];
let gameStatus = '';
let startTime = 0;
let timerInterval = null;
let flaggedCount = 0;

function generateField() {
  board = Array(GRID_SIZE).fill().map(() => 
    Array(GRID_SIZE).fill().map(() => ({ 
      hasMine: false, 
      state: CELL_STATE.CLOSED, 
      adjacentMines: 0 
    }))
  );
  
  let minesPlaced = 0;
  while (minesPlaced < MINE_COUNT) {
    const row = Math.floor(Math.random() * GRID_SIZE);
    const col = Math.floor(Math.random() * GRID_SIZE);
    
    if (!board[row][col].hasMine) {
      board[row][col].hasMine = true;
      minesPlaced++;
    }
  }
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!board[row][col].hasMine) {
        board[row][col].adjacentMines = countNeighbourMines(row, col);
      }
    }
  }
}


function countNeighbourMines(row, col) {
  let count = 0;
  for (const [neighbourRow, neighbourCol] of DIRECTIONS) {
    const neighbourRow = row + neighbourRow;  // rename the direction destructure too
const neighbourCol = col + neighbourCol;
if (neighbourRow >= 0 && neighbourRow < GRID_SIZE && neighbourCol >= 0 && neighbourCol < GRID_SIZE) {
  if (board[neighbourRow][neighbourCol].hasMine) {
    count++;
      }
    }
  }
  
  return count;
}

function openCell(row, col) {
  if (gameStatus !== GAME_STATUS.PLAYING) return;
  
  const cell = board[row][col];
  if (cell.state !== CELL_STATE.CLOSED) return;
  
  cell.state = CELL_STATE.OPEN;
  
  if (cell.hasMine) {
    gameStatus = GAME_STATUS.LOST;
    revealAllMines();
    stopTimer();
    return;
  }
  
  if (cell.adjacentMines === 0) {
    for (const [neighbourRow, neighbourCol] of DIRECTIONS) {
      const newRow = row + neighbourRow;
      const newCol = col + neighbourCol;
      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        if (board[newRow][newCol].state === CELL_STATE.CLOSED) {
          openCell(newRow, newCol);
        }
      }
    }
  }
  
  checkWinCondition();
}

function toggleFlag(row, col) {
  if (gameStatus !== GAME_STATUS.PLAYING) return;
  
  const cell = board[row][col];
  if (cell.state === CELL_STATE.OPEN) return;
  
  if (cell.state === CELL_STATE.CLOSED) {
    if (flaggedCount < MINE_COUNT) {
      cell.state = CELL_STATE.FLAGGED;
      flaggedCount++;
    }
  } else if (cell.state === CELL_STATE.FLAGGED) {
    cell.state = CELL_STATE.CLOSED;
    flaggedCount--;
  }
  
  updateMineCounter();
}

function checkWinCondition() {
  let closedCount = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (!board[row][col].hasMine && board[row][col].state !== CELL_STATE.OPEN) {
        closedCount++;
      }
    }
  }
  
  if (closedCount === 0) {
    gameStatus = GAME_STATUS.WON;
    stopTimer();
  }
}

function revealAllMines() {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col].hasMine) {
        board[row][col].state = CELL_STATE.OPEN;
      }
    }
  }
}

function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    updateTimer(elapsed);
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

function updateTimer(seconds) {
  const timerElement = document.getElementById('timer-counter');
  timerElement.textContent = String(seconds).padStart(3, '0');
}

function updateMineCounter() {
  const minesLeft = MINE_COUNT - flaggedCount;
  const counterElement = document.getElementById('mine-counter');
  counterElement.textContent = String(Math.max(0, minesLeft)).padStart(3, '0');
}

function resetGame() {
  board = [];
  gameStatus = GAME_STATUS.PLAYING;
  flaggedCount = 0;
  stopTimer();
  generateField();
  startTimer();
  updateMineCounter();
  renderBoard();
}

function renderBoard() {
  const field = document.querySelector('.field');
  const cells = field.querySelectorAll('.cell');
  
  let cellIndex = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = cells[cellIndex];
      const boardCell = board[row][col];
      
      cell.className = 'cell';
      cell.textContent = '';
      cell.dataset.row = row;
      cell.dataset.col = col;
      
      if (boardCell.state === CELL_STATE.OPEN) {
        cell.classList.add('opened');
        if (boardCell.hasMine) {
          cell.textContent = '💣';
        } else if (boardCell.adjacentMines > 0) {
          cell.textContent = boardCell.adjacentMines;
          cell.classList.add(`number-${boardCell.adjacentMines}`);
        }
      } else if (boardCell.state === CELL_STATE.FLAGGED) {
        cell.classList.add('flagged');
        cell.textContent = '🚩';
      }
      
      cellIndex++;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const field = document.querySelector('.field');
  
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    field.appendChild(document.createElement('div')).className = 'cell';
  }
  
  const resetButton = document.querySelector('.reset-button');
  
  field.addEventListener('click', (event) => {
    if (!event.target.classList.contains('cell')) return;
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    openCell(row, col);
    renderBoard();
  });
  
  field.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    if (!event.target.classList.contains('cell')) return;
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    toggleFlag(row, col);
    renderBoard();
  });
  
  resetButton.addEventListener('click', resetGame);
  
  resetGame();
});
