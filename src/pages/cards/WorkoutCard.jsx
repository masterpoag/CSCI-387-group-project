import React from "react";


/**
 * Schema
 * @param {Object} workout
 * @param {Array} exercises - Array of objects containing { name, sets, reps }
 */


export default function WorkoutCard({ workout, exercises = [] }) {
  return (
    <article className="recipeCard">
      <div className="recipeCardContent">
        <div className="recipeCardTop">
          <h2 className="recipeCardTitle">{workout.name}</h2>
        </div>

        {workout.desc && (
          <p className="recipeCardDesc">
            {workout.desc}
          </p>
        )}

        <hr className="recipeCardDivider" />

        <div className="recipeCardSection">
          <strong className="recipeCardLabel">Exercises:</strong>
          <ul className="recipeCardList">
            {exercises.map((item, idx) => (
              <li key={idx}>
                <strong>{item.sets}</strong> sets x <strong>{item.reps}</strong> reps of {item.name}
              </li>
            ))}
          </ul>
        </div>

        {workout.instruct && (
          <div className="recipeCardSection recipeCardMethod">
            <strong>Instructions:</strong>
            <p className="recipeCardMethodText">{workout.instruct}</p>
          </div>
        )}
        <span className={`recipeCardBadge ${workout.isPublic ? "isPublic" : "isPrivate"}`}>
          {workout.isPublic ? "Public" : "Private"}
        </span>
      </div>
    </article>
  );
}