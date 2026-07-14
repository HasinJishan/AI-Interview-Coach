import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [step, setStep] = useState("upload"); // upload | analyzing | results
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type !== "application/pdf") {
      setError("Please upload a PDF file");
      setFile(null);
      return;
    }
    setError("");
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file first");
      return;
    }
    setError("");
    setStep("analyzing");

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("email", localStorage.getItem("userEmail"));

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload-resume`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setStep("results");
      } else {
        setError(data.error || "Failed to analyze resume");
        setStep("upload");
      }
    } catch (err) {
      setError("Server not reachable. Please try again.");
      setStep("upload");
    }
  };

  const scoreColor =
    result?.ats_score >= 75 ? "from-emerald-500 to-teal-500" :
    result?.ats_score >= 50 ? "from-yellow-500 to-orange-500" :
    "from-red-500 to-pink-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden py-12 px-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {step === "upload" && (
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-10 shadow-2xl">
            <h1 className="text-3xl font-bold text-white mb-1 text-center">
              Resume Analysis
            </h1>
            <p className="text-slate-400 text-center mb-8 text-sm">
              Upload your resume (PDF) to get AI-powered feedback
            </p>

            <label
              htmlFor="resume-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 rounded-xl py-12 px-6 cursor-pointer hover:border-indigo-400/50 hover:bg-white/5 transition"
            >
              <svg className="w-12 h-12 text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-slate-300 font-medium mb-1">
                {file ? file.name : "Click to select a PDF"}
              </p>
              <p className="text-slate-500 text-sm">PDF only, max 10MB</p>
              <input
                id="resume-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {error && <p className="mt-4 text-sm text-center text-red-400">{error}</p>}

            <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all duration-200 disabled:opacity-40 disabled:hover:scale-100"
            >
              Analyze Resume
            </button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-lg">Analyzing your resume with AI...</p>
            <p className="text-slate-400 text-sm mt-2">This may take a few seconds</p>
          </div>
        )}

        {step === "results" && result && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Resume Analysis</h1>
              <p className="text-slate-400">{result.summary}</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-6 text-center">
              <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${scoreColor} mb-4`}>
                <span className="text-4xl font-bold text-white">{result.ats_score}</span>
              </div>
              <p className="text-slate-300">ATS Score out of 100</p>
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
                <h3 className="text-orange-400 font-semibold mb-3">Missing / Weak Areas</h3>
                <ul className="space-y-2">
                  {result.missing_skills?.map((s, i) => (
                    <li key={i} className="text-slate-300 text-sm flex gap-2">
                      <span className="text-orange-400">!</span> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-8">
              <h3 className="text-white font-semibold mb-4">Suggested Improvements</h3>
              <div className="space-y-4">
                {result.improvements?.map((imp, i) => (
                  <div key={i} className="border-b border-white/10 pb-4 last:border-0">
                    <p className="text-indigo-400 text-sm font-medium mb-1">{imp.area}</p>
                    <p className="text-slate-300 text-sm">{imp.suggestion}</p>
                  </div>
                ))}
              </div>
              {result.grammar_issues > 0 && (
                <p className="text-slate-400 text-sm mt-4 pt-4 border-t border-white/10">
                  ~{result.grammar_issues} potential grammar/spelling issues detected
                </p>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => { setStep("upload"); setFile(null); setResult(null); }}
                className="bg-white/10 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-white/20 transition"
              >
                Upload Another
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResumeUpload;