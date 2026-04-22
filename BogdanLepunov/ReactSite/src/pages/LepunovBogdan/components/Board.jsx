import Cell from "./Cell";
import styles from "../Game.module.css";

export default function Board({ field, openCell, toggleFlag }) {
  return (
    <div className={styles.board}>
      {field.map((row, r) =>
        row.map((cell, c) => (
          <Cell
            key={r + "-" + c}
            cell={cell}
            onClick={() => openCell(r, c)}
            onRightClick={(e) => {
              e.preventDefault();
              toggleFlag(r, c);
            }}
          />
        ))
      )}
    </div>
  );
}