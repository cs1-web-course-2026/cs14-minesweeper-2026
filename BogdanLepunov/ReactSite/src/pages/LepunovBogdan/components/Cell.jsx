import styles from "../Game.module.css";

export default function Cell({ cell, onClick, onRightClick }) {
  let content = "";

  if (cell.flag) content = "🚩";
  else if (cell.open) {
    if (cell.mine) content = "💣";
    else if (cell.count) content = cell.count;
  }

  return (
    <div
      className={`${styles.cell} ${cell.open ? styles.open : ""}`}
      onClick={onClick}
      onContextMenu={onRightClick}
    >
      {content}
    </div>
  );
}