// RecipePage (mounted at /food) — recipe browsing + creation hub.
//
// Pulls public recipes plus the signed-in user's personal recipes, lets
// the user search them, and exposes a Create Recipe modal that builds
// recipes from a shared food library (with the option to define new
// foods inline).
//
// Permission model:
//   - Browsing public recipes: open to everyone.
//   - Creating, deleting own recipes, reporting public recipes: requires
//     login. Admins can additionally delete public recipes (see
//     `canDeleteRecipe` below).

import { useEffect, useMemo, useState } from "react";
import RecipeCard from "./cards/RecipeCard";

// TODO Add: allow admins to delete public recipes.
// TODO STRETCH GOALS:
// - Allow users to delete their recipes

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

// Backend stores units as small ints. The dropdown shows the human-readable
// label; the int is what gets sent to the API.
const IMPERIAL_BASE_UNITS = [
  { value: 0, label: "Pound (lb)" },
  { value: 1, label: "Ounce (oz)" },
  { value: 2, label: "Cup" },
  { value: 3, label: "Teaspoon (tsp)" },
];

export default function RecipePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [foodsError, setFoodsError] = useState("");

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedFood, setSelectedFood] = useState("");
  const [foodSearch, setFoodSearch] = useState("");
  const [showFoodDropdown, setShowFoodDropdown] = useState(false);
  const [newFoodModalOpen, setNewFoodModalOpen] = useState(false);
  const [newFood, setNewFood] = useState({
    name: "",
    cal: "",
  });

  const [createRecipeModalOpen, setCreateRecipeModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [accountType, setAccountType] = useState(null);

  const [recipeFoods, setRecipeFoods] = useState([]);
  const [availableFoods, setAvailableFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(false);

  const [newRecipe, setNewRecipe] = useState({
    rname: "",
    desc: "",
    instruct: "",
    isPublishable: false,
  });

  // ================= LOAD RECIPES =================
  // Fetches public recipes and the user's personal recipes in parallel,
  // then de-duplicates by rid (a public recipe may also be one the user
  // owns) so each recipe shows up only once in the grid.
  async function loadRecipes() {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const [publicRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/get-public-recipe`, { headers }),
        fetch(
          `${API_BASE}/api/get-user-recipe?huid=${localStorage.getItem(
            "token"
          )}&uname=${localStorage.getItem("username")}`,
          { headers }
        ),
      ]);

      const publicJson = await publicRes.json();
      const userJson = await userRes.json();

      const publicRecipes = publicJson?.Data ?? [];
      const userRecipes = userJson?.Data ?? [];

      // User recipes go first so when both lists contain the same recipe,
      // the user's (private/Personal) view of it wins the de-dupe.
      const allRecipes = [...userRecipes, ...publicRecipes];

      // De-duplicate by recipe id.
      const uniqueRecipes = Array.from(
        new Map(allRecipes.map((recipe) => [recipe.rid, recipe])).values()
      );

      setRecipes(uniqueRecipes);
    } catch {
      setFoodsError("Network error");
    }
  }

  useEffect(() => {
    loadRecipes();
    loadAccountType();
  }, []);

  // ================= FILTER =================
  // Client-side search across recipe name, description, and instructions.
  // Memoized so we only re-filter when the underlying list or term changes.
  const filteredRecipes = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return recipes.filter(
      (r) =>
        r.name?.toLowerCase().includes(term) ||
        r.desc?.toLowerCase().includes(term) ||
        r.instruct?.toLowerCase().includes(term)
    );
  }, [recipes, searchTerm]);

  // ================= DELETE =================
  // Triggered by the trash icon on a RecipeCard. The card itself only
  // renders the icon when canDeleteRecipe() returns true.
  async function handleDeleteRecipe(rid) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/delete-recipe?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}&rid=${rid}`,
        { method: "GET" }
      );

      const json = await res.json();

      if (json?.Result === "Success") {
        loadRecipes();
      } else {
        console.error(json?.Message);
      }
    } catch {
      console.error("Network error");
    }
  }

  // ================= PERMISSIONS =================
  // Drives which icons appear on each RecipeCard.
  //   - Delete is shown for the user's own (private) recipes, and for
  //     any recipe when the viewer is an admin.
  //   - Report is shown for public recipes only — there's no point
  //     reporting your own private recipe.
  const isAdmin = accountType === 0 || accountType === 3;

  const canDeleteRecipe = (recipe) =>
    !recipe.isPublic || (isAdmin && recipe.isPublic);

  const canReportRecipe = (recipe) => recipe.isPublic;

  // ================= REPORT =================
  // Two-step prompt flow: confirm intent, then collect a short report
  // name and a description. Cancelling either prompt aborts the report.
  async function handleReportRecipe(rid) {
    const confirmed = window.confirm(
      "Are you sure you want to report this recipe?"
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");
    const uname = localStorage.getItem("username");

    if (!token || !uname) {
      alert("Please log in to report content.");
      return;
    }

    const reportName = window.prompt("Enter a name for this report:");
    if (reportName === null || !reportName.trim()) return;

    const desc = window.prompt("Please enter a description for the report:");
    if (desc === null) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/report-content?huid=${token}&uname=${uname}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rname: reportName.trim(),
            desc,
            rep_type: "rcp",
            obj_id: rid,
          }),
        }
      );

      const json = await res.json();

      if (json?.Result === "Success") {
        alert("Recipe reported successfully.");
      } else {
        alert("Failed to report recipe.");
      }
    } catch {
      alert("Network error while reporting recipe.");
    }
  }

  // ================= FOODS =================
  // Loads the shared food library used to populate the ingredient
  // dropdown in the Create Recipe modal.
  async function loadFoods() {
    setFoodsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/get-foods`);
      const json = await res.json();

      if (json?.Result === "Success") {
        setAvailableFoods(json.Data ?? []);
      } else {
        console.error("Failed to load foods:", json?.Message);
      }
    } catch {
      console.error("Network error loading foods");
    } finally {
      setFoodsLoading(false);
    }
  }

  const filteredFoods = useMemo(() => {
    return availableFoods.filter((food) =>
      food.name?.toLowerCase().includes(foodSearch.toLowerCase())
    );
  }, [availableFoods, foodSearch]);

  // Adds an ingredient to the in-progress recipe using a food that
  // already exists in the shared library. The user must pick a unit
  // first because the same food can be used by weight or by volume.
  function handleAddExistingFood(food) {
    if (selectedUnit === null) {
      setFormError("Please select a unit first");
      return;
    }

    setRecipeFoods((prev) => [
      ...prev,
      {
        fname: food.name,
        qty: 1,
        isNew: false,
        cal: Number(food.cal),

        base_measurement: selectedUnit,
      },
    ]);

    setSelectedFood(food.name);
    setFoodSearch("");
    setShowFoodDropdown(false);
  }

  // Adds a brand-new food to the recipe. The food is marked isNew=true
  // so the backend knows to create the Food row before linking it.
  function handleSaveNewFood() {
    if (!newFood.name.trim()) {
      setFormError("Food name is required");
      return;
    }

    if (!newFood.cal || Number(newFood.cal) < 0) {
      setFormError("Calories must be valid");
      return;
    }

    if (selectedUnit === null) {
      setFormError("Please select a unit first");
      return;
    }

    const createdFood = {
      fname: newFood.name.trim(),
      qty: 1,
      isNew: true,
      cal: Number(newFood.cal),
      
      base_measurement: selectedUnit,
    };

    setRecipeFoods((prev) => [...prev, createdFood]);

    setNewFood({
      name: "",
      cal: "",
    });

    setNewFoodModalOpen(false);
  }

  function updateQty(index, value) {
    const val = Number(value);

    setRecipeFoods((prev) =>
      prev.map((f, i) =>
        i === index
          ? {
              ...f,
              qty: val,
              
            }
          : f
      )
    );
  }

  function handleRemoveFood(index) {
    setRecipeFoods((prev) => prev.filter((_, i) => i !== index));
  }

  // Shapes the in-progress recipe state into the request body that
  // /api/create-recipe expects: a NewRecipe plus the ingredient list.
  function buildCreateRecipePayload() {
    return {
      nr: {
        rname: newRecipe.rname,
        desc: newRecipe.desc,
        instruct: newRecipe.instruct,
        isPublishable: newRecipe.isPublishable,
      },
      foods: recipeFoods,
    };
  }

  // ================= ACCOUNT =================
  // Mirrors the App-level account-type check so that this page can
  // independently decide which actions to expose (e.g., the "publish
  // recipe" toggle in the Create Recipe modal).
  async function loadAccountType() {
    const token = localStorage.getItem("token");

    if (!token) {
      setAccountType(null);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/get-auth-level?huid=${token}`
      );

      const json = await res.json();

      if (
        json?.Result === "Success" &&
        json.Data?.[0]?.account_type !== undefined
      ) {
        setAccountType(json.Data[0].account_type);
      } else {
        setAccountType(null);
      }
    } catch {
      setAccountType(null);
    }
  }

  // ================= CREATE RECIPE =================
  // Click handler for the "Create Recipe +" button. Gates the modal
  // behind authentication and redirects to the login page if needed.
  async function handleCreateRecipeClick() {
    if (!localStorage.getItem("username") || !localStorage.getItem("token")) {
      const confirmed = window.confirm(
        "You need to log in to create a recipe. Would you like to log in now?"
      );

      if (confirmed) {
        window.location.href = "/~group3sp26/login";
      }

      return;
    }

    await loadFoods();
    setCreateRecipeModalOpen(true);
  }

  // Submits the in-progress recipe to the backend. Validates locally
  // first to avoid round-trips for obvious problems (no name, no
  // ingredients), then resets the modal on success.
  async function handleCreateRecipe() {
    setFormError("");

    if (!newRecipe.rname.trim()) {
      setFormError("Recipe name is required");
      return;
    }

    if (recipeFoods.length === 0) {
      setFormError("At least one food item is required");
      return;
    }

    try {
      const payload = buildCreateRecipePayload();

      const res = await fetch(
        `${API_BASE}/api/create-recipe?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (json?.Result === "Success") {
        setCreateRecipeModalOpen(false);
        setRecipeFoods([]);
        setSelectedUnit(null);
        setSelectedFood("");

        setNewRecipe({
          rname: "",
          desc: "",
          instruct: "",
          isPublishable: false,
        });

        loadRecipes();
      } else {
        setFormError(json?.Message || "Failed to create recipe");
      }
    } catch {
      setFormError("Network error. Please try again.");
    }
  }

  // ================= UI =================
  return (
    <div className="foodPage">
      <div className="foodPageContent">
        <div className="foodSearchPanel">
          <div className="foodSearchPanelTopBar">
            <button
              type="button"
              className="foodCreateRecipeBtn"
              onClick={handleCreateRecipeClick}
            >
              Create Recipe +
            </button>
          </div>

          <p className="foodKicker">Find your next meal</p>
          <h1 className="foodTitle">Recipe Explorer</h1>

          <input
            className="foodSearchInput"
            placeholder="Search..."
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
                key={`${recipe.name}-${recipe.owner}`}
                recipe={recipe}
                ingredients={recipe.ingredients}
                canDelete={canDeleteRecipe(recipe)}
                onDelete={handleDeleteRecipe}
                canReport={canReportRecipe(recipe)}
                onReport={handleReportRecipe}
              />
            ))
          ) : (
            <div className="foodEmptyState">
              <h3 className="foodEmptyTitle">No recipes found</h3>
              <p className="foodEmptyText">
                Try a different keyword.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {createRecipeModalOpen && (
        <div
          className="createRecipeModalBackdrop"
          onClick={() => setCreateRecipeModalOpen(false)}
        >
          <div
            className="createRecipeModalDialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="createRecipeModalHeader">
              <h2 className="createRecipeModalTitle">
                Create New Recipe
              </h2>

              <button
                className="createRecipeModalClose"
                onClick={() => setCreateRecipeModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="createRecipeForm">
              <section className="createRecipeSection">
                <h3 className="createRecipeSectionTitle">
                  Recipe Details
                </h3>

                <div className="createRecipeField">
                  <label className="createRecipeLabel">
                    Recipe Name *
                  </label>

                  <input
                    className="foodSearchInput"
                    placeholder="e.g., Chicken Stir Fry"
                    value={newRecipe.rname}
                    onChange={(e) =>
                      setNewRecipe({
                        ...newRecipe,
                        rname: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="createRecipeField">
                  <label className="createRecipeLabel">
                    Description
                  </label>

                  <textarea
                    className="foodSearchInput createRecipeTextarea"
                    placeholder="A brief description of your recipe..."
                    value={newRecipe.desc}
                    onChange={(e) =>
                      setNewRecipe({
                        ...newRecipe,
                        desc: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="createRecipeField">
                  <label className="createRecipeLabel">
                    Instructions
                  </label>

                  <textarea
                    className="foodSearchInput createRecipeTextarea createRecipeInstructions"
                    placeholder="Step by step cooking instructions..."
                    value={newRecipe.instruct}
                    onChange={(e) =>
                      setNewRecipe({
                        ...newRecipe,
                        instruct: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="createRecipeToggle">
                  <label className="createRecipeToggleLabel">
                    <input
                      type="checkbox"
                      checked={newRecipe.isPublishable}
                      onChange={(e) =>
                        setNewRecipe({
                          ...newRecipe,
                          isPublishable: e.target.checked,
                        })
                      }
                      className="createRecipeCheckbox"
                    />

                    <span className="createRecipeToggleSwitch"></span>

                    <span className="createRecipeToggleText">
                      {newRecipe.isPublishable
                        ? "Submit for Publishing"
                        : "Keep Private"}
                    </span>
                  </label>
                </div>
              </section>

              <section className="createRecipeSection">
                <h3 className="createRecipeSectionTitle">Ingredients</h3>

                <div className="createRecipeFoodSelectors">
                  <div className="createRecipeSelector">
                    <label className="createRecipeLabel">Unit</label>

                    <select
                      className="adminUserActionSelect"
                      value={selectedUnit ?? ""}
                      onChange={(e) =>
                        setSelectedUnit(Number(e.target.value))
                      }
                    >
                      <option value="">Select unit...</option>

                      {IMPERIAL_BASE_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="createRecipeSelector">
                    <label className="createRecipeLabel">Food</label>

                    <div
                      className="createRecipeSearchWrapper"
                      style={{ position: "relative" }}
                    >
                      <input
                        type="text"
                        className="foodSearchInput"
                        placeholder="Search foods..."
                        value={foodSearch}
                        onFocus={() => setShowFoodDropdown(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowFoodDropdown(false);
                          }, 150);
                        }}
                        onChange={(e) => {
                          setFoodSearch(e.target.value);
                          setShowFoodDropdown(true);
                        }}
                        disabled={selectedUnit === null || foodsLoading}
                      />

                      {showFoodDropdown &&
                        (filteredFoods.length > 0 ||
                          foodSearch.trim().length > 0) && (
                        <div
                          className="createRecipeFoodDropdown"
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#1f2940",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                            marginTop: "6px",
                            maxHeight: "220px",
                            overflowY: "auto",
                            zIndex: 1000,
                          }}
                        >
                          {filteredFoods.map((f) => (
                            <button
                              key={f.fid}
                              type="button"
                              className="createRecipeFoodOption"
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "12px",
                                background: "transparent",
                                border: "none",
                                color: "white",
                                cursor: "pointer",
                              }}
                              onClick={() => handleAddExistingFood(f)}
                            >
                              {f.name}
                            </button>
                          ))}

                          <button
                            type="button"
                            className="createRecipeFoodOption"
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "12px",
                              background: "transparent",
                              border: "none",
                              color: "#6dd5ff",
                              cursor: "pointer",
                              borderTop: "1px solid rgba(255,255,255,0.08)",
                            }}
                            onClick={() => {
                              setShowFoodDropdown(false);
                              setNewFoodModalOpen(true);
                            }}
                          >
                            + Add New Food
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {recipeFoods.length > 0 && (
                  <div className="createRecipeIngredientsTable">
                    <div className="createRecipeTableHeader">
                      <span className="tableColName">Food</span>
                      <span className="tableColQty">Quantity</span>
                      <span className="tableColCal">Calories</span>
                      <span className="tableColUnit">Unit</span>
                      <span className="tableColAction"></span>
                    </div>

                    {recipeFoods.map((food, index) => (
                      <div key={index} className="createRecipeTableRow">
                        <span className="tableColName">{food.fname}</span>

                        <input
                          className="tableColQty createRecipeQtyInput"
                          type="number"
                          value={food.qty}
                          min="0"
                          step="0.1"
                          onChange={(e) =>
                            updateQty(index, e.target.value)
                          }
                        />

                        <span className="tableColCal">
                          {Number(food.cal) * Number(food.qty)} cal
                        </span>

                        <span className="tableColUnit">
                          {
                            IMPERIAL_BASE_UNITS.find(
                              (u) => u.value === food.base_measurement
                            )?.label
                          }
                        </span>

                        <button
                          type="button"
                          className="tableColAction createRecipeRemoveBtn"
                          onClick={() => handleRemoveFood(index)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {recipeFoods.length === 0 && (
                  <div className="createRecipeEmptyIngredients">
                    No ingredients added yet. Select a unit and food above to
                    add ingredients.
                  </div>
                )}
              </section>

              {formError && (
                <div className="createRecipeError">
                  <span className="createRecipeErrorIcon">!</span>
                  {formError}
                </div>
              )}

              <div className="createRecipeActions">
                <button
                  type="button"
                  className="createRecipeCancelBtn"
                  onClick={() => setCreateRecipeModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="foodCreateRecipeBtn createRecipeSubmitBtn"
                  onClick={handleCreateRecipe}
                >
                  Create Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {foodsError && <div>{foodsError}</div>}

      {newFoodModalOpen && (
        <div
          className="createRecipeModalBackdrop"
          onClick={() => setNewFoodModalOpen(false)}
        >
          <div
            className="createRecipeModalDialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="createRecipeModalHeader">
              <h2 className="createRecipeModalTitle">
                Add New Food
              </h2>

              <button
                className="createRecipeModalClose"
                onClick={() => setNewFoodModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="createRecipeForm">
              <div className="createRecipeField">
                <label className="createRecipeLabel">
                  Food Name
                </label>

                <input
                  className="foodSearchInput"
                  placeholder="Enter food name"
                  value={newFood.name}
                  onChange={(e) =>
                    setNewFood({
                      ...newFood,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div className="createRecipeField">
                <label className="createRecipeLabel">
                  Calories
                </label>

                <input
                  type="number"
                  className="foodSearchInput"
                  placeholder="Enter calories"
                  value={newFood.cal}
                  onChange={(e) =>
                    setNewFood({
                      ...newFood,
                      cal: e.target.value,
                    })
                  }
                />
              </div>

              <div className="createRecipeActions">
                <button
                  type="button"
                  className="createRecipeCancelBtn"
                  onClick={() => setNewFoodModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="foodCreateRecipeBtn createRecipeSubmitBtn"
                  onClick={handleSaveNewFood}
                >
                  Add Food
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

