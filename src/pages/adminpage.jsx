import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("users"); // "users" or "reports"

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/get-all-user?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        console.log("Loaded users:", json.Data);
        setUsers(json.Data ?? []);
      } else {
        setError(json?.Message || "Failed to load users");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const res = await fetch(
        `${API_BASE}/api/admin/get-all-reports?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}&tz=${tz}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        setReports(json.Data ?? []);
      } else {
        setError(json?.Message || "Failed to load reports");
      }
    } catch {
      setError("Network error loading reports");
    }
  }

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return users;

    return users.filter(
      (user) =>
        String(user.uid).toLowerCase().includes(term) ||
        user.username?.toLowerCase().includes(term) ||
        user.uname?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  async function handleChangeLevel(changedUid, newLevel) {
    const confirmed = window.confirm(
      `Are you sure you want to change this user's account type to ${newLevel}?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/change-user-level?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem(
          "username"
        )}&changed_uid=${changedUid}&level=${newLevel}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        loadUsers();
      } else {
        console.error(json?.Message);
      }
    } catch {
      console.error("Network error");
    }
  }

  async function handleDeleteUser(uid) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/delete-user?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem(
          "username"
        )}&deleted_uid=${uid}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        loadUsers();
      } else {
        console.error(json?.Message);
      }
    } catch {
      console.error("Network error");
    }
  }

  async function handleDeleteReport(repid) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/delete-report?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}&repid=${repid}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        loadReports();
      } else {
        console.error(json?.Message);
        alert("Failed to delete report: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
    }
  }

  async function handleDeleteReportedRecipe(rid) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this recipe?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/delete-recipe?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}&rid=${rid}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        loadReports(); // Refresh reports
      } else {
        console.error(json?.Message);
        alert("Failed to delete recipe: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
    }
  }

  async function handleDeleteReportedWorkout(wid) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this workout?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/delete-workout?huid=${localStorage.getItem(
          "token"
        )}&uname=${localStorage.getItem("username")}&wid=${wid}`
      );
      const json = await res.json();

      if (json?.Result === "Success") {
        loadReports(); // Refresh reports
      } else {
        console.error(json?.Message);
        alert("Failed to delete workout: " + (json?.Message || "Unknown error"));
      }
    } catch {
      console.error("Network error");
    }
  }

 const getAccountTypeLabel = (type) => {
    switch (type) {
      case 0:
        return "Admin";
      case 1:
        return "Standard";
      case 2:
        return "Chef";
      case 3:
        return "Trainer";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="foodPage">
      <div className="foodPageContent">
        <div className="foodSearchPanel">
          <p className="foodKicker">Admin Panel</p>
          <h1 className="foodTitle">Admin Dashboard</h1>

          <div className="adminTabs">
            <button
              className={`adminTab ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              User Management
            </button>
            <button
              className={`adminTab ${activeTab === "reports" ? "active" : ""}`}
              onClick={() => setActiveTab("reports")}
            >
              Reports ({reports.length})
            </button>
          </div>

          {activeTab === "users" && (
            <input
              className="foodSearchInput"
              placeholder="Search by ID, username, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          )}
        </div>

        {error && <div className="foodError">{error}</div>}

        {activeTab === "users" && (
          loading ? (
            <div className="foodLoading">Loading users...</div>
          ) : (
            <div className="foodRecipeGrid">
              {filteredUsers.map((user) => (
                <article key={user.uid} className="recipeCard">
                  <div className="recipeCardContent">
                    <div className="recipeCardTop">
                      <h2 className="recipeCardTitle">{user.username}</h2>
                      <span className={`recipeCardBadge ${user.account_type === 0 ? "isPublic" : "isPrivate"}`}>
                        {getAccountTypeLabel(user.account_type)}
                      </span>
                    </div>

                    <hr className="recipeCardDivider" />

                    <div className="recipeCardSection">
                      <p className="recipeCardDesc">
                        <strong>User ID:</strong> {user.uid}
                      </p>
                      <p className="recipeCardDesc">
                        <strong>Email:</strong> {user.uname || "N/A"}
                      </p>
                    </div>

                    <div className="adminUserActions">
                      {user.account_type !== 0 && (
                        <>
                          <div className="adminUserAction">
                            <label className="adminUserActionLabel">Change Type:</label>
                            <select
                              className="adminUserActionSelect"
                              value={user.account_type}
                              onChange={(e) =>
                                handleChangeLevel(user.uid, Number(e.target.value))
                              }
                            >
                              <option value={1}>Standard</option>
                              <option value={2}>Chef</option>
                              <option value={3}>Trainer</option>
                            </select>
                          </div>

                          <button
                            className="adminDeleteBtn"
                            onClick={() => handleDeleteUser(user.uid)}
                          >
                            Delete User
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        )}

        {activeTab === "reports" && (
          <div className="foodRecipeGrid">
            {reports.length === 0 ? (
              <div className="foodEmptyState">
                <h3 className="foodEmptyTitle">No reports found</h3>
              </div>
            ) : (
              reports.map((report) => (
                <article key={report.repid} className="recipeCard">
                  <div className="recipeCardContent">
                    <div className="recipeCardTop">
                      <h2 className="recipeCardTitle">{report.rname}</h2>
                      <span className="recipeCardBadge isPublic">
                        {report.rep_type === "rcp" ? "Recipe" : report.rep_type === "wrk" ? "Workout" : "Food"}
                      </span>
                    </div>

                    <hr className="recipeCardDivider" />

                    <div className="recipeCardSection">
                      <p className="recipeCardDesc">
                        <strong>Description:</strong> {report.descript}
                      </p>
                      <p className="recipeCardDesc">
                        <strong>Reported by:</strong> {report.uname}
                      </p>
                      <p className="recipeCardDesc">
                        <strong>Date:</strong> {report.timestub}
                      </p>
                    </div>

                    {report.obj && (
                      <div className="recipeCardSection">
                        <p className="recipeCardDesc">
                          <strong>Reported Item:</strong> {report.obj.name}
                        </p>
                        <p className="recipeCardDesc">
                          <strong>Owner:</strong> {report.obj.owner}
                        </p>
                      </div>
                    )}

                    <div className="adminUserActions">
                      <button
                        className="adminDeleteBtn"
                        onClick={() => handleDeleteReport(report.repid)}
                      >
                        Delete Report
                      </button>

                      {report.obj && report.rep_type === "rcp" && (
                        <button
                          className="adminDeleteBtn"
                          onClick={() => handleDeleteReportedRecipe(report.obj_id)}
                        >
                          Delete Recipe
                        </button>
                      )}

                      {report.obj && report.rep_type === "wrk" && (
                        <button
                          className="adminDeleteBtn"
                          onClick={() => handleDeleteReportedWorkout(report.obj_id)}
                        >
                          Delete Workout
                        </button>
                      )}
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