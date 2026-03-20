const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process', 
  gameTime: 0,
  timerId: null,
  flagsCount: 0,
  field: [],
};


function createCell() {
  return {
    type: 'empty',       
    state: 'closed',     
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
    if (field[row][col].type !== 'mine') {
      field[row][col].type = 'mine';
      placedMines++;
    }
  }

  countNeighborMines(field, rows, cols);
  return field;
}


function countNeighborMines(field, rows, cols) {
  const directions = [
    [-1,-1],[-1,0],[-1,1],
    [0,-1],       [0,1],
    [1,-1],[1,0],[1,1]
  ];

  for (let r=0; r<rows; r++) {
    for (let c=0; c<cols; c++) {
      if (field[r][c].type === 'mine') continue;
      let count = 0;
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr>=0 && nr<rows && nc>=0 && nc<cols && field[nr][nc].type === 'mine') {
          count++;
        }
      }
      field[r][c].neighborMines = count;
    }
  }
}


function openCell(row, col) {
  if (gameState.status !== 'process') return;
  const cell = gameState.field[row][col];
  if (cell.state === 'opened' || cell.state === 'flagged') return;

  cell.state = 'opened';
  updateCellUI(row, col);

  if (cell.type === 'mine') {
    gameOver(false);
    return;
  }

  if (cell.neighborMines === 0) {
    const directions = [
      [-1,-1],[-1,0],[-1,1],
      [0,-1],       [0,1],
      [1,-1],[1,0],[1,1]
    ];
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr>=0 && nr<gameState.rows && nc>=0 && nc<gameState.cols) {
        openCell(nr, nc);
      }
    }
  }

  checkWin();
}


function toggleFlag(row, col) {
  if (gameState.status !== 'process') return;
  const cell = gameState.field[row][col];
  if (cell.state === 'opened') return;

  if (cell.state === 'closed') {
    cell.state = 'flagged';
    gameState.flagsCount++;
  } else if (cell.state === 'flagged') {
    cell.state = 'closed';
    gameState.flagsCount--;
  }
  updateCellUI(row, col);
  updateFlagsUI();
}


function startTimer() {
  stopTimer();
  gameState.gameTime = 0;
  document.querySelectorAll('.header-item .value')[0].textContent = gameState.gameTime;
  gameState.timerId = setInterval(() => {
    gameState.gameTime++;
    document.querySelectorAll('.header-item .value')[0].textContent = gameState.gameTime;
  }, 1000);
}

function stopTimer() {
  clearInterval(gameState.timerId);
}


function gameOver(win) {
  gameState.status = win ? 'win' : 'lose';
  stopTimer();
  revealAll(win);
  alert(win ? 'Ви виграли!' : 'Ви програли!');
}


function checkWin() {
  let closedOrFlagged = 0;
  for (let r=0; r<gameState.rows; r++) {
    for (let c=0; c<gameState.cols; c++) {
      if (gameState.field[r][c].state !== 'opened') closedOrFlagged++;
    }
  }
  if (closedOrFlagged === gameState.minesCount) {
    gameOver(true);
  }
}


function revealAll(win=false) {
  for (let r=0; r<gameState.rows; r++) {
    for (let c=0; c<gameState.cols; c++) {
      const cell = gameState.field[r][c];
      if (cell.state !== 'opened') {
        if (!win && cell.type === 'mine') cell.state = 'opened';
        updateCellUI(r, c);
      }
    }
  }
}


function updateCellUI(row, col) {
  const index = row * gameState.cols + col;
  const btn = document.querySelectorAll('.game-board .cell')[index];
  const cell = gameState.field[row][col];

  btn.className = 'cell';

  if (cell.state === 'opened') {
    btn.classList.add('revealed');
    if (cell.type === 'mine') btn.textContent = '💣';
    else if (cell.neighborMines > 0) btn.textContent = cell.neighborMines;
  } else if (cell.state === 'flagged') {
    btn.classList.add('flagged');
    btn.textContent = '🚩';
  } else {
    btn.textContent = '';
  }
}

function updateFlagsUI() {
  document.querySelectorAll('.header-item .value')[1].textContent = gameState.flagsCount;
}


function initGame() {
  gameState.field = generateField(gameState.rows, gameState.cols, gameState.minesCount);
  gameState.status = 'process';
  gameState.flagsCount = 0;
  updateFlagsUI();
  startTimer();

 
  const board = document.getElementById('gameBoard');
  board.innerHTML = '';
  for (let r=0; r<gameState.rows; r++) {
    for (let c=0; c<gameState.cols; c++) {
      const btn = document.createElement('button');
      btn.className = 'cell';
      board.appendChild(btn);

      btn.onclick = () => openCell(r, c);
      btn.oncontextmenu = (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      };
    }
  }
}


document.querySelector('.start-button').onclick = initGame;


initGame();