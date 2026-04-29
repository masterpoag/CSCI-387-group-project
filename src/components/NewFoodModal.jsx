// NewFoodModal — popup launched from the Create Recipe modal when the
// user wants to add a food that isn't yet in the shared library.
//
// Props:
//   open       — controls whether the modal is rendered
//   unitLabel  — currently-selected unit (Pound / Cup / etc.) shown
//                inline so the user knows what "Calories per 1 X" means
//   onClose    — called when the user cancels or clicks outside
//   onSave     — called with { name, cal } once the form validates

import { useEffect, useState } from "react";

export default function NewFoodModal({
  open,
  unitLabel,
  onClose,
  onSave,
}) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setCalories("");
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    const cal = parseInt(calories, 10);
    if (!trimmed || Number.isNaN(cal) || cal < 0) {
      return;
    }
    onSave({ name: trimmed, cal });
    onClose();
  }

  return (
    <div className="newFoodModalBackdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="newFoodModalDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="newFoodModalTitle"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="newFoodModalTitle" className="newFoodModalTitle">
          Add new food
        </h2>
        <p className="newFoodModalHint">
          Enter the food name and calories for <strong>1 {unitLabel}</strong>.
        </p>
        <form className="newFoodModalForm" onSubmit={handleSubmit}>
          <label className="field">
            <span className="fieldLabel">Food name</span>
            <input
              className="textInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span className="fieldLabel">Calories (per 1 {unitLabel})</span>
            <input
              className="textInput"
              type="number"
              min={0}
              step={1}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              required
            />
          </label>
          <div className="newFoodModalActions">
            <button type="button" className="newFoodModalCancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primaryButton">
              <span className="primaryButtonInner">Save food</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
