// FitDashboard — workout review queue for users with the Trainer
// (gym instructor) role and Admins. Mirrors ChefDashboard but for
// workouts: trainers approve & publish, or reject, publishable workouts.

import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

export default function FitDashboard() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Pulls every workout currently flagged as publishable. Refreshed
  // after each approve/reject action.
  async function loadWorkouts() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/fit/get-publishable-workout?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        setWorkouts(json.Data ?? []);
      } else {
        setError(json?.Message || "Failed to load publishable workouts");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkouts();
  }, []);

  // Approve & Publish: marks the workout public so it appears on the
  // shared Workouts page for everyone.
  async function handleApprove(wid) {
    const confirmed = window.confirm(
      "Are you sure you want to approve and publish this workout?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/fit/set-workout-publicity?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem(
          "username"
        )}&wid=${wid}&isPublic=true`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        loadWorkouts();
      } else {
        console.error(json?.Message);
        alert("Failed to approve workout: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
      alert("Network error while approving workout.");
    }
  }

  // Reject: clears the publishable flag so the workout drops off the
  // review queue. The workout stays as a personal workout for its owner.
  async function handleReject(wid) {
    const confirmed = window.confirm(
      "Are you sure you want to reject this workout? This will remove it from the publishable list."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/fit/set-workout-publicity?huid=${localStorage.getItem("token")}&uname=${localStorage.getItem("username")}&wid=${wid}&isPublic=false`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        loadWorkouts();
      } else {
        console.error(json?.Message);
        alert("Failed to reject workout: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
      alert("Network error while rejecting workout.");
    }
  }

  return (
    <div className="foodPage">
      <div className="foodPageContent">
        <div className="foodSearchPanel">
          <p className="foodKicker">Fitness Instructor Panel</p>
          <h1 className="foodTitle">Workout Review</h1>
          <p className="foodResultsMeta">
            {workouts.length} workout(s) awaiting review
          </p>
        </div>

        {error && <div className="foodError">{error}</div>}

        {loading ? (
          <div className="foodLoading">Loading workouts...</div>
        ) : (
          <div className="foodRecipeGrid">
            {workouts.length === 0 ? (
              <div className="foodEmptyState">
                <h3 className="foodEmptyTitle">No workouts to review</h3>
                <p className="foodEmptyText">
                  All caught up! No workouts are waiting for publication.
                </p>
              </div>
            ) : (
              workouts.map((workout, idx) => (
                <article key={workout.wid || idx} className="recipeCard">
                  <div className="recipeCardContent">
                    <div className="recipeCardTop">
                      <h2 className="recipeCardTitle">{workout.name}</h2>
                      <span className="recipeCardBadge isPrivate">
                        Pending Review
                      </span>
                    </div>

                    <hr className="recipeCardDivider" />

                    {workout.instructions && (
                      <div className="recipeCardSection recipeCardMethod">
                        <strong>Instructions:</strong>
                        <p className="recipeCardMethodText">
                          {workout.instructions}
                        </p>
                      </div>
                    )}

                    <p className="recipeCardDesc">
                      <strong>Owner:</strong> {workout.owner}
                    </p>

                    <div className="adminUserActions">
                      <button
                        className="adminApproveBtn"
                        onClick={() => handleApprove(workout.wid)}
                      >
                        Approve & Publish
                      </button>
                      <button
                        className="adminDeleteBtn"
                        onClick={() => handleReject(workout.wid)}
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
