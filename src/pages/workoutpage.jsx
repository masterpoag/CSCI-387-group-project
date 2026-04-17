import { useEffect, useMemo, useState } from "react";
import WorkoutCard from "./cards/WorkoutCard";


// TODO ADD: Need API implemented to create workouts.
// TODO Add: allow admins to delete public workouts.

//TODO STRECH GOALS:
// - Allow users to delete their workouts

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

const EXERCISE_TYPES = [
  { value: 0, label: "Strength" },
  { value: 1, label: "Cardio" },
  { value: 2, label: "Flexibility" },
  { value: 3, label: "HIIT" },
];

const NEW_EXERCISE_VALUE = "__new_exercise__";

export default function WorkoutPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [workoutsError, setWorkoutsError] = useState("");

  const [extraExercises, setExtraExercises] = useState([]);

  const [selectedExerciseType, setSelectedExerciseType] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const [newExerciseModalOpen, setNewExerciseModalOpen] = useState(false);
  const [createWorkoutModalOpen, setCreateWorkoutModalOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [accountType, setAccountType] = useState(null);

  const [workoutExercises, setWorkoutExercises] = useState([]);

  const [newWorkout, setNewWorkout] = useState({
    wname: "",
    desc: "",
    instruct: "",
    isPublic: false,
  });

  // ================= LOAD WORKOUTS =================
  async function loadWorkouts() {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const [publicRes, userRes] = await Promise.all([
        fetch(`${API_BASE}/api/get-public-workout`, { headers }),
        fetch(`${API_BASE}/api/get-user-workout?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}`, { headers }),
      ]);

      const publicJson = await publicRes.json();
      const userJson = await userRes.json();

      const publicWorkouts = publicJson?.Data ?? [];
      const userWorkouts = userJson?.Data ?? [];

      const allWorkouts = [...userWorkouts, ...publicWorkouts];
      setWorkouts(allWorkouts);
    } catch {
      setWorkoutsError("Network error");
    }
  }

  useEffect(() => {
    loadWorkouts();
  }, []);

  // ================= FILTER =================
  const filteredWorkouts = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return workouts.filter((w) =>
      w.name?.toLowerCase().includes(term) ||
      w.desc?.toLowerCase().includes(term) ||
      w.instruct?.toLowerCase().includes(term)
    );
  }, [workouts, searchTerm]);

  // ================= EXERCISES =================
  const allExerciseNames = useMemo(() => {
    const exercises = [];

    workouts.forEach((w) => {
      w.exercises?.forEach((e) => {
        if (e?.name) exercises.push(e.name);
      });
    });

    extraExercises.forEach((e) => exercises.push(e.name));

    return [...new Set(exercises)];
  }, [workouts, extraExercises]);

  const exerciseOptions = useMemo(() => {
    return [
      ...allExerciseNames.map((e) => ({ value: e, label: e })),
      {
        value: NEW_EXERCISE_VALUE,
        label: "+ New exercise…",
        disabled: selectedExerciseType === null,
      },
    ];
  }, [allExerciseNames, selectedExerciseType]);

  const exerciseTypeOptions = EXERCISE_TYPES.map((t) => ({
    value: t.value,
    label: t.label,
  }));

  // ================= HANDLERS =================
  function handleExerciseChange(val) {
    if (val === NEW_EXERCISE_VALUE) {
      if (selectedExerciseType === null) return;
      setNewExerciseModalOpen(true);
      return;
    }

    setSelectedExercise(val);

    setWorkoutExercises((prev) => [
      ...prev,
      {
        name: val,
        sets: 3,
        reps: 10,
        duration: 0,
        exercise_type: selectedExerciseType,
      },
    ]);
  }

  function updateExerciseField(index, field, value) {
    setWorkoutExercises((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e))
    );
  }

  function handleNewExerciseSave({ name }) {
    setExtraExercises((prev) => [...prev, { name }]);

    setWorkoutExercises((prev) => [
      ...prev,
      {
        name,
        sets: 3,
        reps: 10,
        duration: 0,
        exercise_type: selectedExerciseType,
      },
    ]);
  }

  function buildCreateWorkoutPayload() {
    return {
      nw: {
        wname: newWorkout.wname,
        desc: newWorkout.desc,
        instruct: newWorkout.instruct,
        isPublic: newWorkout.isPublic,
      },
      exercises: workoutExercises,
    };
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

  async function handleCreateWorkoutClick() {
    if (!localStorage.getItem("username") || !localStorage.getItem("token")) {
      const confirmed = window.confirm("You need to log in to create a workout. Would you like to log in now?");
      if (confirmed) {
        window.location.href = "/~group3sp26/login";
      }
      return;
    }

    await loadAccountType();
    setCreateWorkoutModalOpen(true);
  }

  async function handleCreateWorkout() {
    setFormError("");

    if (!newWorkout.wname.trim()) {
      setFormError("Workout name is required");
      return;
    }

    if (workoutExercises.length === 0) {
      setFormError("At least one exercise is required");
      return;
    }

    try {
      const payload = buildCreateWorkoutPayload();

      const res = await fetch(
        `${API_BASE}/api/create-workout?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (json?.Result === "Success") {
        setCreateWorkoutModalOpen(false);
        setWorkoutExercises([]);
        setNewWorkout({ wname: "", desc: "", instruct: "", isPublic: false });
        setSelectedExerciseType(null);
        setSelectedExercise(null);
        loadWorkouts();
      } else {
        setFormError(json?.Message || "Failed to create workout");
      }
    } catch (err) {
      setFormError("Network error. Please try again.");
    }
  }

  function handleRemoveExercise(index) {
    setWorkoutExercises((prev) => prev.filter((_, i) => i !== index));
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
              <WorkoutCard
                key={`${workout.name}-${workout.owner}`}
                workout={workout}
                exercises={workout.exercises}
              />
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

      {/* ================= MODAL ================= */}
      {createWorkoutModalOpen && (
        <div
          className="createRecipeModalBackdrop"
          onClick={() => setCreateWorkoutModalOpen(false)}
        >
          <div
            className="createRecipeModalDialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="createRecipeModalHeader">
              <h2 className="createRecipeModalTitle">Create New Workout</h2>

              <button
                className="createRecipeModalClose"
                onClick={() => setCreateWorkoutModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="createRecipeForm">
              {/* Workout Info Section */}
              <section className="createRecipeSection">
                <h3 className="createRecipeSectionTitle">Workout Details</h3>
                
                <div className="createRecipeField">
                  <label className="createRecipeLabel">Workout Name *</label>
                  <input
                    className="foodSearchInput"
                    placeholder="e.g., Upper Body Strength"
                    value={newWorkout.wname}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, wname: e.target.value })
                    }
                  />
                </div>

                <div className="createRecipeField">
                  <label className="createRecipeLabel">Description</label>
                  <textarea
                    className="foodSearchInput createRecipeTextarea"
                    placeholder="A brief description of your workout..."
                    value={newWorkout.desc}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, desc: e.target.value })
                    }
                  />
                </div>

                <div className="createRecipeField">
                  <label className="createRecipeLabel">Instructions</label>
                  <textarea
                    className="foodSearchInput createRecipeTextarea createRecipeInstructions"
                    placeholder="Step by step workout instructions..."
                    value={newWorkout.instruct}
                    onChange={(e) =>
                      setNewWorkout({ ...newWorkout, instruct: e.target.value })
                    }
                  />
                </div>

                {(accountType === 0 || accountType === 3) && (
                  <div className="createRecipeToggle">
                    <label className="createRecipeToggleLabel">
                      <input
                        type="checkbox"
                        checked={newWorkout.isPublic}
                        onChange={(e) =>
                          setNewWorkout({ ...newWorkout, isPublic: e.target.checked })
                        }
                        className="createRecipeCheckbox"
                      />
                      <span className="createRecipeToggleSwitch"></span>
                      <span className="createRecipeToggleText">
                        {newWorkout.isPublic ? "Public Workout" : "Private Workout"}
                      </span>
                    </label>
                  </div>
                )}
              </section>

              {/* Exercises Section */}
              <section className="createRecipeSection">
                <h3 className="createRecipeSectionTitle">Exercises</h3>

                <div className="createRecipeFoodSelectors">
                  <div className="createRecipeSelector">
                    <label className="createRecipeLabel">Exercise Type</label>
                    <select
                      className="foodSearchInput"
                      value={selectedExerciseType ?? ""}
                      onChange={(e) => setSelectedExerciseType(e.target.value ? Number(e.target.value) : null)}
                      style={{ borderRadius: "999px" }}
                    >
                      <option value="">Select type...</option>
                      {exerciseTypeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="createRecipeSelector">
                    <label className="createRecipeLabel">Exercise</label>
                    <select
                      className="foodSearchInput"
                      value={selectedExercise ?? ""}
                      onChange={(e) => handleExerciseChange(e.target.value)}
                      disabled={selectedExerciseType === null}
                      style={{ borderRadius: "999px" }}
                    >
                      <option value="">Select exercise...</option>
                      {allExerciseNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                      <option value={NEW_EXERCISE_VALUE}>+ New exercise...</option>
                    </select>
                  </div>
                </div>

                {/* Exercise Table */}
                {workoutExercises.length > 0 && (
                  <div className="createRecipeIngredientsTable">
                    <div className="createRecipeTableHeader">
                      <span className="tableColName">Exercise</span>
                      <span className="tableColQty">Sets</span>
                      <span className="tableColCal">Reps</span>
                      <span className="tableColUnit">Type</span>
                      <span className="tableColAction"></span>
                    </div>
                    {workoutExercises.map((exercise, index) => (
                      <div key={index} className="createRecipeTableRow">
                        <span className="tableColName">{exercise.name}</span>
                        <input
                          className="tableColQty createRecipeQtyInput"
                          type="number"
                          value={exercise.sets}
                          min="1"
                          onChange={(e) => updateExerciseField(index, "sets", Number(e.target.value))}
                        />
                        <input
                          className="tableColCal createRecipeQtyInput"
                          type="number"
                          value={exercise.reps}
                          min="0"
                          onChange={(e) => updateExerciseField(index, "reps", Number(e.target.value))}
                        />
                        <span className="tableColUnit">
                          {EXERCISE_TYPES.find(t => t.value === exercise.exercise_type)?.label}
                        </span>
                        <button
                          type="button"
                          className="tableColAction createRecipeRemoveBtn"
                          onClick={() => handleRemoveExercise(index)}
                          aria-label={`Remove ${exercise.name}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {workoutExercises.length === 0 && (
                  <div className="createRecipeEmptyIngredients">
                    No exercises added yet. Select a type and exercise above to add exercises.
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
                  onClick={() => setCreateWorkoutModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="foodCreateRecipeBtn createRecipeSubmitBtn"
                  onClick={handleCreateWorkout}
                >
                  Create Workout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= NEW EXERCISE MODAL ================= */}
      {newExerciseModalOpen && (
        <div
          className="createRecipeModalBackdrop"
          onClick={() => setNewExerciseModalOpen(false)}
        >
          <div
            className="createRecipeModalDialog"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px" }}
          >
            <div className="createRecipeModalHeader">
              <h2 className="createRecipeModalTitle">Add New Exercise</h2>

              <button
                className="createRecipeModalClose"
                onClick={() => setNewExerciseModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="createRecipeForm">
              <section className="createRecipeSection">
                <div className="createRecipeField">
                  <label className="createRecipeLabel">Exercise Name *</label>
                  <input
                    className="foodSearchInput"
                    placeholder="e.g., Pushups"
                    id="newExerciseName"
                  />
                </div>
              </section>

              <div className="createRecipeActions">
                <button
                  type="button"
                  className="createRecipeCancelBtn"
                  onClick={() => setNewExerciseModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="foodCreateRecipeBtn createRecipeSubmitBtn"
                  onClick={() => {
                    const nameInput = document.getElementById("newExerciseName");
                    const name = nameInput?.value?.trim();
                    if (name) {
                      handleNewExerciseSave({ name });
                      setNewExerciseModalOpen(false);
                    }
                  }}
                >
                  Add Exercise
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
