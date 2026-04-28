import { useEffect, useMemo, useState } from "react";
import WorkoutCard from "./cards/WorkoutCard";

const API_BASE =
  import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

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
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="newFoodModalTitle">Create Workout</h2>

        <form className="newFoodModalForm" onSubmit={handleSubmit}>
          <label className="field">
            <span className="fieldLabel">Workout Name</span>
            <input
              className="textInput"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
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
            <div className="createRecipeToggle">
              <label className="createRecipeToggleLabel">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="createRecipeCheckbox"
                />
                <span className="createRecipeToggleSwitch"></span>
                <span className="createRecipeToggleText">
                  {isPublic ? "Public Workout" : "Private Workout"}
                </span>
              </label>
            </div>
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
              Save Workout
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

  const [createWorkoutModalOpen, setCreateWorkoutModalOpen] =
    useState(false);

  const [accountType, setAccountType] = useState(null);

  /* ================= AUTH ================= */
  const isAdmin = accountType === 0 || accountType === 3;

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
      const userJson = await userRes.json();

      const allWorkouts = [
        ...(userJson?.Data ?? []),
        ...(publicJson?.Data ?? []),
      ];

      setWorkouts(allWorkouts);
    } catch {
      setWorkoutsError("Network error");
    }
  }

  useEffect(() => {
    loadWorkouts();
  }, []);

  /* ================= DELETE ================= */
  async function handleDeleteWorkout(wid) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this workout?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/delete-workout?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}&wid=${wid}`,
        { method: "GET" }
      );

      const json = await res.json();

      if (json?.Result === "Success") {
        loadWorkouts();
      } else {
        console.error(json?.Message);
      }
    } catch {
      console.error("Network error");
    }
  }

  /* ================= FILTER ================= */
  const filteredWorkouts = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return workouts.filter(
      (w) =>
        w.name?.toLowerCase().includes(term) ||
        w.instructions?.toLowerCase().includes(term)
    );
  }, [workouts, searchTerm]);

  /* ================= ACCOUNT ================= */
  async function loadAccountType() {
    const token = localStorage.getItem("token");
    if (!token) return setAccountType(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/get-auth-level?huid=${token}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        setAccountType(json.Data?.[0]?.account_type);
      } else {
        setAccountType(null);
      }
    } catch {
      setAccountType(null);
    }
  }

  async function handleCreateWorkoutClick() {
    if (
      !localStorage.getItem("username") ||
      !localStorage.getItem("token")
    ) {
      const confirmed = window.confirm(
        "You need to log in to create a workout."
      );
      if (confirmed) {
        window.location.href = "/~group3sp26/login";
      }
      return;
    }

    await loadAccountType();
    setCreateWorkoutModalOpen(true);
  }

  /* ================= CREATE ================= */
  async function handleCreateWorkout(data) {
    try {
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

  /* ================= PERMISSION ================= */
  const canDeleteWorkout = (workout) =>
    !workout.isPublic || (isAdmin && workout.isPublic);

  const canReportWorkout = (workout) =>
    workout.isPublic;

  /* ================= REPORT ================= */
  async function handleReportWorkout(wid) {
    const confirmed = window.confirm(
      "Are you sure you want to report this workout?"
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
            rep_type: "wrk",
            obj_id: wid,
          }),
        }
      );

      const json = await res.json();
      if (json?.Result === "Success") {
        alert("Workout reported successfully.");
      } else {
        console.error(json?.Message);
        alert("Failed to report workout: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
      alert("Network error while reporting workout.");
    }
  }

  /* ================= UI ================= */
  return (
    <div className="foodPage">
      <div className="foodPageContent">
        <div className="foodSearchPanel">
          <button
            className="foodCreateRecipeBtn"
            onClick={handleCreateWorkoutClick}
          >
            Create Workout +
          </button>
          <p className="foodKicker">Find your next workout</p>
          <h1 className="foodTitle">Workout Explorer</h1>
          <input
            className="foodSearchInput"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
          />
        </div>

        <div className="foodRecipeGrid">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.wid}
              workout={workout}
              canDelete={canDeleteWorkout(workout)}
              onDelete={handleDeleteWorkout}
              canReport={canReportWorkout(workout)}
              onReport={handleReportWorkout}
            />
          ))}
        </div>
      </div>

      <NewWorkoutModal
        open={createWorkoutModalOpen}
        onClose={() => setCreateWorkoutModalOpen(false)}
        onSave={handleCreateWorkout}
        canMakePublic={isAdmin}
      />
    </div>
  );
}