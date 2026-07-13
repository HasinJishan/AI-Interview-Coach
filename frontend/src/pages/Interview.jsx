import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Interview() {
  const [step, setStep] = useState("setup");
  const [type, setType] = useState("HR");
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleStart = async (e) => {
    e.preventDefault();
    if (!category.trim()) {
      setError("Please enter a role/category");
      return;
    }
    setError("");
    setStep("loading");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, category }),
      });
      const data = await res.json();

      if (res.ok) {
        setQuestions(data.questions);
        setAnswers(new Array(data.questions.length).fill(""));
        setStep("questions");
      } else {
        setError(data.error || "Failed to generate questions");
        setStep("setup");
      }
    } catch (err) {
      setError("Server not reachable. Please try again.");
      setStep("setup");
    }
  };

  const submitForFeedback = async (finalAnswers) => {
    setStep("submitting");
    const qa_pairs = questions.map((q, i) => ({
      question: q,
      answer: finalAnswers[i] || "(No answer provided)",
    }));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/submit-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          category,
          qa_pairs,
          email: localStorage.getItem("userEmail"),
        }),
      });
      const data = await res.json();

      if (res.ok) {
        navigate("/results", { state: { result: data, qa_pairs } });
      } else {
        setError(data.error || "Failed to get feedback");
        setStep("questions");
      }
    } catch (err) {
      setError("Server not reachable. Please try again.");
      setStep("questions");
    }
  };

  const handleNext = () => {
    const updated = [...answers];
    updated[currentIndex] = currentAnswer;
    setAnswers(updated);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentAnswer(updated[currentIndex + 1] || "");
    } else {
      submitForFeedback(updated);
    }
  };

  const handlePrev = () => {
    const updated = [...answers];
    updated[currentIndex] = currentAnswer;
    setAnswers(updated);

    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setCurrentAnswer(updated[currentIndex - 1] || "");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      {step === "setup" && (
        <form
          onSubmit={handleStart}
          className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-10 rounded-2xl shadow-2xl w-full max-w-md"
        >
          <h1 className="text-3xl font-bold text-white mb-1 text-center">Mock Interview</h1>
          <p className="text-slate-400 text-center mb-8 text-sm">Choose your interview type to begin</p>

          <label className="text-slate-300 text-sm mb-1 block">Interview Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="HR" className="bg-slate-800">HR</option>
            <option value="Technical" className="bg-slate-800">Technical</option>
          </select>

          <label className="text-slate-300 text-sm mb-1 block">Role / Category</label>
          <input
            type="text"
            placeholder="e.g. Software Engineer, Data Analyst"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200"
          >
            Generate Questions
          </button>

          {error && <p className="mt-4 text-sm text-center text-red-400">{error}</p>}
        </form>
      )}

      {step === "loading" && (
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Generating your interview questions...</p>
        </div>
      )}

      {step === "submitting" && (
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Analyzing your answers with AI...</p>
          <p className="text-slate-400 text-sm mt-2">This may take a few seconds</p>
        </div>
      )}

      {step === "questions" && questions.length > 0 && (
        <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/10 p-10 rounded-2xl shadow-2xl w-full max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <span className="text-indigo-400 text-sm font-medium">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= currentIndex ? "bg-indigo-400" : "bg-white/20"}`}></div>
              ))}
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white mb-6 leading-relaxed">{questions[currentIndex]}</h2>

          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            rows={6}
            className="w-full bg-white/5 border border-white/10 text-white placeholder-slate-500 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          {error && <p className="mb-4 text-sm text-center text-red-400">{error}</p>}

          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="bg-white/10 text-white px-6 py-2.5 rounded-xl font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/20 transition"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition"
            >
              {currentIndex === questions.length - 1 ? "Finish & Get Feedback" : "Next"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Interview;