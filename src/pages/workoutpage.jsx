import { configDotenv } from "dotenv";
import { useEffect, useMemo, useState } from "react";
import WorkoutCard from "./cards/WorkoutCard";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

/* ================= NEW WORKOUT MODAL ================= */
function NewWorkoutModal({ open, onClose, onSave, canMakePublic }) {
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setInstructions("");
      setIsPublic(false);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return;

    onSave({
      name: trimmed,
      instructions: instructions.trim(),
      isPublic,
    });

    onClose();
  }

  return (
    <div className="newFoodModalBackdrop" onMouseDown={onClose}>
      <div
        className="newFoodModalDialog"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="newFoodModalTitle">Create Workout</h2>

        <form className="newFoodModalForm" onSubmit={handleSubmit}>
          <label className="field">
            <span className="fieldLabel">Workout Name</span>
            <input
              className="textInput"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Instructions</span>
            <textarea
              className="textInput"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </label>

          {canMakePublic && (
            <label className="field">
              <span className="fieldLabel">Public</span>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
            </label>
          )}

          <div className="newFoodModalActions">
            <button
              type="button"
              className="newFoodModalCancel"
              onClick={onClose}
            >
              Cancel
            </button>

            <button type="submit" className="primaryButton">
              <span className="primaryButtonInner">
                Save Workout
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function WorkoutPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [workoutsError, setWorkoutsError] = useState("");

  const [createWorkoutModalOpen, setCreateWorkoutModalOpen] = useState(false);
  const [accountType, setAccountType] = useState(null);

  /* ================= LOAD WORKOUTS ================= */
  async function loadWorkouts() {
    try {
      const headers = { "Content-Type": "application/json" };

      const [publicRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/get-public-workout`, { headers }),
        fetch(
          `${API_BASE}/api/get-user-workout?huid=${localStorage.getItem(
            "token"
          )}&uname=${localStorage.getItem("username")}`,
          { headers }
        ),
      ]);

      const publicJson = await publicRes.json();
      console.log(publicJson)
      const userJson = await userRes.json();
      console.log(userJson)
      const allWorkouts = [
        ...(userJson?.Data ?? []),
        ...(publicJson?.Data ?? []),
      ];
      console.log(allWorkouts)

      setWorkouts(allWorkouts);
    } catch {
      setWorkoutsError("Network error");
    }
  }

  useEffect(() => {
    loadWorkouts();
  }, []);

  /* ================= FILTER ================= */
  const filteredWorkouts = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return workouts.filter(
      (w) =>
        w.name?.toLowerCase().includes(term) ||
        w.instructions?.toLowerCase().includes(term)
    );
  }, [workouts, searchTerm]);

  /* ================= AUTH ================= */
  async function loadAccountType() {
    const token = localStorage.getItem("token");
    if (!token) return setAccountType(null);

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

  async function handleCreateWorkoutClick() {
    if (!localStorage.getItem("username") || !localStorage.getItem("token")) {
      const confirmed = window.confirm(
        "You need to log in to create a workout. Would you like to log in now?"
      );
      if (confirmed) {
        window.location.href = "/~group3sp26/login";
      }
      return;
    }

    await loadAccountType();
    setCreateWorkoutModalOpen(true);
  }

  /* ================= CREATE WORKOUT ================= */
  async function handleCreateWorkout(data) {
    try {
      console.log(data)
      const res = await fetch(
        `${API_BASE}/api/create-workout?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const json = await res.json();

      if (json?.Result === "Success") {
        setCreateWorkoutModalOpen(false);
        loadWorkouts();
      } else {
        console.error(json?.Message);
      }
    } catch {
      console.error("Network error");
    }
  }

  /* ================= UI ================= */
  return (
    <div className="foodPage">
      <div className="foodPageContent">
        <div className="foodSearchPanel">
          <div className="foodSearchPanelTopBar">
            <button
              type="button"
              className="foodCreateRecipeBtn"
              onClick={handleCreateWorkoutClick}
            >
              Create Workout +
            </button>
          </div>

          <p className="foodKicker">Find your next workout</p>
          <h1 className="foodTitle">Workout Explorer</h1>

          <input
            className="foodSearchInput"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <p className="foodResultsMeta">
            Showing {filteredWorkouts.length} workouts
          </p>
        </div>

        <div className="foodRecipeGrid">
          {filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <WorkoutCard workout={workout} />
            ))
          ) : (
            <div className="foodEmptyState">
              <h3 className="foodEmptyTitle">No workouts found</h3>
              <p className="foodEmptyText">
                Try a different keyword.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <NewWorkoutModal
        open={createWorkoutModalOpen}
        onClose={() => setCreateWorkoutModalOpen(false)}
        onSave={handleCreateWorkout}
        canMakePublic={accountType === 0 || accountType === 3}
      />
    </div>
  );
}