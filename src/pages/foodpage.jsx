import { useEffect, useMemo, useState } from "react";
import RecipeCard from "./cards/RecipeCard";
import NewFoodModal from "../components/NewFoodModal";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

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
  const [createRecipeModalOpen, setCreateRecipeModalOpen] = useState(false);

  const [formError, setFormError] = useState("");
  const [accountType, setAccountType] = useState(null);

  const [recipeFoods, setRecipeFoods] = useState([]);
  const [availableFoods, setAvailableFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(false);

  const [newFoodModalOpen, setNewFoodModalOpen] = useState(false);



  const [newRecipe, setNewRecipe] = useState({
    rname: "",
    desc: "",
    instruct: "",
    isPublishable: false,
  });

  // ================= LOAD RECIPES =================
  async function loadRecipes() {
    try {
      const headers = { "Content-Type": "application/json" };

      const [publicRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/get-public-recipe`, { headers }),
        fetch(
          `${API_BASE}/api/get-user-recipe?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}`,
          { headers }
        ),
      ]);

      const publicJson = await publicRes.json();
      const userJson = await userRes.json();

      const publicRecipes = publicJson?.Data ?? [];
      const userRecipes = userJson?.Data ?? [];

      setRecipes([...userRecipes, ...publicRecipes]);
    } catch {
      setFoodsError("Network error");
    }
  }

  useEffect(() => {
    loadRecipes();
    loadAccountType();
  }, []);

  // ================= FILTER =================
  const filteredRecipes = useMemo(() => {
  const term = searchTerm.toLowerCase();

  return recipes.filter((r) =>
      (r.nr?.rname ?? "").toLowerCase().includes(term) ||
      (r.nr?.desc ?? "").toLowerCase().includes(term) ||
      (r.nr?.instruct ?? "").toLowerCase().includes(term)
    );
  }, [recipes, searchTerm]);

  // ================= ACCOUNT TYPE =================
  async function loadAccountType() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/get-auth-level?huid=${token}`);
      const json = await res.json();

      if (json?.Result === "Success") {
        setAccountType(json.Data?.[0]?.account_type ?? null);
      }
    } catch {}
  }

  const isAdmin = accountType === 0 || accountType === 3;

  // ================= DELETE =================
  async function handleDeleteRecipe(rid) {
    const confirmed = window.confirm("Are you sure you want to delete this recipe?");
    if (!confirmed) return;

    const id = rid ?? null;
    if (!id) return console.error("Missing recipe id");

    await fetch(
      `${API_BASE}/api/delete-recipe?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}&rid=${id}`,
      { method: "GET" }
    );

    loadRecipes();
  }

  // ================= REPORT =================
  async function handleReportRecipe(rid) {
    const token = localStorage.getItem("token");
    const uname = localStorage.getItem("username");

    if (!token || !uname) return alert("Login required");

    const id = rid ?? null;
    if (!id) return alert("Missing recipe id");

    const rname = window.prompt("Report title:");
    const desc = window.prompt("Description:");

    if (!rname || !desc) return;

    await fetch(
      `${API_BASE}/api/report-content?huid=${token}&uname=${uname}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rname,
          desc,
          rep_type: "rcp",
          obj_id: id,
        }),
      }
    );
  }

  const canDeleteRecipe = (recipe) => !recipe.nr?.isPublic || isAdmin;
  const canReportRecipe = (recipe) => recipe.nr?.isPublic;

  // ================= FOOD =================
  async function loadFoods() {
    setFoodsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/get-foods`);
      const json = await res.json();

      setAvailableFoods(json?.Data ?? []);
    } finally {
      setFoodsLoading(false);
    }
  }

  function updateQty(index, value) {
    setRecipeFoods((prev) =>
      prev.map((f, i) =>
        i === index ? { ...f, qty: Number(value) } : f
      )
    );
  }

  function handleRemoveFood(index) {
    setRecipeFoods((prev) => prev.filter((_, i) => i !== index));
  }

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

  const selectedUnitLabel =
    IMPERIAL_BASE_UNITS.find((u) => u.value === selectedUnit)?.label ??
    "selected unit";

  function handleNewFoodSave({ name, cal }) {
    setExtraFoods((prev) => [...prev, { name, cal }]);

    setRecipeFoods((prev) => [
      ...prev,
      {
        fname: name,
        qty: 1,
        isNew: true,
        cal,
        base_measurement: selectedUnit,
      },
    ]);
  }

  // ================= CREATE RECIPE =================
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
        `${API_BASE}/api/create-recipe?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}`,
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
              <h2 className="createRecipeModalTitle">Create New Recipe</h2>

              <button
                className="createRecipeModalClose"
                onClick={() => setCreateRecipeModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="createRecipeForm">
              {/* Recipe Info Section */}
              <section className="createRecipeSection">
                <h3 className="createRecipeSectionTitle">Recipe Details</h3>
                
                <div className="createRecipeField">
                  <label className="createRecipeLabel">Recipe Name *</label>
                  <input
                    className="foodSearchInput"
                    placeholder="e.g., Chicken Stir Fry"
                    value={newRecipe.rname}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, rname: e.target.value })
                    }
                  />
                </div>

                <div className="createRecipeField">
                  <label className="createRecipeLabel">Description</label>
                  <textarea
                    className="foodSearchInput createRecipeTextarea"
                    placeholder="A brief description of your recipe..."
                    value={newRecipe.desc}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, desc: e.target.value })
                    }
                  />
                </div>

                <div className="createRecipeField">
                  <label className="createRecipeLabel">Instructions</label>
                  <textarea
                    className="foodSearchInput createRecipeTextarea createRecipeInstructions"
                    placeholder="Step by step cooking instructions..."
                    value={newRecipe.instruct}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, instruct: e.target.value })
                    }
                  />
                </div>

                {(
                  <div className="createRecipeToggle">
                    <label className="createRecipeToggleLabel">
                      <input
                        type="checkbox"
                        checked={newRecipe.isPublishable}
                        onChange={(e) =>
                          setNewRecipe({ ...newRecipe, isPublishable: e.target.checked })
                        }
                        className="createRecipeCheckbox"
                      />
                      <span className="createRecipeToggleSwitch"></span>
                      <span className="createRecipeToggleText">
                        {newRecipe.isPublishable ? "Submit for Publishing" : "Keep Private"}
                      </span>
                    </label>
                  </div>
                )}
              </section>

              {/* Foods Section */}
              <section className="createRecipeSection">
                <h3 className="createRecipeSectionTitle">Ingredients</h3>

                <div className="createRecipeFoodSelectors">
                  <div className="createRecipeSelector">
                    <label className="createRecipeLabel">Unit</label>
                    <select
                      className="adminUserActionSelect"
                      value={selectedUnit ?? ""}
                      onChange={(e) => setSelectedUnit(Number(e.target.value))}
                    >
                      <option value="">Select unit...</option>
                      {IMPERIAL_BASE_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="createRecipeSelector">
                    <label className="createRecipeLabel">Food</label>
                    <select
                      className="adminUserActionSelect"
                      value={selectedFood ?? ""}
                      onChange={(e) => {
                        const food = availableFoods.find(f => f.name === e.target.value);
                        if (food && selectedUnit !== null) {
                          setRecipeFoods(prev => [...prev, {
                            fname: food.name,
                            qty: 1,
                            isNew: false,
                            cal: food.cal,
                            base_measure: selectedUnit,
                          }]);
                        }
                      }}
                      disabled={selectedUnit === null || foodsLoading}
                    >
                      <option value="">{foodsLoading ? "Loading..." : "Select food..."}</option>
                      {availableFoods.map((f) => (
                        <option key={f.fid} value={f.name}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Ingredient Table */}
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
                          onChange={(e) => updateQty(index, e.target.value)}
                        />
                        <span className="tableColCal">
                          {food.cal} cal
                        </span>
                        <span className="tableColUnit">
                          {IMPERIAL_BASE_UNITS.find(u => u.value === food.base_measure)?.label}
                        </span>
                        <button
                          type="button"
                          className="tableColAction createRecipeRemoveBtn"
                          onClick={() => handleRemoveFood(index)}
                          aria-label={`Remove ${food.fname}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {recipeFoods.length === 0 && (
                  <div className="createRecipeEmptyIngredients">
                    No ingredients added yet. Select a unit and food above to add ingredients.
                  </div>
                )}
              </section>

              {/* Error Display */}
              {formError && (
                <div className="createRecipeError">
                  <span className="createRecipeErrorIcon">!</span>
                  {formError}
                </div>
              )}

              {/* Actions */}
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

      <NewFoodModal
        open={newFoodModalOpen}
        unitLabel={selectedUnitLabel}
        onClose={() => setNewFoodModalOpen(false)}
        onSave={handleNewFoodSave}
      />
    </div>
  );
}