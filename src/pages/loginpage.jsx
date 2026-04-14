import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({setIsAuthenticated}) {
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      let response;
  
      if (isRegistering) {
        response = await fetch("https://gp.vroey.us/api/register?hasCG=false", {
          method: "POST",
          headers: {
            "accept": "application/json",
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
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || "Registration failed");
        }
  
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
  
      } else {
        response = await fetch(
          `https://gp.vroey.us/api/login?uname=${encodeURIComponent(formData.email)}&upass=${encodeURIComponent(formData.password)}`
        );
        const data = await response.json()
        if (data.Result !== "Success") {
          throw new Error(data.Message || "Login failed");
        }

        if (data.Data) {
          localStorage.setItem("username", formData.email)
          localStorage.setItem("token", data.Data); // assuming token is in Data
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
    </div>
  );
}

