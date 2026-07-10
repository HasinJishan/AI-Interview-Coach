import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name || !email || !password) {
      setMessage("Please fill all fields");
      setIsError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage("Registered successfully! Redirecting to login...");
        setIsError(false);
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage(data.error || "Registration failed");
        setIsError(true);
      }
    } catch (err) {
      setMessage("Server not reachable. Is Flask running?");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <form
        onSubmit={handleRegister}
        className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-bold text-white mb-1 text-center">
          Create Account
        </h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          Start practicing smarter today
        </p>

        <label className="text-slate-300 text-sm mb-1 block">Full Name</label>
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        <label className="text-slate-300 text-sm mb-1 block">Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        <label className="text-slate-300 text-sm mb-1 block">Password</label>
        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        {message && (
          <p
            className={`mt-4 text-sm text-center ${
              isError ? "text-red-400" : "text-green-400"
            }`}
          >
            {message}
          </p>
        )}

        <p className="text-sm text-center text-slate-400 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;