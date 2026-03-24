import React from "react";


// Refactored my code from my cocktail website for this project. This should work for what we need it for.

/**
 * Schema
 * @param {Object} recipe
 * @param {Array} ingredients - Array of objects containing { name, qty, cal }
 */


export default function RecipeCard({ recipe, ingredients = [] }) {
  return (
    <article className="recipeCard">
      <div className="recipeCardContent">
        <div className="recipeCardTop">
          <h2 className="recipeCardTitle">{recipe.name}</h2>
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
                <strong>{parseFloat(item.qty).toFixed(2)}</strong> units of {item.name} 
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