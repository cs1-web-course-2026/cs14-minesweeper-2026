// --- КОНСТАНТИ (Enums та налаштування) ---
const GAME_STATUS = {
    PLAYING: 'playing',
    WON: 'won',
    LOST: 'lost'
};

const CELL_STATE = {
    CLOSED: 'closed',
    OPENED: 'opened',
    FLAGGED: 'flagged'
};

const CELL_CONTENT = {
    MINE: 'mine',
    EMPTY: 'empty'
};

const DEFAULT_ROWS = 8;
const DEFAULT_COLS = 8;
const DEFAULT_MINE_COUNT = 10;

const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
];

// --- ГЛОБАЛЬНИЙ СТАН ---
let gameState = {
    rows: DEFAULT_ROWS,
    cols: DEFAULT_COLS,
    minesCount: DEFAULT_MINE_COUNT,
    status: GAME_STATUS.PLAYING,
    gameTime: 0,
    timerId: null
};

let field = [];

// --- ЛОГІКА ГРИ ---

function generateField(rows = DEFAULT_ROWS, cols = DEFAULT_COLS, minesCount = DEFAULT_MINE_COUNT) {
    gameState.rows = rows;
    gameState.cols = cols;
    gameState.minesCount = minesCount;
    gameState.status = GAME_STATUS.PLAYING;
    
    stopTimer(); // Зупиняємо таймер, якщо він працював
    field = []; 

    for (let row = 0; row < rows; row++) {
        let currentRow = [];
        for (let col = 0; col < cols; col++) {
            currentRow.push({
                type: CELL_CONTENT.EMPTY,
                neighborMines: 0,
                state: CELL_STATE.CLOSED
            });
        }
        field.push(currentRow);
    }

    let placedMines = 0;
    // Захист від нескінченного циклу
    if (minesCount >= rows * cols) return; 

    while (placedMines < minesCount) {
        let randomRow = Math.floor(Math.random() * rows);
        let randomCol = Math.floor(Math.random() * cols);

        if (field[randomRow][randomCol].type !== CELL_CONTENT.MINE) {
            field[randomRow][randomCol].type = CELL_CONTENT.MINE;
            placedMines++;
        }
    }
}

function countNeighbourMines() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            if (field[row][col].type === CELL_CONTENT.MINE) continue;

            let count = 0;
            for (let [directionalRow, directionalCol] of DIRECTIONS) {
                let neighbourRow = row + directionalRow;
                let neighbourCol = col + directionalCol;

                if (neighbourRow >= 0 && neighbourRow < gameState.rows && 
                    neighbourCol >= 0 && neighbourCol < gameState.cols) {
                    if (field[neighbourRow][neighbourCol].type === CELL_CONTENT.MINE) {
                        count++;
                    }
                }
            }
            field[row][col].neighborMines = count;
        }
    }
}

function openCell(row, col) {
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    let cell = field[row][col];

    if (cell.state === CELL_STATE.OPENED || cell.state === CELL_STATE.FLAGGED) return;

    if (cell.type === CELL_CONTENT.MINE) {
        gameState.status = GAME_STATUS.LOST;
        cell.state = CELL_STATE.OPENED;
        stopTimer();
        console.log("Game Over! Ви натрапили на міну.");
        return;
    }

    cell.state = CELL_STATE.OPENED;

    if (cell.neighborMines === 0) {
        for (let [directionalRow, directionalCol] of DIRECTIONS) {
            let neighbourRow = row + directionalRow;
            let neighbourCol = col + directionalCol;

            if (neighbourRow >= 0 && neighbourRow < gameState.rows && 
                neighbourCol >= 0 && neighbourCol < gameState.cols) {
                if (field[neighbourRow][neighbourCol].state === CELL_STATE.CLOSED) {
                    openCell(neighbourRow, neighbourCol);
                }
            }
        }
    }

    checkWinCondition();
}

function checkWinCondition() {
    for (let row = 0; row < gameState.rows; row++) {
        for (let col = 0; col < gameState.cols; col++) {
            let cell = field[row][col];
            // Якщо є хоча б одна безпечна клітинка, яка ще закрита — гра триває
            if (cell.type !== CELL_CONTENT.MINE && cell.state !== CELL_STATE.OPENED) {
                return; 
            }
        }
    }

    // Всі безпечні клітинки відкриті
    gameState.status = GAME_STATUS.WON;
    stopTimer();
    console.log('You win!');
}

function toggleFlag(row, col) {
    if (gameState.status !== GAME_STATUS.PLAYING) return;

    let cell = field[row][col];
    
    if (cell.state === CELL_STATE.OPENED) return;

    if (cell.state === CELL_STATE.CLOSED) {
        cell.state = CELL_STATE.FLAGGED;
    } else if (cell.state === CELL_STATE.FLAGGED) {
        cell.state = CELL_STATE.CLOSED;
    }
}

function startTimer() {
    if (gameState.timerId) clearInterval(gameState.timerId);
    
    gameState.gameTime = 0;
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
    }, 1000);
}

function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}