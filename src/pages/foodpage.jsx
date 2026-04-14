import { useEffect, useMemo, useState } from "react";
import RecipeCard from "./cards/RecipeCard";
import SearchableSelect from "../components/SearchableSelect";
import NewFoodModal from "../components/NewFoodModal";

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

  const [recipeFoods, setRecipeFoods] = useState([]);

  const [newRecipe, setNewRecipe] = useState({
    rname: "",
    desc: "",
    instruct: "",
    isPublic: true,
  });

  // ================= LOAD RECIPES =================
  useEffect(() => {
    async function loadRecipes() {
      try {
        const res = await fetch(`${API_BASE}/api/get-public-recipe`);
        const json = await res.json();

        if (json?.Result === "Success") {
          setRecipes(json.Data ?? []);
        } else {
          setFoodsError(json?.Message || "Failed to load recipes");
        }
      } catch {
        setFoodsError("Network error");
      }
    }

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

  // ================= HANDLERS =================
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
        isPublic: newRecipe.isPublic,
      },
      foods: recipeFoods,
    };
  }

  async function handleCreateRecipe() {
    try {
      const payload = buildCreateRecipePayload();

      const res = await fetch(
        `${API_BASE}/api/create-recipe?huid=1&uname=joey`,
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
      } else {
        console.error(json?.Message);
      }
    } catch (err) {
      console.error(err);
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
              onClick={() => setCreateRecipeModalOpen(true)}
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
              <h2 className="createRecipeModalTitle">Create recipe</h2>

              <button
                className="createRecipeModalClose"
                onClick={() => setCreateRecipeModalOpen(false)}
              >
                ×
              </button>
            </div>

            <section className="foodIngredientPanel foodIngredientPanelInModal">
              <h3 className="foodIngredientTitle">Foods & units</h3>

              {foodsError && (
                <p className="foodIngredientWarning">{foodsError}</p>
              )}

              <input
                className="foodSearchInput"
                placeholder="Recipe name"
                value={newRecipe.rname}
                onChange={(e) =>
                  setNewRecipe({ ...newRecipe, rname: e.target.value })
                }
              />

              <input
                className="foodSearchInput"
                placeholder="Description"
                value={newRecipe.desc}
                onChange={(e) =>
                  setNewRecipe({ ...newRecipe, desc: e.target.value })
                }
              />

              <textarea
                className="foodSearchInput"
                placeholder="Instructions"
                value={newRecipe.instruct}
                onChange={(e) =>
                  setNewRecipe({ ...newRecipe, instruct: e.target.value })
                }
              />

              <div className="foodIngredientRow">
                <SearchableSelect
                  label="Unit"
                  options={unitOptions}
                  value={selectedUnit}
                  onChange={(v) => setSelectedUnit(Number(v))}
                />

                <SearchableSelect
                  label="Food"
                  options={foodOptions}
                  value={selectedFood}
                  onChange={handleFoodChange}
                />
              </div>

              {/* INGREDIENT LIST */}
              {recipeFoods.map((food, index) => (
                <div key={index} className="foodIngredientRow">
                  <span>{food.fname}</span>

                  <input
                    className="foodSearchInput"
                    type="number"
                    value={food.qty}
                    onChange={(e) => updateQty(index, e.target.value)}
                  />
                </div>
              ))}

              <button
                className="foodCreateRecipeBtn"
                onClick={handleCreateRecipe}
              >
                Save Recipe
              </button>
            </section>
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