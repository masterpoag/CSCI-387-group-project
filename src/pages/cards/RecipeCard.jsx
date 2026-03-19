import React from "react";


// Refactored my code from my cocktail website for this project. This should work for what we need it for.

/**
 * Schema
 * @param {Object} recipe
 * @param {Array} ingredients - Array of objects containing { name, qty, cal }
 */


export default function RecipeCard({ recipe, ingredients = [], darkMode }) {
  const cardStyle = {
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: darkMode
      ? "0 4px 20px rgba(0,0,0,0.5)"
      : "0 4px 20px rgba(0,0,0,0.08)",
    background: darkMode ? "#2c2c2c" : "#ffffff",
    color: darkMode ? "#ececec" : "#2d3436",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s ease-in-out",
    border: darkMode ? "1px solid #444" : "1px solid #eee",
  };

  const contentStyle = {
    padding: "1.25rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  };

  const badgeStyle = {
    fontSize: "0.75rem",
    padding: "2px 8px",
    borderRadius: "4px",
    background: recipe.isPublic ? "#4caf50" : "#ffa000",
    color: "white",
    width: "fit-content",
  };

  return (
    <div style={cardStyle}>
      <div style={contentStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 style={{ margin: 0, fontSize: "1.4rem" }}>{recipe.name}</h2>
        </div>

        {recipe.desc && (
          <p style={{ fontStyle: "italic", opacity: 0.8, margin: 0 }}>
            {recipe.desc}
          </p>
        )}

        <hr style={{ border: "0.5px solid #eee", width: "100%", margin: "0.5rem 0" }} />

        <div>
          <strong style={{ display: "block", marginBottom: "0.5rem" }}>Ingredients:</strong>
          <ul style={{ margin: 0, paddingLeft: "1.2rem", lineHeight: "1.6" }}>
            {ingredients.map((item, idx) => (
              <li key={idx}>
                <strong>{parseFloat(item.qty).toFixed(2)}</strong> units of {item.name} 
                <span style={{ fontSize: "0.8rem", opacity: 0.6 }}> ({item.cal} cal)</span>
              </li>
            ))}
          </ul>
        </div>

        {recipe.instruct && (
          <div style={{ marginTop: "0.5rem" }}>
            <strong>Method:</strong>
            <p style={{ whiteSpace: "pre-line", marginTop: "0.25rem" }}>{recipe.instruct}</p>
          </div>
        )}
        <span style={badgeStyle}>{recipe.isPublic ? "Global" : "Personal"}</span>
      </div>
    </div>
  );
}