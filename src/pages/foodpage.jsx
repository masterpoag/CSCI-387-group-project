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


  return (
    <div className="foodPage">
      <div className="foodPageContent">
        <div className="foodSearchPanel">
          <p className="foodKicker">Find your next meal</p>
          <h1 className="foodTitle">Recipe Explorer</h1>
          <p className="foodSubtitle">Search by recipe name or description.</p>
          <input
            className="foodSearchInput"
            type="text"
            placeholder="Search by recipe name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="foodResultsMeta">
            Showing {filteredRecipes.length} recipes
          </p>
        </div>

        <div className="foodRecipeGrid">
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
            <div className="foodEmptyState">
              <h3 className="foodEmptyTitle">No recipes found</h3>
              <p className="foodEmptyText">Nothing matched "{searchTerm}". Try a different keyword.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}