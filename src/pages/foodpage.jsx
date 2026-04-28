import { useEffect, useMemo, useState } from "react";
import RecipeCard from "./cards/RecipeCard";
import SearchableSelect from "../components/SearchableSelect";
import NewFoodModal from "../components/NewFoodModal";


// TODO Add: allow admins to delete public recipes.

//TODO STRECH GOALS:
// - Allow users to delete their recipes


const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

const IMPERIAL_BASE_UNITS = [
  { value: 0, label: "Pound (lb)" },
  { value: 1, label: "Ounce (oz)" },
  { value: 2, label: "Cup" },
  { value: 3, label: "Teaspoon (tsp)" },
];


const NEW_FOOD_VALUE = "__new_food__";

export default function RecipePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [foodsError, setFoodsError] = useState("");

  const [extraFoods, setExtraFoods] = useState([]);

  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);

  const [newFoodModalOpen, setNewFoodModalOpen] = useState(false);
  const [createRecipeModalOpen, setCreateRecipeModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [accountType, setAccountType] = useState(null);

  const [recipeFoods, setRecipeFoods] = useState([]);

  const [newRecipe, setNewRecipe] = useState({
    rname: "",
    desc: "",
    instruct: "",
    isPublishable: false,
  });

  // ================= LOAD RECIPES =================
  async function loadRecipes() {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const [publicRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/get-public-recipe`, { headers }),
        fetch(`${API_BASE}/api/get-user-recipe?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}`, { headers }),
      ]);

      const publicJson = await publicRes.json();
      const userJson = await userRes.json();

      const publicRecipes = publicJson?.Data ?? [];
      const userRecipes = userJson?.Data ?? [];

      const allRecipes = [...userRecipes, ...publicRecipes];
      setRecipes(allRecipes);
    } catch {
      setFoodsError("Network error");
    }
  }

  useEffect(() => {
    loadRecipes();
  }, []);

  // ================= FILTER =================
  const filteredRecipes = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return recipes.filter((r) =>
      r.name?.toLowerCase().includes(term) ||
      r.desc?.toLowerCase().includes(term) ||
      r.instruct?.toLowerCase().includes(term)
    );
  }, [recipes, searchTerm]);

  // ================= FOODS =================
  const allFoodNames = useMemo(() => {
    const foods = [];

    recipes.forEach((r) => {
      r.ingredients?.forEach((i) => {
        if (i?.name) foods.push(i.name);
      });
    });

    extraFoods.forEach((f) => foods.push(f.name));

    return [...new Set(foods)];
  }, [recipes, extraFoods]);

  const foodOptions = useMemo(() => {
    return [
      ...allFoodNames.map((f) => ({ value: f, label: f })),
      {
        value: NEW_FOOD_VALUE,
        label: "+ New food…",
        disabled: selectedUnit === null,
      },
    ];
  }, [allFoodNames, selectedUnit]);

  const unitOptions = IMPERIAL_BASE_UNITS.map((u) => ({
    value: u.value,
    label: u.label,
  }));

  const selectedUnitLabel =
    IMPERIAL_BASE_UNITS.find((u) => u.value === selectedUnit)?.label ??
    "selected unit";

  /* ================= DELETE ================= */
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

  /* ================= PERMISSION ================= */
  const isAdmin = accountType === 0 || accountType === 3;

  /* ================= REPORT ================= */
  async function handleReportRecipe(rid) {
    console.log("Reporting recipe with rid:", rid);
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
            desc: desc,
            rep_type: "rcp",
            obj_id: rid,
          }),
        }
      );

      const json = await res.json();
      if (json?.Result === "Success") {
        alert("Recipe reported successfully.");
      } else {
        console.error(json?.Message);
        alert("Failed to report recipe: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
      alert("Network error while reporting recipe.");
    }
  }

  /* ================= PERMISSION ================= */
  const canDeleteRecipe = (recipe) =>
    !recipe.isPublic || (isAdmin && recipe.isPublic);

  const canReportRecipe = (recipe) =>
    recipe.isPublic;
  function handleFoodChange(val) {
    if (val === NEW_FOOD_VALUE) {
      if (selectedUnit === null) return;
      setNewFoodModalOpen(true);
      return;
    }

    setSelectedFood(val);

    setRecipeFoods((prev) => [
      ...prev,
      {
        fname: val,
        qty: 1,
        isNew: extraFoods.some((f) => f.name === val),
        cal: extraFoods.find((f) => f.name === val)?.cal ?? 0,
        base_measurement: selectedUnit,
      },
    ]);
  }

  function updateQty(index, value) {
    const val = Number(value);

    setRecipeFoods((prev) =>
      prev.map((f, i) => (i === index ? { ...f, qty: val } : f))
    );
  }

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
  function handleCreateRecipeClick() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    if (!token || !username) {
      const confirmed = window.confirm("You need to log in to create a recipe. Would you like to log in now?");
      if (confirmed) {
        window.location.href = "/~group3sp26/login";
      }
      return;
    }

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

      console.log("Creating recipe with payload:", payload);

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
        setNewRecipe({ rname: "", desc: "", instruct: "", isPublic: false });
        setSelectedUnit(null);
        setSelectedFood(null);
        loadRecipes();
      } else {
        setFormError(json?.Message || "Failed to create recipe");
      }
    } catch (err) {
      setFormError("Network error. Please try again.");
    }
  }

  function handleRemoveFood(index) {
    setRecipeFoods((prev) => prev.filter((_, i) => i !== index));
  }

  async function loadAccountType() {
    const token = localStorage.getItem("token");
    if (!token) {
      setAccountType(null);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/get-auth-level?huid=${token}`);
      const json = await res.json();
      if (json?.Result === "Success" && json.Data?.[0]?.account_type !== undefined) {
        setAccountType(json.Data[0].account_type);
      } else {
        setAccountType(null);
      }
    } catch {
      setAccountType(null);
    }
  }

  async function handleCreateRecipeClick() {


    if (!localStorage.getItem("username") || !localStorage.getItem("token")) {
      const confirmed = window.confirm("You need to log in to create a recipe. Would you like to log in now?");
      if (confirmed) {
        window.location.href = "/~group3sp26/login";
      }
      return;
    }

    await loadAccountType();
    setCreateRecipeModalOpen(true);
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
                    <SearchableSelect
                      label="Unit"
                      options={unitOptions}
                      value={selectedUnit}
                      onChange={(v) => setSelectedUnit(Number(v))}
                      placeholder="Select unit..."
                    />
                  </div>
                  <div className="createRecipeSelector">
                    <SearchableSelect
                      label="Food"
                      options={foodOptions}
                      value={selectedFood}
                      onChange={handleFoodChange}
                      placeholder="Search foods..."
                      disabled={selectedUnit === null}
                    />
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
                          {IMPERIAL_BASE_UNITS.find(u => u.value === food.base_measurement)?.label}
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