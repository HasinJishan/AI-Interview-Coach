import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function CodingPractice() {
  const [questions, setQuestions] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Python");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/coding-questions`);
        const data = await res.json();
        setQuestions(data);
      } catch (err) {
        setError("Failed to load questions");
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchQuestions();
  }, []);

  const handleSelectQuestion = (q) => {
    setSelectedQuestion(q);
    setCode("");
    setResult(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError("Please write some code first");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/submit-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question_title: selectedQuestion.title,
          question_description: selectedQuestion.description,
          code,
          language,
          email: localStorage.getItem("userEmail"),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Failed to review code");
      }
    } catch (err) {
      setError("Server not reachable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const difficultyColor = (d) =>
    d === "Easy" ? "text-emerald-400 bg-emerald-500/10" :
    d === "Medium" ? "text-yellow-400 bg-yellow-500/10" :
    "text-red-400 bg-red-500/10";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden py-8 px-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Coding Practice</h1>
            <p className="text-slate-400 text-sm">Solve problems and get instant AI code review</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition"
          >
            Back to Dashboard
          </button>
        </div>

        {!selectedQuestion ? (
          <div className="space-y-8">
            {loading && <p className="text-slate-400 text-center">Loading questions...</p>}
            {Object.entries(questions).map(([category, qs]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold text-white mb-4">{category}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {qs.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      className="text-left bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 hover:border-indigo-400/50 hover:bg-white/10 transition"
                    >
                      <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 ${difficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                      <h3 className="text-white font-semibold mb-1">{q.title}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2">{q.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <button
              onClick={() => setSelectedQuestion(null)}
              className="text-indigo-400 text-sm font-medium mb-4 hover:text-indigo-300 transition"
            >
              ← Back to questions
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Problem panel */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 ${difficultyColor(selectedQuestion.difficulty)}`}>
                  {selectedQuestion.difficulty}
                </span>
                <h2 className="text-xl font-bold text-white mb-3">{selectedQuestion.title}</h2>
                <p className="text-slate-300 leading-relaxed">{selectedQuestion.description}</p>
              </div>

              {/* Code editor panel */}
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-slate-300 text-sm font-medium">Your Solution</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Python" className="bg-slate-800">Python</option>
                    <option value="JavaScript" className="bg-slate-800">JavaScript</option>
                    <option value="Java" className="bg-slate-800">Java</option>
                    <option value="C++" className="bg-slate-800">C++</option>
                  </select>
                </div>

                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Write your code here..."
                  rows={12}
                  className="w-full bg-slate-950/50 border border-white/10 text-slate-100 font-mono text-sm rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  spellCheck="false"
                />

                {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition disabled:opacity-50"
                >
                  {submitting ? "Reviewing your code..." : "Submit for AI Review"}
                </button>
              </div>
            </div>

            {result && (
              <div className="mt-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-semibold text-lg">AI Code Review</h3>
                  <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                    result.overall_verdict === "Correct" ? "text-emerald-400 bg-emerald-500/10" :
                    result.overall_verdict === "Partially Correct" ? "text-yellow-400 bg-yellow-500/10" :
                    "text-red-400 bg-red-500/10"
                  }`}>
                    {result.overall_verdict}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <ScoreBox label="Correctness" score={result.correctness_score} />
                  <ScoreBox label="Efficiency" score={result.efficiency_score} />
                  <ScoreBox label="Code Quality" score={result.code_quality_score} />
                </div>

                <p className="text-slate-300 text-sm mb-4">{result.feedback}</p>

                {result.suggestions?.length > 0 && (
                  <div>
                    <p className="text-indigo-400 text-sm font-medium mb-2">Suggestions</p>
                    <ul className="space-y-1">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="text-slate-400 text-sm flex gap-2">
                          <span className="text-indigo-400">→</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreBox({ label, score }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
      <div className="text-2xl font-bold text-white">{score}/10</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </div>
  );
}

export default CodingPractice;