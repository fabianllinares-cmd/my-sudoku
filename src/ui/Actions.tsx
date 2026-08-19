interface ActionsProps {
  pencilMode: boolean;
  canUndo: boolean;
  disabled: boolean;
  onErase: () => void;
  onTogglePencil: () => void;
  onUndo: () => void;
  onAutoPencil: () => void;
}

export function Actions({
  pencilMode,
  canUndo,
  disabled,
  onErase,
  onTogglePencil,
  onUndo,
  onAutoPencil,
}: ActionsProps) {
  return (
    <div className="actions" role="group" aria-label="Tools">
      <button type="button" className="tool-btn" disabled={disabled} onClick={onErase}>
        <EraseIcon />
        Erase
      </button>
      <button
        type="button"
        className={`tool-btn ${pencilMode ? "active" : ""}`}
        disabled={disabled}
        aria-pressed={pencilMode}
        onClick={onTogglePencil}
      >
        <PencilIcon />
        Notes
      </button>
      <button type="button" className="tool-btn" disabled={disabled || !canUndo} onClick={onUndo}>
        <UndoIcon />
        Undo
      </button>
      <button
        type="button"
        className="tool-btn"
        disabled={disabled}
        aria-label="Fill notes with all valid candidates"
        onClick={onAutoPencil}
      >
        <AutoIcon />
        Auto
      </button>
    </div>
  );
}

function EraseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 15.5 14 6l4 4-9.5 9.5H4.5v-4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="m12 8 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 8H4v4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.6 12A8 8 0 1 0 6 7.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AutoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h8M12 8v8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
