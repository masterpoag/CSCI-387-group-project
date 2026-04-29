// WorkoutCard — single workout tile rendered in the Workouts grid and
// the Gym Instructor Dashboard's review queue.

import React from "react";

/**
 * Props:
 *   workout    — workout object (wid, name, instructions, isPublic, ...)
 *   onDelete   — callback invoked with wid when the trash icon is clicked
 *   canDelete  — whether to show the trash icon
 *   onReport   — callback invoked with wid when the flag icon is clicked
 *   canReport  — whether to show the flag icon
 */
export default function WorkoutCard({
  workout,
  onDelete,
  canDelete,
  onReport,
  canReport,
}) {
  return (
    <article className="recipeCard">
      <div className="recipeCardContent">
        <div className="recipeCardTop">
          <h2 className="recipeCardTitle">{workout.name}</h2>

          <div className="recipeCardActions">
            {canReport && (
              <button
                className="recipeCardReportBtn"
                onClick={() => onReport(workout.wid)}
                aria-label="Report workout"
              >
                🚩
              </button>
            )}
            {canDelete && (
              <button
                className="recipeCardDeleteBtn"
                onClick={() => onDelete(workout.wid)}
                aria-label="Delete workout"
              >
                🗑
              </button>
            )}
          </div>
        </div>

        <hr className="recipeCardDivider" />

        {workout.instructions && (
          <div className="recipeCardSection recipeCardMethod">
            <strong>Instructions:</strong>
            <p className="recipeCardMethodText">
              {workout.instructions}
            </p>
          </div>
        )}
          
        <span
          className={`recipeCardBadge ${
            workout.isPublic ? "isPublic" : "isPrivate"
          }`}
        >
          {workout.isPublic ? "Public" : "Private"}
        </span>
      </div>
    </article>
  );
}