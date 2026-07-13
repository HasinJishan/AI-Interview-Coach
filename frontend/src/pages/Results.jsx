import { useLocation, useNavigate } from "react-router-dom";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, qa_pairs } = location.state || {};

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">No results found.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const scoreColor =
    result.overall_score >= 75 ? "from-emerald-500 to-teal-500" :
    result.overall_score >= 50 ? "from-yellow-500 to-orange-500" :
    "from-red-500 to-pink-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden py-12 px-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Interview Results</h1>
          <p className="text-slate-400">{result.summary}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-6 text-center">
          <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${scoreColor} mb-4`}>
            <span className="text-4xl font-bold text-white">{result.overall_score}</span>
          </div>
          <p className="text-slate-300">Overall Score out of 100</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-emerald-400 font-semibold mb-3">Strengths</h3>
            <ul className="space-y-2">
              {result.strengths?.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-emerald-400">✓</span> {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
            <h3 className="text-orange-400 font-semibold mb-3">Areas to Improve</h3>
            <ul className="space-y-2">
              {result.improvements?.map((s, i) => (
                <li key={i} className="text-slate-300 text-sm flex gap-2">
                  <span className="text-orange-400">→</span> {s}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-4">Question-by-Question Feedback</h3>
          <div className="space-y-4">
            {result.feedback?.map((f, i) => (
              <div key={i} className="border-b border-white/10 pb-4 last:border-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-slate-300 text-sm font-medium">
                    Q{f.question_number}: {qa_pairs?.[i]?.question}
                  </p>
                  <span className="text-indigo-400 text-sm font-semibold ml-4 whitespace-nowrap">
                    {f.score}/10
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{f.feedback}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate("/interview")}
            className="bg-white/10 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-white/20 transition"
          >
            Try Another Interview
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results;