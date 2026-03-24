import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage({/* Add Vars here for passthrough*/}) {
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
      if (isRegistering && formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }
      const endpoint = isRegistering
        ? "https://gp-test.vroey.us/api/register?hasCG=false"  // Is this jank. Yes. Does it work. Yes but requires this to be hosted on 2 different servers. Do I care. NO.
        : "https://gp-test.vroey.us/api/login?uname="+formData.email+"&upass="+formData.password; //TODO THIS NEEDS TO BE FIXED WITH ENCRIPTION

      const response = isRegistering ? await fetch(endpoint, {      // This runs if you are Registering
        method: "POST",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uname: formData.email,
          upass: formData.password,
          weight: 0.01,             // All hardcodes need to be added to the register form 
          atype: 1,                             // Most likely hardcoded in most cases
          isMetric: false,
          calGoal: 2500
        }),
      })
      : await fetch(endpoint, {           // This runs if you are loging in.
        method: "GET",
        headers: {
          "accept": "application/json",
          "Content-Type": "application/json",
        },
      });
      
      console.log(response);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      navigate("/food");

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

