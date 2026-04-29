// LoginPage — combined login + registration form.
//
// The same form is reused for both flows; the `isRegistering` state flips
// between them. New accounts are created as Standard users (atype=1); an
// admin can promote them later from the Admin Dashboard.

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({setIsAuthenticated}) {
  const navigate = useNavigate();
  // Shows the post-registration success modal so the user knows to log in.
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Toggle between Login mode and Create Account mode.
  const [isRegistering, setIsRegistering] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  // `loading` disables the submit button while the request is in flight.
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Generic input handler — keyed by the input's `name` attribute.
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Submits either registration or login depending on `isRegistering`.
  // On successful login, the hashed UID returned by the API is saved to
  // localStorage as the session token.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;

      if (isRegistering) {
        // Registration path. weight/calGoal use placeholders — the user can
        // refine them later (the backend requires fields to be present
        // even when hasCG=false).
        try {
          const response = await fetch(
            "https://gp.vroey.us/api/register?hasCG=false",
            {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                uname: formData.email,
                upass: formData.password,
                weight: 0.01,
                atype: 1,
                isMetric: false,
                calGoal: 2500,
              }),
            }
          );

          const data = await response.json()
          console.log(data)

          if (data.Result !== "Success") {
            throw new Error(data.Message || "Registration failed");
          }
          // Successful registration: bounce back to the login form so the
          // user can sign in with the credentials they just created.
          setIsRegistering(false);
          setShowSuccessPopup(true);
          setFormData({
            email: "",
            password: "",
            confirmPassword: "",
          });
          setError("");

        } catch (err) {
          console.error(err);
          alert(err.message);
        }

      } else {
        // Login path. Credentials go in the query string because the
        // backend's /api/login endpoint accepts GET parameters.
        response = await fetch(
          `https://gp.vroey.us/api/login?uname=${encodeURIComponent(formData.email)}&upass=${encodeURIComponent(formData.password)}`
        );
        const data = await response.json()
        if (data.Result !== "Success") {
          throw new Error(data.Message || "Login failed");
        }

        // data.Data is the hashed UID — used as the session token for
        // every authenticated request from now on.
        if (data.Data) {
          localStorage.setItem("username", formData.email)
          localStorage.setItem("token", data.Data);
          setIsAuthenticated(true);
          navigate("/");
        }
      }


    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginPage">
      <div className="loginCard" role="region" aria-label="Authentication">
        <div className="loginHeader">
          <div className="loginKicker">{isRegistering ? "Welcome" : "Welcome back"}</div>
          <h2 className="loginTitle">{isRegistering ? "Create Account" : "Login"}</h2>
        </div>

        <form onSubmit={handleSubmit} className="loginForm">
          <label className="field">
            <span className="fieldLabel">Email</span>
            <input
              className="textInput"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </label>

          <label className="field">
            <span className="fieldLabel">Password</span>
            <input
              className="textInput"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </label>

          {isRegistering && (
            <label className="field">
              <span className="fieldLabel">Confirm password</span>
              <input
                className="textInput"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </label>
          )}

          <button className="primaryButton" type="submit" disabled={loading}>
            <span className="primaryButtonInner">
              {loading
                ? "Please wait..."
                : isRegistering
                ? "Create Account"
                : "Login"}
            </span>
          </button>
        </form>

        {error && <p className="loginError">{error}</p>}

        <p className="loginFooter">
          <span className="loginFooterText">
            {isRegistering ? "Already have an account?" : "Don't have an account?"}
          </span>
          <button
            className="linkButton"
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
          >
            {isRegistering ? "Login" : "Create one"}
          </button>
        </p>
      </div>
      {showSuccessPopup && (
    <div className="popupOverlay">
        <div className="popupBox">
          <h3>Account Created</h3>
          <p>You can now log in</p>

          <button
            className="primaryButton"
            onClick={() => setShowSuccessPopup(false)}
          >
            OK
          </button>
        </div>
      </div>
    )}
    </div>
  );
}

