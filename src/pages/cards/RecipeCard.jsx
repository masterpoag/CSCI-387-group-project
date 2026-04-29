// RecipeCard — single recipe tile rendered in the Recipes grid.
// Also reused by the Nutritionist Dashboard to show recipes pending
// review. Receives all data plus action callbacks from its parent.

import React from "react";

// Maps the integer base_measure stored in the database to a human
// readable unit name. Mirrors IMPERIAL_BASE_UNITS in foodpage.jsx.
const BASE_MEASUREMENTS = {
  0: "Pound",
  1: "Ounce",
  2: "Cup",
  3: "Teaspoon",
};

// Builds the ingredient line shown on the card, e.g. "2 Cups of rice".
// The unit name is pluralized when the quantity is anything other than 1.
function formatIngredient(item) {
  const measurement =
    BASE_MEASUREMENTS[item.base_measure] ?? "Unknown";

  return `${measurement}${
    parseFloat(item.qty) !== 1 ? "s" : ""
  } of ${item.name}`;
}

/**
 * Props:
 *   recipe       — recipe object (rid, name, desc, instruct, isPublic, ...)
 *   ingredients  — array of { name, qty, cal, base_measure }
 *   onDelete     — callback invoked with rid when the trash icon is clicked
 *   canDelete    — whether to show the trash icon at all
 *   onReport     — callback invoked with rid when the flag icon is clicked
 *   canReport    — whether to show the flag icon at all
 */


export default function RecipeCard({
  recipe,
  ingredients = [],
  onDelete,
  canDelete,
  onReport,
  canReport,
}



) {
  return (
    <article className="recipeCard">
      <div className="recipeCardContent">
        <div className="recipeCardTop">
          <h2 className="recipeCardTitle">{recipe.name}</h2>

          <div className="recipeCardActions">
            {canReport && (
              <button
                className="recipeCardReportBtn"
                onClick={() => onReport(recipe.rid)}
                aria-label="Report recipe"
              >
                🚩
              </button>
            )}
            {canDelete && (
              <button
                className="recipeCardDeleteBtn"
                onClick={() => onDelete(recipe.rid)}
                aria-label="Delete recipe"
              >
                🗑
              </button>
            )}
          </div>
        </div>

        {recipe.desc && (
          <p className="recipeCardDesc">
            {recipe.desc}
          </p>
        )}

        <hr className="recipeCardDivider" />

        <div className="recipeCardSection">
          <strong className="recipeCardLabel">Ingredients:</strong>
          <ul className="recipeCardList">
            {ingredients.map((item, idx) => (
              <li key={idx}>
                <strong>{parseFloat(item.qty).toFixed(2)}</strong> {formatIngredient(item)}
                <span className="recipeCardCalories"> ({item.cal} cal)</span>
              </li>
            ))}
          </ul>
        </div>

        {recipe.instruct && (
          <div className="recipeCardSection recipeCardMethod">
            <strong>Method:</strong>
            <p className="recipeCardMethodText">{recipe.instruct}</p>
          </div>
        )}
        <span className={`recipeCardBadge ${recipe.isPublic ? "isPublic" : "isPrivate"}`}>
          {recipe.isPublic ? "Global" : "Personal"}
        </span>
      </div>
    </article>
  );
}