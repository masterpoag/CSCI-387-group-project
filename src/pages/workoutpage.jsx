import React, { useState } from "react";
import WorkoutCard from "./cards/WorkoutCard"; 


// <test data>

const MOCK_RECIPES = [
  {
    rid: 1,
    name: "Upper Body",
    desc: "A simple bodyweight workout for chest and arms.",
    instruct: "1. Start with pushups.\n2. Move to plank holds.\n3. Finish with tricep dips.",
    isPublic: true,
    ingredients: [
      { name: "Pushups", qty: 15, cal: 50 },
      { name: "Plank Hold (seconds)", qty: 30, cal: 20 }
    ]
  },
  {
    rid: 2,
    name: "Full Body Strength",
    desc: "High intensity workout for active days.",
    instruct: "1. Perform squats.\n2. Do jumping jacks.\n3. Finish with lunges.",
    isPublic: false,
    ingredients: [
      { name: "Squats", qty: 20, cal: 80 },
      { name: "Jumping Jacks", qty: 30, cal: 100 },
      { name: "Lunges", qty: 20, cal: 90 }
    ]
  }
];

// </test data>

export default function WorkoutPage({ darkMode }) {
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
          <p className="foodKicker">Find your next Workout</p>
          <h1 className="foodTitle">Workout Explorer</h1>
          <p className="foodSubtitle">Search by workout name or description.</p>
          <input
            className="foodSearchInput"
            type="text"
            placeholder="Search by workout name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="foodResultsMeta">
            Showing {filteredRecipes.length} workouts
          </p>
        </div>

        <div className="foodRecipeGrid">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <WorkoutCard
                key={recipe.rid}
                recipe={recipe}
                ingredients={recipe.ingredients}
                darkMode={darkMode}
              />
            ))
          ) : (
            <div className="foodEmptyState">
              <h3 className="foodEmptyTitle">No workouts found</h3>
              <p className="foodEmptyText">Nothing matched "{searchTerm}". Try a different keyword.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}