import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Home() {
  const navigate = useNavigate();

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
    <Navbar />
    <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

    <div className="relative z-10 text-center max-w-2xl mx-auto px-4 flex flex-col items-center justify-center min-h-[85vh]">
      {/* ...rest of your existing content stays exactly the same... */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-indigo-200 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/10">
          ✨ AI-Powered Interview Preparation
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
          Ace Your Next
          <span className="block bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Interview
          </span>
        </h1>

        <p className="text-lg text-slate-300 mb-10 max-w-lg mx-auto">
          Practice HR, technical, and coding interviews with real-time AI feedback.
          Upload your resume and get instant, actionable insights.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/register")}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-3.5 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-200"
          >
            Get Started Free
          </button>
          <button
            onClick={() => navigate("/login")}
            className="bg-white/10 backdrop-blur-sm text-white px-8 py-3.5 rounded-xl font-semibold border border-white/20 hover:bg-white/20 transition-all duration-200"
          >
            Login
          </button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          {[
            { label: "Mock Interviews", value: "HR + Technical" },
            { label: "Resume Analysis", value: "AI-Powered" },
            { label: "Cost", value: "100% Free" },
          ].map((item) => (
            <div key={item.label} className="text-slate-300">
              <div className="text-white font-bold text-lg">{item.value}</div>
              <div className="text-sm text-slate-400">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;