import React, { useState, useEffect } from "react";
import RecipeCard from "./cards/RecipeCard"; 


const huid = localStorage.getItem("token");
const uname = localStorage.getItem("username");

const endpoint = "https://gp.vroey.us/api/get-public-recipe";


  export default function RecipePage({ darkMode }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [recipes, setRecipes] = useState([]);


    useEffect(() => {
      async function fetchRecipes() {
        try {
          const response = await fetch(endpoint, {
            method: "GET",
            headers: {
              accept: "application/json",
              "Content-Type": "application/json",
            },
          });
  
          const data = await response.json();
          console.log(data);
  
          setRecipes(data.Data);
        } catch (err) {
          console.error("Error fetching recipes:", err);
        }
      }
  
      fetchRecipes();
    }, []);





  // Filter based on name or description
  const filteredRecipes = recipes.filter((recipe) =>
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