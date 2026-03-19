import React, { useState } from "react";
import RecipeCard from "./cards/RecipeCard"; 


// <test data>

const MOCK_RECIPES = [
  {
    rid: 1,
    name: "Classic Avocado Toast",
    desc: "A simple, healthy breakfast staple.",
    instruct: "1. Toast the bread until golden.\n2. Mash avocado with salt and pepper.\n3. Spread on toast.",
    isPublic: true,
    ingredients: [
      { name: "Sourdough", qty: 1.0, cal: 120 },
      { name: "Avocado", qty: 0.5, cal: 160 }
    ]
  },
  {
    rid: 2,
    name: "Protein Power Bowl",
    desc: "High protein lunch for active days.",
    instruct: "1. Steam the quinoa.\n2. Grill chicken breast.\n3. Combine in a bowl with dressing.",
    isPublic: false,
    ingredients: [
      { name: "Chicken Breast", qty: 1.0, cal: 280 },
      { name: "Quinoa", qty: 0.75, cal: 180 },
      { name: "Spinach", qty: 2.0, cal: 14 }
    ]
  }
];

// </test data>

export default function RecipePage({ darkMode }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter based on name or description
  const filteredRecipes = MOCK_RECIPES.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const searchContainerStyle = {
    maxWidth: "800px",
    margin: "0 auto 2rem auto",
    textAlign: "center",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 20px",
    fontSize: "1rem",
    borderRadius: "25px",
    border: darkMode ? "1px solid #444" : "1px solid #ccc",
    backgroundColor: darkMode ? "#2c2c2c" : "#fff",
    color: darkMode ? "#fff" : "#000",
    outline: "none",
    boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "1.5rem",
    maxWidth: "1200px",
    margin: "0 auto",
  };

  return (
    <div>
      <div style={searchContainerStyle}>
        <h1 style={{ marginBottom: "1.5rem" }}>Recipe Explorer</h1>
        <input
          type="text"
          placeholder="Search by recipe name or description..."
          style={inputStyle}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <p style={{ marginTop: "10px", opacity: 0.7 }}>
          Showing {filteredRecipes.length} recipes
        </p>
      </div>

      <div style={gridStyle}>
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <RecipeCard 
              key={recipe.rid} 
              recipe={recipe} 
              ingredients={recipe.ingredients} 
              darkMode={darkMode} 
            />
          ))
        ) : (
          <div style={{ textAlign: "center", gridColumn: "1 / -1", marginTop: "2rem" }}>
            <h3>No recipes found matching "{searchTerm}"</h3>
          </div>
        )}
      </div>
    </div>
  );
}