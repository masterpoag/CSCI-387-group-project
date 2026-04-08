import { useEffect, useMemo, useState } from "react";
import RecipeCard from "./cards/RecipeCard";
import SearchableSelect from "../components/SearchableSelect";
import NewFoodModal from "../components/NewFoodModal";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp-test.vroey.us";

/** Matches backend `base_measurement` on Food (imperial base units). */
const IMPERIAL_BASE_UNITS = [
  { value: 0, label: "Pound (lb)" },
  { value: 1, label: "Ounce (oz)" },
  { value: 2, label: "Cup" },
  { value: 3, label: "Teaspoon (tsp)" },
];

const NEW_FOOD_VALUE = "__new_food__";

const MOCK_RECIPES = [
  {
    rid: 1,
    name: "Classic Avocado Toast",
    desc: "A simple, healthy breakfast staple.",
    instruct: "1. Toast the bread until golden.\n2. Mash avocado with salt and pepper.\n3. Spread on toast.",
    isPublic: true,
    ingredients: [
      { name: "Sourdough", qty: 1.0, cal: 120 },
      { name: "Avocado", qty: 0.5, cal: 160 },
    ],
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
      { name: "Spinach", qty: 2.0, cal: 14 },
    ],
  },
];

function normalizeFoodRows(data) {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => (typeof row?.name === "string" ? row.name.trim() : ""))
    .filter(Boolean);
}

export default function RecipePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [foodsFromApi, setFoodsFromApi] = useState([]);
  const [foodsError, setFoodsError] = useState("");
  const [extraFoods, setExtraFoods] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [newFoodModalOpen, setNewFoodModalOpen] = useState(false);
  const [createRecipeModalOpen, setCreateRecipeModalOpen] = useState(false);

  function closeCreateRecipeModal() {
    setCreateRecipeModalOpen(false);
    setSelectedUnit(null);
    setSelectedFood(null);
    setNewFoodModalOpen(false);
  }

  useEffect(() => {
    let cancelled = false;
    async function loadFoods() {
      setFoodsError("");
      try {
        const res = await fetch(`${API_BASE}/api/get-food`, {
          headers: { accept: "application/json" },
        });
        const json = await res.json();
        if (cancelled) return;
        if (json?.Result === "Success" && Array.isArray(json?.Data)) {
          setFoodsFromApi(normalizeFoodRows(json.Data));
        } else {
          setFoodsFromApi([]);
          setFoodsError(json?.Message || "Could not load foods.");
        }
      } catch {
        if (!cancelled) {
          setFoodsFromApi([]);
          setFoodsError("Food list unavailable (network or CORS).");
        }
      }
    }
    loadFoods();
    return () => {
      cancelled = true;
    };
  }, []);

  const allFoodNames = useMemo(() => {
    const set = new Set([...foodsFromApi, ...extraFoods.map((f) => f.name)]);
    return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  }, [foodsFromApi, extraFoods]);

  const unitOptions = useMemo(
    () => IMPERIAL_BASE_UNITS.map((u) => ({ value: u.value, label: u.label })),
    []
  );

  const foodOptions = useMemo(() => {
    const fromDb = allFoodNames.map((name) => ({
      value: name,
      label: name,
    }));
    return [
      ...fromDb,
      {
        value: NEW_FOOD_VALUE,
        label: "+ New food…",
        disabled: selectedUnit === null,
      },
    ];
  }, [allFoodNames, selectedUnit]);

  const selectedUnitLabel =
    IMPERIAL_BASE_UNITS.find((u) => u.value === selectedUnit)?.label ?? "selected unit";

  function handleFoodChange(val) {
    if (val === NEW_FOOD_VALUE) {
      if (selectedUnit === null) return;
      setNewFoodModalOpen(true);
      return;
    }
    setSelectedFood(val);
  }

  function handleNewFoodSave({ name, cal }) {
    setExtraFoods((prev) => {
      if (prev.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
        return prev;
      }
      return [...prev, { name, cal, baseUnit: selectedUnit }];
    });
    setSelectedFood(name);
  }

  const filteredRecipes = MOCK_RECIPES.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <p className="foodSubtitle">Search by recipe name or description.</p>
          <input
            className="foodSearchInput"
            type="text"
            placeholder="Search by recipe name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <p className="foodResultsMeta">Showing {filteredRecipes.length} recipes</p>
        </div>

        <div className="foodRecipeGrid">
          {filteredRecipes.length > 0 ? (
            filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.rid} recipe={recipe} ingredients={recipe.ingredients} />
            ))
          ) : (
            <div className="foodEmptyState">
              <h3 className="foodEmptyTitle">No recipes found</h3>
              <p className="foodEmptyText">
                Nothing matched &quot;{searchTerm}&quot;. Try a different keyword.
              </p>
            </div>
          )}
        </div>
      </div>

      {createRecipeModalOpen && (
        <div
          className="createRecipeModalBackdrop"
          role="presentation"
          onMouseDown={closeCreateRecipeModal}
        >
          <div
            className="createRecipeModalDialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="createRecipeModalTitle"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="createRecipeModalHeader">
              <h2 id="createRecipeModalTitle" className="createRecipeModalTitle">
                Create recipe
              </h2>
              <button
                type="button"
                className="createRecipeModalClose"
                aria-label="Close"
                onClick={closeCreateRecipeModal}
              >
                ×
              </button>
            </div>
            <section className="foodIngredientPanel foodIngredientPanelInModal" aria-label="Ingredient lookup">
              <h3 className="foodIngredientTitle">Foods &amp; units</h3>
              <p className="foodIngredientSubtitle">
                Choose a base unit, then pick a food from the database or add a new one. New foods
                use calories per <strong>1</strong> of the unit you selected (matches the API&apos;s
                imperial base units).
              </p>
              {foodsError && <p className="foodIngredientWarning">{foodsError}</p>}
              <div className="foodIngredientRow">
                <SearchableSelect
                  label="Unit (imperial)"
                  placeholder="Search units…"
                  options={unitOptions}
                  value={selectedUnit}
                  onChange={(v) => {
                    setSelectedUnit(typeof v === "number" ? v : Number(v));
                  }}
                />
                <SearchableSelect
                  label="Food"
                  placeholder="Search foods…"
                  options={foodOptions}
                  value={selectedFood}
                  onChange={handleFoodChange}
                  emptyMessage="No foods match"
                />
              </div>
              {selectedUnit !== null && selectedFood && selectedFood !== NEW_FOOD_VALUE && (
                <p className="foodIngredientSummary">
                  Selected: <strong>{selectedFood}</strong> · base unit:{" "}
                  <strong>{selectedUnitLabel}</strong>
                </p>
              )}
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
