const fieldEl = document.getElementById("field");
const timerEl = document.getElementById("timer");
const flagsEl = document.getElementById("flags");
const restartBtn = document.getElementById("restart");

const state = {
  rows: 5,
  cols: 5,
  mines: 5,
  field: [],
  time: 0,
  timer: null,
  status: "play"
};


function createField() {
  state.field = Array.from({ length: state.rows }, () =>
    Array.from({ length: state.cols }, () => ({
      mine: false,
      open: false,
      flag: false,
      count: 0
    }))
  );

 
  let placed = 0;
  while (placed < state.mines) {
    let r = rand(state.rows);
    let c = rand(state.cols);

    if (!state.field[r][c].mine) {
      state.field[r][c].mine = true;
      placed++;
    }
  }

  
  forEachCell((cell, r, c) => {
    if (cell.mine) return;

    cell.count = neighbors(r, c)
      .filter(([nr, nc]) => state.field[nr][nc].mine)
      .length;
  });
}

const rand = max => Math.floor(Math.random() * max);

const neighbors = (r, c) => {
  let res = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      let nr = r + dr, nc = c + dc;
      if (
        nr >= 0 && nr < state.rows &&
        nc >= 0 && nc < state.cols &&
        (dr || dc)
      ) res.push([nr, nc]);
    }
  return res;
};

const forEachCell = (fn) => {
  state.field.forEach((row, r) =>
    row.forEach((cell, c) => fn(cell, r, c))
  );
};

function openCell(r, c) {
  let cell = state.field[r][c];
  if (state.status !== "play" || cell.open || cell.flag) return;

  cell.open = true;

  if (cell.mine) return lose();

  if (cell.count === 0) {
    neighbors(r, c).forEach(([nr, nc]) => openCell(nr, nc));
  }

  checkWin();
}

function toggleFlag(r, c) {
  let cell = state.field[r][c];
  if (!cell.open) cell.flag = !cell.flag;
}

function checkWin() {
  let closed = state.field.flat().filter(c => !c.open).length;
  if (closed === state.mines) win();
}

function win() {
  state.status = "win";
  stopTimer();
  alert("🎉 Победа!");
}

function lose() {
  state.status = "lose";
  stopTimer();
  alert("💥 Проигрыш");
  forEachCell(c => c.mine && (c.open = true));
}

function render() {
  fieldEl.innerHTML = "";
  fieldEl.style.gridTemplateColumns = `repeat(${state.cols}, 50px)`;

  forEachCell((cell, r, c) => {
    let el = document.createElement("div");
    el.className = "cell";

    if (cell.open) {
      el.classList.add("open");

      if (cell.mine) el.textContent = "💣";
      else if (cell.count) el.textContent = cell.count;
    }

    if (cell.flag) el.textContent = "🚩";

    el.onclick = () => { openCell(r, c); render(); };
    el.oncontextmenu = (e) => {
      e.preventDefault();
      toggleFlag(r, c);
      render();
    };

    fieldEl.appendChild(el);
  });

  timerEl.textContent = state.time;
  flagsEl.textContent = state.mines - state.field.flat().filter(c => c.flag).length;
}

function startTimer() {
  state.timer = setInterval(() => {
    state.time++;
    timerEl.textContent = state.time;
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timer);
}

function start() {
  stopTimer();
  state.time = 0;
  state.status = "play";
  createField();
  startTimer();
  render();
}

restartBtn.onclick = start;

document.addEventListener("contextmenu", e => e.preventDefault());

start();