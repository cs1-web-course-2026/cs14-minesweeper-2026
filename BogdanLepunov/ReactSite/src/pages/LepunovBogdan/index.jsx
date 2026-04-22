import { useState, useEffect } from "react";
import Board from "./components/Board";
import Timer from "./components/Timer";
import RestartButton from "./components/RestartButton";
import styles from "./Game.module.css";

export default function LepunovBogdan() {
  const rows = 5;
  const cols = 5;
  const mines = 5;

  const [field, setField] = useState(() => createField());
  const [time, setTime] = useState(0);
  const [status, setStatus] = useState("play");

  useEffect(() => {
    if (status !== "play") return;

    const t = setInterval(() => {
      setTime(t => t + 1);
    }, 1000);

    return () => clearInterval(t);
  }, [status]);

  function createField() {
    let f = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        mine: false,
        open: false,
        flag: false,
        count: 0
      }))
    );

    let placed = 0;
    while (placed < mines) {
      let r = rand(rows), c = rand(cols);
      if (!f[r][c].mine) {
        f[r][c].mine = true;
        placed++;
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (f[r][c].mine) continue;

        f[r][c].count = neighbors(r, c)
          .filter(([nr, nc]) => f[nr][nc].mine).length;
      }
    }

    return f;
  }

  const rand = max => Math.floor(Math.random() * max);

  const neighbors = (r, c) => {
    let res = [];
    for (let dr = -1; dr <= 1; dr++)
      for (let dc = -1; dc <= 1; dc++) {
        let nr = r + dr, nc = c + dc;
        if (
          nr >= 0 && nr < rows &&
          nc >= 0 && nc < cols &&
          (dr || dc)
        ) res.push([nr, nc]);
      }
    return res;
  };

  function copyField(f) {
    return f.map(row => row.map(cell => ({ ...cell })));
  }

  function openCell(r, c, f = field) {
    if (status !== "play") return;

    let newField = copyField(f);
    let cell = newField[r][c];

    if (cell.open || cell.flag) return;

    cell.open = true;

    if (cell.mine) {
      setStatus("lose");
      revealMines(newField);
      setField(newField);
      return;
    }

    if (cell.count === 0) {
      neighbors(r, c).forEach(([nr, nc]) =>
        openCell(nr, nc, newField)
      );
    }

    setField(newField);
    checkWin(newField);
  }

  function toggleFlag(r, c) {
    if (status !== "play") return;

    let newField = copyField(field);
    let cell = newField[r][c];

    if (!cell.open) cell.flag = !cell.flag;

    setField(newField);
  }

  function revealMines(f) {
    f.forEach(row =>
      row.forEach(cell => {
        if (cell.mine) cell.open = true;
      })
    );
  }

  function checkWin(f) {
    let closed = f.flat().filter(c => !c.open).length;
    if (closed === mines) setStatus("win");
  }

  function startGame() {
    setField(createField());
    setStatus("play");
    setTime(0);
  }

  const flagsLeft =
    mines - field.flat().filter(c => c.flag).length;

  return (
    <div className={styles.game}>
      <div className={styles.panel}>
        <Timer time={time} />
        <RestartButton onClick={startGame} />
        <span>🚩 {flagsLeft}</span>
      </div>

      <Board
        field={field}
        openCell={openCell}
        toggleFlag={toggleFlag}
      />

      {status === "win" && <p> Перемога</p>}
      {status === "lose" && <p> Програш</p>}
    </div>
  );
}