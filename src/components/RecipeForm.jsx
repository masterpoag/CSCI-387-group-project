// RecipeForm — early standalone recipe-creation component.
// Superseded by the inline modal in foodpage.jsx, but kept around as a
// reference implementation and for any standalone usage. Uses MOCK_FOODS
// when no live API is available so the form is testable in isolation.

import React, { useState } from "react";

// Same int-to-label mapping used elsewhere in the app.
const MEASUREMENT_OPTIONS = [
  { value: 0, label: "Pound" },
  { value: 1, label: "Ounce" },
  { value: 2, label: "Cup" },
  { value: 3, label: "Teaspoon" },
];

const MOCK_FOODS = [
  { fname: "Avocado" },
  { fname: "Chicken Breast" },
  { fname: "Quinoa" },
  { fname: "Spinach" },
  { fname: "Sourdough" },
  { fname: "Eggs" },
  { fname: "Salmon" },
  { fname: "Brown Rice" },
  { fname: "Olive Oil" },
  { fname: "Garlic" },
];

export default function RecipeForm({ darkMode, onClose, onSubmit, apiUrl }) {
  const [formData, setFormData] = useState({
    rname: "",
    desc: "",
    instruct: "",
    isPublic: false,
  });

  const [foods, setFoods] = useState([]);
  const [selectedFood, setSelectedFood] = useState("");
  const [foodSearch, setFoodSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newFood, setNewFood] = useState({
    fname: "",
    qty: "",
    cal: "",
    base_measurement: 2,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: "1rem",
  };

  const modalStyle = {
    backgroundColor: darkMode ? "#2c2c2c" : "#ffffff",
    color: darkMode ? "#ececec" : "#2d3436",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    maxWidth: "600px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxShadow: darkMode
      ? "0 8px 32px rgba(0,0,0,0.5)"
      : "0 8px 32px rgba(0,0,0,0.15)",
    border: darkMode ? "1px solid #444" : "1px solid #eee",
  };

  const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1.5rem",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: darkMode ? "1px solid #555" : "1px solid #ccc",
    backgroundColor: darkMode ? "#3c3c3c" : "#fff",
    color: darkMode ? "#fff" : "#000",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle = {
    display: "block",
    marginBottom: "6px",
    fontWeight: "500",
    fontSize: "0.9rem",
  };

  const fieldGroupStyle = {
    marginBottom: "1rem",
  };

  const buttonStyle = {
    padding: "10px 20px",
    fontSize: "1rem",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "500",
    transition: "opacity 0.2s",
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#4caf50",
    color: "white",
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: darkMode ? "#555" : "#e0e0e0",
    color: darkMode ? "#fff" : "#333",
    marginRight: "0.5rem",
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#f44336",
    color: "white",
    padding: "6px 12px",
    fontSize: "0.85rem",
  };

  const dropdownStyle = {
    ...inputStyle,
    cursor: "pointer",
  };

  const foodRowStyle = {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
    gap: "0.5rem",
    alignItems: "center",
    padding: "0.5rem 0",
    borderBottom: `1px solid ${darkMode ? "#444" : "#eee"}`,
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleNewFoodChange = (e) => {
    const { name, value } = e.target;
    setNewFood((prev) => ({
      ...prev,
      [name]: name === "base_measurement" ? parseInt(value) : value,
    }));
  };

  const filteredFoods = MOCK_FOODS.filter((f) =>
    f.fname.toLowerCase().includes(foodSearch.toLowerCase())
  );

  const handleFoodSelect = (foodName) => {
    setSelectedFood(foodName);
    setFoodSearch("");
    setShowDropdown(false);
    setIsCreatingNew(false);
  };

  const handleCreateNewToggle = () => {
    setIsCreatingNew(true);
    setSelectedFood("");
    setFoodSearch("");
    setShowDropdown(false);
  };

  const handleAddFood = () => {
    if (isCreatingNew) {
      if (!newFood.fname || !newFood.qty || !newFood.cal) {
        setError("Please fill in all food fields");
        return;
      }
      setFoods((prev) => [
        ...prev,
        {
          fname: newFood.fname,
          qty: parseFloat(newFood.qty),
          cal: parseFloat(newFood.cal),
          base_measurement: newFood.base_measurement,
          isNew: true,
        },
      ]);
      setNewFood({ fname: "", qty: "", cal: "", base_measurement: 2 });
      setIsCreatingNew(false);
    } else if (selectedFood) {
      setFoods((prev) => [
        ...prev,
        {
          fname: selectedFood,
          qty: 1,
          cal: 0,
          base_measurement: 0,
          isNew: false,
        },
      ]);
      setSelectedFood("");
    }
    setError("");
  };

  const handleRemoveFood = (index) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFoodQtyChange = (index, qty) => {
    setFoods((prev) =>
      prev.map((f, i) => (i === index ? { ...f, qty: parseFloat(qty) || 0 } : f))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.rname.trim()) {
      setError("Recipe name is required");
      return;
    }

    if (foods.length === 0) {
      setError("At least one food item is required");
      return;
    }

    const payload = {
      nr: {
        rname: formData.rname.trim(),
        desc: formData.desc.trim(),
        instruct: formData.instruct.trim(),
        isPublic: formData.isPublic,
      },
      foods: foods.map((f) => ({
        fname: f.fname,
        qty: f.qty,
        isNew: f.isNew,
        cal: f.cal,
        base_measurement: f.base_measurement,
      })),
    };

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to create recipe");
      }

      const data = await response.json();
      onSubmit(data);
      onClose();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0 }}>Create New Recipe</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: darkMode ? "#aaa" : "#666",
              padding: "0 8px",
            }}
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Recipe Name *</label>
            <input
              type="text"
              name="rname"
              value={formData.rname}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Enter recipe name"
              required
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Description</label>
            <textarea
              name="desc"
              value={formData.desc}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: "60px", resize: "vertical" }}
              placeholder="Brief description of the recipe"
            />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Instructions</label>
            <textarea
              name="instruct"
              value={formData.instruct}
              onChange={handleChange}
              style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }}
              placeholder="Step by step instructions"
            />
          </div>

          <div style={{ ...fieldGroupStyle, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              name="isPublic"
              id="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              style={{ width: "18px", height: "18px" }}
            />
            <label htmlFor="isPublic" style={{ ...labelStyle, marginBottom: 0 }}>
              Make this recipe public
            </label>
          </div>

          <hr style={{ border: `1px solid ${darkMode ? "#444" : "#eee"}`, margin: "1.5rem 0" }} />

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>Food Items *</label>

            {foods.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div
                  style={{
                    ...foodRowStyle,
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    opacity: 0.7,
                  }}
                >
                  <span>Food</span>
                  <span>Qty</span>
                  <span>Cal</span>
                  <span>Unit</span>
                  <span></span>
                </div>
                {foods.map((food, index) => (
                  <div key={index} style={foodRowStyle}>
                    <span>{food.fname}</span>
                    <input
                      type="number"
                      value={food.qty}
                      onChange={(e) => handleFoodQtyChange(index, e.target.value)}
                      style={{
                        ...inputStyle,
                        padding: "6px 8px",
                        fontSize: "0.9rem",
                      }}
                      min="0"
                      step="0.1"
                    />
                    <span>{food.cal}</span>
                    <span>{MEASUREMENT_OPTIONS[food.base_measurement]?.label}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFood(index)}
                      style={dangerButtonStyle}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                border: `1px dashed ${darkMode ? "#555" : "#ccc"}`,
                borderRadius: "8px",
                padding: "1rem",
              }}
            >
              {!isCreatingNew ? (
                <div>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      value={selectedFood || foodSearch}
                      onChange={(e) => {
                        setFoodSearch(e.target.value);
                        setSelectedFood("");
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      style={dropdownStyle}
                      placeholder="Search or select a food..."
                    />
                    {showDropdown && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          backgroundColor: darkMode ? "#3c3c3c" : "#fff",
                          border: `1px solid ${darkMode ? "#555" : "#ccc"}`,
                          borderRadius: "8px",
                          maxHeight: "200px",
                          overflowY: "auto",
                          zIndex: 10,
                          marginTop: "4px",
                        }}
                      >
                        {foodSearch &&
                          filteredFoods.map((food, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleFoodSelect(food.fname)}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                borderBottom: `1px solid ${darkMode ? "#444" : "#eee"}`,
                              }}
                              onMouseOver={(e) =>
                                (e.target.style.backgroundColor = darkMode ? "#555" : "#f5f5f5")
                              }
                              onMouseOut={(e) =>
                                (e.target.style.backgroundColor = "transparent")
                              }
                            >
                              {food.fname}
                            </div>
                          ))}
                        <div
                          onClick={() => handleCreateNewToggle()}
                          style={{
                            padding: "10px 14px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            color: "#4caf50",
                            borderTop: `1px solid ${darkMode ? "#555" : "#ccc"}`,
                          }}
                          onMouseOver={(e) =>
                            (e.target.style.backgroundColor = darkMode ? "#555" : "#f5f5f5")
                          }
                          onMouseOut={(e) =>
                            (e.target.style.backgroundColor = "transparent")
                          }
                        >
                          + Create New Food
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFood}
                    disabled={!selectedFood}
                    style={{
                      ...buttonStyle,
                      marginTop: "0.75rem",
                      backgroundColor: selectedFood ? "#4caf50" : "#888",
                      color: "white",
                      opacity: selectedFood ? 1 : 0.6,
                    }}
                  >
                    Add Selected Food
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong style={{ fontSize: "0.9rem" }}>Create New Food</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Food Name *</label>
                      <input
                        type="text"
                        name="fname"
                        value={newFood.fname}
                        onChange={handleNewFoodChange}
                        style={inputStyle}
                        placeholder="e.g., Banana"
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Quantity *</label>
                      <input
                        type="number"
                        name="qty"
                        value={newFood.qty}
                        onChange={handleNewFoodChange}
                        style={inputStyle}
                        placeholder="1"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Calories *</label>
                      <input
                        type="number"
                        name="cal"
                        value={newFood.cal}
                        onChange={handleNewFoodChange}
                        style={inputStyle}
                        placeholder="100"
                        min="0"
                      />
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: "0.8rem" }}>Base Measurement *</label>
                      <select
                        name="base_measurement"
                        value={newFood.base_measurement}
                        onChange={handleNewFoodChange}
                        style={dropdownStyle}
                      >
                        {MEASUREMENT_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                    <button
                      type="button"
                      onClick={handleAddFood}
                      style={{
                        ...buttonStyle,
                        backgroundColor: "#4caf50",
                        color: "white",
                      }}
                    >
                      Add Food
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setNewFood({ fname: "", qty: "", cal: "", base_measurement: 2 });
                      }}
                      style={{
                        ...buttonStyle,
                        backgroundColor: darkMode ? "#555" : "#e0e0e0",
                        color: darkMode ? "#fff" : "#333",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#ffebee",
                border: "1px solid #f44336",
                borderRadius: "8px",
                color: "#c62828",
                marginBottom: "1rem",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              style={secondaryButtonStyle}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" style={primaryButtonStyle} disabled={loading}>
              {loading ? "Creating..." : "Create Recipe"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
