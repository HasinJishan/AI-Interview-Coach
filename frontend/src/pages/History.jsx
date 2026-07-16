import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function History() {
  const [activeTab, setActiveTab] = useState("interviews");
  const [data, setData] = useState({ interviews: [], resumes: [], coding: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/history`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: localStorage.getItem("userEmail") }),
        });
        const result = await res.json();
        if (res.ok) setData(result);
      } catch (err) {
        console.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const tabs = [
    { key: "interviews", label: "Interviews", count: data.interviews.length },
    { key: "resumes", label: "Resumes", count: data.resumes.length },
    { key: "coding", label: "Coding", count: data.coding.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden py-8 px-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">History</h1>
            <p className="text-slate-400 text-sm">All your past activity in one place</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition"
          >
            Back to Dashboard
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-white/10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? "border-indigo-400 text-white"
                  : "border-transparent text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {loading && <p className="text-slate-400 text-center py-10">Loading history...</p>}

        {!loading && activeTab === "interviews" && (
          data.interviews.length === 0 ? (
            <EmptyState text="No interviews taken yet" />
          ) : (
            <div className="space-y-3">
              {data.interviews.map((item) => (
                <div key={item._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{item.type} — {item.category}</p>
                    <p className="text-slate-400 text-sm mt-1">{item.summary}</p>
                    <p className="text-slate-500 text-xs mt-2">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="text-2xl font-bold text-indigo-400 ml-4 whitespace-nowrap">
                    {item.overall_score}/100
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!loading && activeTab === "resumes" && (
          data.resumes.length === 0 ? (
            <EmptyState text="No resumes uploaded yet" />
          ) : (
            <div className="space-y-3">
              {data.resumes.map((item) => (
                <div key={item._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{item.filename}</p>
                    <p className="text-slate-400 text-sm mt-1">{item.summary}</p>
                    <p className="text-slate-500 text-xs mt-2">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="text-2xl font-bold text-indigo-400 ml-4 whitespace-nowrap">
                    {item.ats_score}/100
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {!loading && activeTab === "coding" && (
          data.coding.length === 0 ? (
            <EmptyState text="No coding problems solved yet" />
          ) : (
            <div className="space-y-3">
              {data.coding.map((item) => (
                <div key={item._id} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{item.question_title}</p>
                    <p className="text-slate-400 text-sm mt-1">{item.language}</p>
                    <p className="text-slate-500 text-xs mt-2">{formatDate(item.created_at)}</p>
                  </div>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ml-4 whitespace-nowrap ${
                    item.overall_verdict === "Correct" ? "text-emerald-400 bg-emerald-500/10" :
                    item.overall_verdict === "Partially Correct" ? "text-yellow-400 bg-yellow-500/10" :
                    "text-red-400 bg-red-500/10"
                  }`}>
                    {item.overall_verdict}
                  </span>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16">
      <p className="text-slate-400">{text}</p>
    </div>
  );
}

export default History;