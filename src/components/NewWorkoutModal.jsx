// NewWorkoutModal — standalone modal component for creating a workout.
// (workoutpage.jsx contains its own inline equivalent; this is the
// shared/component version kept for re-use.)
//
// Props:
//   open           — controls whether the modal is rendered
//   onClose        — called when the user cancels or clicks outside
//   onSave         — called with { name, instructions, isPublic }
//                    once the form validates
//   canMakePublic  — when true, the public toggle is shown so trainers
//                    and admins can mark a workout publishable

import { useEffect, useState } from "react";

export default function NewWorkoutModal({
  open,
  onClose,
  onSave,
  canMakePublic,
}) {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setInstructions("");
      setIsPublic(false);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return;

    onSave({
      name: trimmed,
      instructions: instructions.trim(),
      isPublic,
    });

    onClose();
  }

  return (
    <div className="newFoodModalBackdrop" onMouseDown={onClose}>
      <div
        className="newFoodModalDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="newWorkoutModalTitle"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="newWorkoutModalTitle" className="newFoodModalTitle">
          Create Workout
        </h2>

        <form className="newFoodModalForm" onSubmit={handleSubmit}>
          <label className="field">
            <span className="fieldLabel">Workout Name</span>
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
            <span className="fieldLabel">Instructions</span>
            <textarea
              className="textInput"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </label>

          {canMakePublic && (
            <div className="createRecipeToggle">
                <label className="createRecipeToggleLabel">
                <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="createRecipeCheckbox"
                />
                <span className="createRecipeToggleSwitch"></span>
                <span className="createRecipeToggleText">
                    {isPublic ? "Public Workout" : "Private Workout"}
                </span>
                </label>
            </div>
            )}

          <div className="newFoodModalActions">
            <button
              type="button"
              className="newFoodModalCancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="primaryButton">
              <span className="primaryButtonInner">
                Save Workout
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}