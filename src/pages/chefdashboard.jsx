import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

export default function ChefDashboard() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecipes() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/chef/get-publishable-recipes?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        setRecipes(json.Data ?? []);
      } else {
        setError(json?.Message || "Failed to load publishable recipes");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  async function handleApprove(rid) {
    console.log("Approving recipe with rid:", rid);
    const confirmed = window.confirm(
      "Are you sure you want to approve and publish this recipe?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/chef/set-recipe-publicity?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}&rid=${rid}&isPublic=true`
      );
      const json = await res.json();
      console.log(json);
      if (json?.Result === "Success") {
        loadRecipes();
      } else {
        console.error(json?.Message);
        alert("Failed to approve recipe: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
      alert("Network error while approving recipe.");
    }
  }

  async function handleReject(rid) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this recipe? This will remove it from the publishable list."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/chef/set-recipe-publicity?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}&rid=${rid}&isPublic=false`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        loadRecipes();
      } else {
        console.error(json?.Message);
        alert("Failed to reject recipe: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
      alert("Network error while rejecting recipe.");
    }
  }

  return (
    <div className="foodPage">
      <div className="foodPageContent">
        <div className="foodSearchPanel">
          <p className="foodKicker">Chef Panel</p>
          <h1 className="foodTitle">Recipe Review</h1>
          <p className="foodResultsMeta">
            {recipes.length} recipe(s) awaiting review
          </p>
        </div>

        {error && <div className="foodError">{error}</div>}

        {loading ? (
          <div className="foodLoading">Loading recipes...</div>
        ) : (
          <div className="foodRecipeGrid">
            {recipes.length === 0 ? (
              <div className="foodEmptyState">
                <h3 className="foodEmptyTitle">No recipes to review</h3>
                <p className="foodEmptyText">
                  All caught up! No recipes are waiting for publication.
                </p>
              </div>
            ) : (
              recipes.map((recipe, idx) => (
                <article key={recipe.rid || idx} className="recipeCard">
                  <div className="recipeCardContent">
                    <div className="recipeCardTop">
                      <h2 className="recipeCardTitle">{recipe.name}</h2>
                      <span className="recipeCardBadge isPrivate">
                        Pending Review
                      </span>
                    </div>

                    <hr className="recipeCardDivider" />

                    {recipe.desc && (
                      <p className="recipeCardDesc">{recipe.desc}</p>
                    )}

                    {recipe.instruct && (
                      <div className="recipeCardSection recipeCardMethod">
                        <strong>Instructions:</strong>
                        <p className="recipeCardMethodText">
                          {recipe.instruct}
                        </p>
                      </div>
                    )}

                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div className="recipeCardSection">
                        <strong className="recipeCardLabel">Ingredients:</strong>
                        <ul className="recipeCardList">
                          {recipe.ingredients.map((item, idx) => (
                            <li key={idx}>
                              <strong>
                                {parseFloat(item.qty).toFixed(2)}
                              </strong>{" "}
                              {item.base_measure === 0
                                ? "lb"
                                : item.base_measure === 1
                                ? "oz"
                                : item.base_measure === 2
                                ? "cup"
                                : "tsp"}{" "}
                              of {item.name}
                              <span className="recipeCardCalories">
                                {" "}
                                ({item.cal} cal)
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <p className="recipeCardDesc">
                      <strong>Owner:</strong> {recipe.owner}
                    </p>

                    <div className="adminUserActions">
                      <button
                        className="adminApproveBtn"
                        onClick={() => handleApprove(recipe.rid)}
                      >
                        Approve & Publish
                      </button>
                      <button
                        className="adminDeleteBtn"
                        onClick={() => handleReject(recipe.rid)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
