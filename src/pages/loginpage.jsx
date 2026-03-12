import { useState } from "react";
import { useNavigate } from "react-router-dom";

const containerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  marginTop: "100px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "250px",
};

const linkStyle = {
  marginLeft: "5px",
  background: "none",
  border: "none",
  color: "blue",
  cursor: "pointer",
  textDecoration: "underline",
};

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
      //TODO: Change to actual backend endpoint
      const endpoint = isRegistering
        ? "/api/register"
        : "/api/login";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      navigate("/");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <h2>{isRegistering ? "Create Account" : "Login"}</h2>

      <form onSubmit={handleSubmit} style={formStyle}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        {isRegistering && (
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        )}

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : isRegistering
            ? "Create Account"
            : "Login"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p style={{ marginTop: "15px" }}>
        {isRegistering ? "Already have an account?" : "Don't have an account?"}
        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setError("");
          }}
          style={linkStyle}
        >
          {isRegistering ? "Login" : "Create one"}
        </button>
      </p>
    </div>
  );
}

