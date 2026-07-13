import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Dashboard() {
  const navigate = useNavigate();
  const userName = localStorage.getItem("userName") || "User";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            AI
          </div>
          <span className="text-white font-semibold text-lg">
            Interview<span className="text-indigo-400">Coach</span>
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-white/10 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-lg border border-white/20 hover:bg-red-500/20 hover:border-red-400/40 transition"
        >
          Logout
        </button>
      </div>

      <div className="relative z-10 px-6 sm:px-12 py-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-1">
          Welcome back, {userName} 👋
        </h1>
        <p className="text-slate-400 mb-10">
          Here's your interview prep overview
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard label="Resume Score" value="—" hint="Upload your resume" color="from-indigo-500 to-blue-500" />
          <StatCard label="Interview Score" value="—" hint="Take your first mock interview" color="from-purple-500 to-pink-500" />
          <StatCard label="Interviews Taken" value="0" hint="Get started below" color="from-teal-500 to-emerald-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ActionCard
            title="Start Mock Interview"
            description="Practice HR or technical questions with AI feedback"
            buttonText="Start Interview"
            onClick={() => navigate("/interview")}
          />
          <ActionCard
            title="Upload Resume"
            description="Get AI-powered suggestions to improve your resume"
            buttonText="Upload Now"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, hint, color }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} mb-4`}></div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-slate-300 text-sm font-medium">{label}</div>
      <div className="text-slate-500 text-xs mt-1">{hint}</div>
    </div>
  );
}

function ActionCard({ title, description, buttonText, onClick }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
      <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
      <p className="text-slate-400 text-sm mb-5">{description}</p>
      <button
        onClick={onClick}
        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition"
      >
        {buttonText}
      </button>
    </div>
  );
}

export default Dashboard;