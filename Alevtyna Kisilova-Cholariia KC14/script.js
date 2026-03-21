// 1. Моделювання даних
const gameState = {
  rows: 10,
  cols: 10,
  minesCount: 15,
  status: 'process',
  gameTime: 0,
  timerId: null,
  field: []
};

// 2. Генерація поля та мін
function generateField(rows, cols, minesCount) {
  const field = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({ type: 'empty', neighborMines: 0, state: 'closed' });
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

// 3. Підрахунок мін навколо
function countNeighbourMines(field) {
  for (let r = 0; r < field.length; r++) {
    for (let c = 0; c < field[0].length; c++) {
      if (field[r][c].type === 'mine') continue;
      let count = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const nr = r + i, nc = c + j;
          if (nr >= 0 && nr < field.length && nc >= 0 && nc < field[0].length) {
            if (field[nr][nc].type === 'mine') count++;
          }
        }
      }
      field[r][c].neighborMines = count;
    }
  }
}

// 4. Логіка відкриття (openCell) з рекурсією
function openCell(row, col) {
  const cell = gameState.field[row][col];
  if (cell.state !== 'closed' || gameState.status !== 'process') return;
  if (cell.type === 'mine') {
    cell.state = 'opened';
    gameState.status = 'lose';
    clearInterval(gameState.timerId);
    return;
  }
  cell.state = 'opened';
  if (cell.neighborMines === 0) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const nr = row + i, nc = col + j;
        if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) openCell(nr, nc);
      }
    }
  }
}

// Запуск гри (для перевірки в консолі)
gameState.field = generateField(10, 10, 15);
countNeighbourMines(gameState.field);
gameState.timerId = setInterval(() => { gameState.gameTime++; }, 1000);