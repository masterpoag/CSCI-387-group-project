import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE ?? "https://gp.vroey.us";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
  }, []);

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

  const getAccountTypeLabel = (type) => {
    switch (type) {
      case 0:
        return "Admin";
      case 1:
        return "Premium";
      case 2:
        return "Standard";
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
          <h1 className="foodTitle">User Management</h1>
        </div>

        {error && <div className="foodError">{error}</div>}

        {loading ? (
          <div className="foodLoading">Loading users...</div>
        ) : (
          <div className="foodRecipeGrid">
            {users.map((user) => (
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
                      <strong>Email:</strong> {user.email || "N/A"}
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
                            <option value={1}>Premium</option>
                            <option value={2}>Standard</option>
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
        )}
      </div>
    </div>
  );
}