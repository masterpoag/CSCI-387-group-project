import React from "react";

export default function WorkoutCard({
  workout,
  onDelete,
  canDelete,
}) {
  return (
    <article className="recipeCard">
      <div className="recipeCardContent">
        <div className="recipeCardTop">
          <h2 className="recipeCardTitle">{workout.name}</h2>

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