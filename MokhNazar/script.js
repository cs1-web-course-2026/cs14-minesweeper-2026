// 1. Моделювання даних (Data Layer)
// Глобальний об'єкт стану гри
let gameState = {
    rows: 8,            // Розмір поля (рядки) - як у нашому HTML (8x8)
    cols: 8,            // Розмір поля (колонки)
    minesCount: 10,     // Кількість мін на полі
    status: 'process',  // 'process' | 'win' | 'lose'
    gameTime: 0,        // Час гри у секундах
    timerId: null       // Ідентифікатор таймера для його зупинки
};

// Двовимірний масив ігрового поля
let field = [];

// 2. Генерація поля та мін
function generateField(rows, cols, minesCount) {
    field = []; // Очищуємо поле перед новою грою
    
    // Ініціалізація порожньої сітки
    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < cols; c++) {
            row.push({
                type: 'empty',   // 'empty' або 'mine'
                neighborMines: 0, // кількість сусідніх мін (0-8)
                state: 'closed'  // 'closed', 'opened' або 'flagged'
            });
        }
        field.push(row);
    }

    // Розстановка мін випадковим чином
    let placedMines = 0;
    while (placedMines < minesCount) {
        let randomRow = Math.floor(Math.random() * rows);
        let randomCol = Math.floor(Math.random() * cols);

        // Якщо в клітинці ще немає міни - ставимо
        if (field[randomRow][randomCol].type !== 'mine') {
            field[randomRow][randomCol].type = 'mine';
            placedMines++;
        }
    }
}

// 3. Алгоритмічна частина (Business Logic)
// Підрахунок сусідніх мін для кожної клітинки
function countNeighbourMines() {
    // Масив зсувів для перевірки 8 сусідів (навколо поточної клітинки)
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {
            // Якщо це міна, їй рахувати сусідів не потрібно
            if (field[r][c].type === 'mine') continue;

            let count = 0;
            // Перевіряємо всіх 8 сусідів
            for (let [dr, dc] of directions) {
                let neighborRow = r + dr;
                let neighborCol = c + dc;

                // Перевірка, чи сусід не виходить за межі поля
                if (neighborRow >= 0 && neighborRow < gameState.rows && 
                    neighborCol >= 0 && neighborCol < gameState.cols) {
                    if (field[neighborRow][neighborCol].type === 'mine') {
                        count++;
                    }
                }
            }
            field[r][c].neighborMines = count;
        }
    }
}

// Логіка відкриття клітинки
function openCell(row, col) {
    // Якщо гра вже закінчена, нічого не робимо
    if (gameState.status !== 'process') return;

    let cell = field[row][col];

    // Якщо клітинка вже відкрита або з прапорцем - нічого не робимо
    if (cell.state === 'opened' || cell.state === 'flagged') return;

    // Якщо натрапили на міну - поразка
    if (cell.type === 'mine') {
        gameState.status = 'lose';
        cell.state = 'opened';
        stopTimer();
        console.log("Game Over! Ви натрапили на міну.");
        return;
    }

    // Відкриваємо поточну клітинку
    cell.state = 'opened';

    // Рекурсія: якщо сусідніх мін немає, автоматично відкриваємо сусідів
    if (cell.neighborMines === 0) {
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];

        for (let [dr, dc] of directions) {
            let neighborRow = row + dr;
            let neighborCol = col + dc;

            if (neighborRow >= 0 && neighborRow < gameState.rows && 
                neighborCol >= 0 && neighborCol < gameState.cols) {
                // Якщо сусід закритий, рекурсивно його відкриваємо
                if (field[neighborRow][neighborCol].state === 'closed') {
                    openCell(neighborRow, neighborCol);
                }
            }
        }
    }
}

// 4. Інтерактив та таймер
// Перемикання прапорця
function toggleFlag(row, col) {
    if (gameState.status !== 'process') return;

    let cell = field[row][col];
    
    // Не можна ставити прапорець на вже відкриту клітинку
    if (cell.state === 'opened') return;

    if (cell.state === 'closed') {
        cell.state = 'flagged';
    } else if (cell.state === 'flagged') {
        cell.state = 'closed';
    }
}

// Запуск таймера
function startTimer() {
    // Якщо таймер вже працює, зупиняємо його перед новим стартом
    if (gameState.timerId) clearInterval(gameState.timerId);
    
    gameState.gameTime = 0;
    gameState.timerId = setInterval(() => {
        gameState.gameTime++;
        // На етапі тестування виводимо в консоль
        // console.log("Time: " + gameState.gameTime); 
    }, 1000);
}

// Зупинка таймера
function stopTimer() {
    if (gameState.timerId) {
        clearInterval(gameState.timerId);
        gameState.timerId = null;
    }
}

// --- ТЕСТОВИЙ ЗАПУСК (Поки без інтерфейсу) ---
// Ці виклики показують, як система працює "під капотом"
generateField(gameState.rows, gameState.cols, gameState.minesCount);
countNeighbourMines();
startTimer();
console.log(field);