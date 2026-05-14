/**
 * ОБ'ЄКТ СТАНУ ГРИ (Data Layer)
 */
const gameState = {
    rows: 10,
    cols: 10,
    minesCount: 15,
    status: 'process', // 'process' | 'win' | 'lose'
    gameTime: 0,
    timerId: null
};

// Двовимірний масив поля
let field = [];

/**
 * ГЕНЕРАЦІЯ ПОЛЯ ТА МІН
 */
function generateField(rows, cols, minesCount) {
    // 1. Ініціалізація порожнього поля
    field = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty',
                state: 'closed', // 'closed', 'opened', 'flagged'
                neighborMines: 0
            });
        }
        field.push(row);
    }

    // 2. Розстановка мін
    let placedMines = 0;
    while (placedMines < minesCount) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        if (field[r][c].type !== 'mine') {
            field[r][c].type = 'mine';
            placedMines++;
        }
    }

    // 3. Підрахунок сусідів
    countNeighbourMines();
}

/**
 * ПІДРАХУНОК СУСІДНІХ МІН (Business Logic)
 */
function countNeighbourMines() {
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (field[r][c].type === 'mine') continue;

            let count = 0;
            // Перевірка 8 сусідів навколо
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                        if (field[nr][nc].type === 'mine') count++;
                    }
                }
            }
            field[r][c].neighborMines = count;
        }
    }
}

/**
 * ЛОГІКА ВІДКРИТТЯ КЛІТИНКИ (Business Logic + Рекурсія)
 */
function openCell(r, c) {
    const cell = field[r][c];

    // Якщо вже відкрита або з прапорцем — нічого не робимо
    if (cell.state === 'opened' || cell.state === 'flagged' || gameState.status !== 'process') {
        return;
    }

    // Якщо міна — поразка
    if (cell.type === 'mine') {
        cell.state = 'opened';
        endGame('lose');
        return;
    }

    // Відкриваємо клітинку
    cell.state = 'opened';

    // Рекурсія: якщо порожня (0 мін поруч), відкриваємо сусідів
    if (cell.neighborMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < gameState.rows && nc >= 0 && nc < gameState.cols) {
                    openCell(nr, nc);
                }
            }
        }
    }

    checkWin();
}

/**
 * РОБОТА З ПРАПОРЦЯМИ
 */
function toggleFlag(r, c) {
    if (gameState.status !== 'process') return;
    
    const cell = field[r][c];
    if (cell.state === 'opened') return;

    cell.state = cell.state === 'flagged' ? 'closed' : 'flagged';
}

/**
 * ТАЙМЕР ТА СТАТУСИ ГРИ
 */
function startTimer() {
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        console.log(`Time: ${gameState.gameTime}s`);
    }, 1000);
}

function endGame(status) {
    gameState.status = status;
    clearInterval(gameState.timerId);
    console.log(`Game Over: ${status}`);
}

function checkWin() {
    let closedSafeCells = 0;
    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            if (field[r][c].type === 'empty' && field[r][c].state !== 'opened') {
                closedSafeCells++;
            }
        }
    }
    if (closedSafeCells === 0) endGame('win');
}

// Ініціалізація першої гри для тесту
generateField(gameState.rows, gameState.cols, gameState.minesCount);
startTimer();
