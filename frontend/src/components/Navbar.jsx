import { useNavigate, Link } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  return (
    <nav className="relative z-20 flex items-center justify-between px-6 sm:px-12 py-5">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          AI
        </div>
        <span className="text-white font-semibold text-lg">
          Interview<span className="text-indigo-400">Coach</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/login")}
          className="text-slate-300 hover:text-white text-sm font-medium px-4 py-2 transition"
        >
          Login
        </button>
        <button
          onClick={() => navigate("/register")}
          className="bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition"
        >
          Sign Up
        </button>
      </div>
    </nav>
  );
}

export default Navbar;