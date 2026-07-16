import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const [overview, setOverview] = useState(null);
  const [name, setName] = useState(localStorage.getItem("userName") || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/profile-overview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail }),
        });
        const data = await res.json();
        if (res.ok) setOverview(data);
      } catch (err) {
        console.error("Failed to load profile overview");
      } finally {
        setPageLoading(false);
      }
    };
    fetchOverview();
  }, [userEmail]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/update-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, name }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("userName", name);
        setMessage("Profile updated successfully!");
        setIsError(false);
      } else {
        setMessage(data.error || "Failed to update profile");
        setIsError(true);
      }
    } catch (err) {
      setMessage("Server not reachable. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!currentPassword || !newPassword) {
      setMessage("Please fill both password fields");
      setIsError(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password changed successfully!");
        setIsError(false);
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setMessage(data.error || "Failed to change password");
        setIsError(true);
      }
    } catch (err) {
      setMessage("Server not reachable. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage("Please enter your password to confirm deletion");
      setIsError(true);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/delete-account`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, password: deletePassword }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.clear();
        navigate("/");
      } else {
        setMessage(data.error || "Failed to delete account");
        setIsError(true);
        setLoading(false);
      }
    } catch (err) {
      setMessage("Server not reachable. Please try again.");
      setIsError(true);
      setLoading(false);
    }
  };

  const initial = (overview?.name || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden py-8 px-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Profile Settings</h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition"
          >
            Back to Dashboard
          </button>
        </div>

        {message && (
          <p className={`mb-4 text-sm text-center py-2 rounded-lg ${
            isError ? "text-red-400 bg-red-500/10" : "text-green-400 bg-green-500/10"
          }`}>
            {message}
          </p>
        )}

        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initial}
          </div>
          <div>
            <h2 className="text-white font-semibold text-xl">{overview?.name || "..."}</h2>
            <p className="text-slate-400 text-sm">{overview?.email}</p>
            <p className="text-slate-500 text-xs mt-1">
              Member since {pageLoading ? "..." : formatDate(overview?.member_since)}
            </p>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{pageLoading ? "..." : overview?.total_interviews ?? 0}</div>
            <div className="text-slate-400 text-xs mt-1">Interviews</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{pageLoading ? "..." : overview?.total_resumes ?? 0}</div>
            <div className="text-slate-400 text-xs mt-1">Resumes</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{pageLoading ? "..." : overview?.total_coding ?? 0}</div>
            <div className="text-slate-400 text-xs mt-1">Code Reviews</div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold text-lg mb-4">Personal Information</h2>
          <form onSubmit={handleUpdateName}>
            <label className="text-slate-300 text-sm mb-1 block">Email</label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full bg-white/5 border border-white/10 text-slate-500 rounded-xl px-4 py-3 mb-4 cursor-not-allowed"
            />
            <label className="text-slate-300 text-sm mb-1 block">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition disabled:opacity-50"
            >
              Save Changes
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold text-lg mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword}>
            <label className="text-slate-300 text-sm mb-1 block">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label className="text-slate-300 text-sm mb-1 block">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/30 transition disabled:opacity-50"
            >
              Change Password
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-500/5 backdrop-blur-md border border-red-500/20 rounded-2xl p-6">
          <h2 className="text-red-400 font-semibold text-lg mb-2">Danger Zone</h2>
          <p className="text-slate-400 text-sm mb-4">
            Deleting your account will permanently remove all your interviews, resumes, and coding history. This cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-500/10 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-xl font-medium hover:bg-red-500/20 transition"
            >
              Delete My Account
            </button>
          ) : (
            <div>
              <label className="text-slate-300 text-sm mb-1 block">Enter your password to confirm</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full bg-white/5 border border-red-500/30 text-white rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50"
                >
                  {loading ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); }}
                  className="bg-white/10 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-white/20 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;