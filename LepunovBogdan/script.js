const gameState = {
    rows: 5,
    cols: 5,
    minesCount: 5,
    status: "process",
    gameTime: 0,
    timerId: null
};

let field = [];

const fieldElement = document.querySelector(".field");
const timerElement = document.querySelector(".header div:first-child");
const flagsElement = document.querySelector(".header div:last-child");
const newGameButton = document.querySelector("button");


function createCell() {
    return {
        type: "empty",
        neighborMines: 0,
        state: "closed"
    };
}


function generateField(rows, cols, minesCount) {

    field = [];

    for (let r = 0; r < rows; r++) {
        const row = [];

        for (let c = 0; c < cols; c++) {
            row.push(createCell());
        }

        field.push(row);
    }

    let minesPlaced = 0;

    while (minesPlaced < minesCount) {

        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);

        if (field[r][c].type !== "mine") {
            field[r][c].type = "mine";
            minesPlaced++;
        }
    }

    countNeighbourMines();
}


function countNeighbourMines() {

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {

            if (field[r][c].type === "mine") continue;

            let count = 0;

            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {

                    const nr = r + dr;
                    const nc = c + dc;

                    if (
                        nr >= 0 &&
                        nr < gameState.rows &&
                        nc >= 0 &&
                        nc < gameState.cols &&
                        field[nr][nc].type === "mine"
                    ) {
                        count++;
                    }
                }
            }

            field[r][c].neighborMines = count;
        }
    }
}


function openCell(row, col) {

    if (gameState.status !== "process") return;

    const cell = field[row][col];

    if (cell.state === "opened" || cell.state === "flagged") return;

    cell.state = "opened";

    if (cell.type === "mine") {
        cell.clicked = true;
        gameOver();
        renderField();
        return;
    }

    if (cell.neighborMines === 0) {

        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {

                const nr = row + dr;
                const nc = col + dc;

                if (
                    nr >= 0 &&
                    nr < gameState.rows &&
                    nc >= 0 &&
                    nc < gameState.cols
                ) {
                    openCell(nr, nc);
                }
            }
        }
    }

    checkWin();
    renderField();
}


function toggleFlag(row, col) {

    if (gameState.status !== "process") return;

    const cell = field[row][col];

    if (cell.state === "opened") return;

    if (cell.state === "closed") {
        cell.state = "flagged";
    } else if (cell.state === "flagged") {
        cell.state = "closed";
    }

    renderField();
}


function checkWin() {

    let closed = 0;

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {

            if (field[r][c].state !== "opened") {
                closed++;
            }
        }
    }

    if (closed === gameState.minesCount) {
        gameState.status = "win";
        stopTimer();
        alert("Ви виграли!");
    }
}


function gameOver() {

    gameState.status = "lose";
    stopTimer();

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {

            if (field[r][c].type === "mine") {
                field[r][c].state = "opened";
            }
        }
    }

    alert("Ви програли!");
}


function renderField() {

    fieldElement.innerHTML = "";

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {

            const cell = field[r][c];

            const cellElement = document.createElement("div");
            cellElement.classList.add("cell");

            if (cell.state === "opened") {

                cellElement.classList.add("open");

                if (cell.type === "mine") {

                    cellElement.classList.add("mine");

                    if (cell.clicked) {
                        cellElement.classList.add("clicked");
                    }

                } else if (cell.neighborMines > 0) {

                    cellElement.textContent = cell.neighborMines;
                }
            }

            if (cell.state === "flagged") {
                cellElement.classList.add("flag");
            }

            cellElement.addEventListener("click", () => openCell(r, c));

            cellElement.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                toggleFlag(r, c);
            });

            fieldElement.appendChild(cellElement);
        }
    }

    updateFlags();
}


function updateFlags() {

    let flags = 0;

    for (let r = 0; r < gameState.rows; r++) {
        for (let c = 0; c < gameState.cols; c++) {

            if (field[r][c].state === "flagged") {
                flags++;
            }
        }
    }

    flagsElement.textContent = "🚩 " + (gameState.minesCount - flags);
}


function startTimer() {

    gameState.timerId = setInterval(() => {

        gameState.gameTime++;

        const minutes = String(Math.floor(gameState.gameTime / 60)).padStart(2, "0");
        const seconds = String(gameState.gameTime % 60).padStart(2, "0");

        timerElement.textContent = `⏱ ${minutes}:${seconds}`;

    }, 1000);
}


function stopTimer() {
    clearInterval(gameState.timerId);
}


function newGame() {

    stopTimer();

    gameState.status = "process";
    gameState.gameTime = 0;

    timerElement.textContent = "⏱ 00:00";

    generateField(gameState.rows, gameState.cols, gameState.minesCount);

    renderField();

    startTimer();
}


newGameButton.addEventListener("click", newGame);

newGame();