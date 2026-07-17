import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Admin() {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const adminEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [analyticsRes, usersRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/admin/analytics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_email: adminEmail }),
          }),
          fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin_email: adminEmail }),
          }),
        ]);

        if (analyticsRes.status === 403 || usersRes.status === 403) {
          setError("You don't have admin access");
          setLoading(false);
          return;
        }

        const analyticsData = await analyticsRes.json();
        const usersData = await usersRes.json();

        setAnalytics(analyticsData);
        setUsers(usersData.users || []);
      } catch (err) {
        setError("Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [adminEmail]);

  const handleDeleteUser = async (targetEmail) => {
    if (!window.confirm(`Delete user ${targetEmail}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_email: adminEmail, target_email: targetEmail }),
      });
      if (res.ok) {
        setUsers(users.filter((u) => u.email !== targetEmail));
      }
    } catch (err) {
      alert("Failed to delete user");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <p className="text-slate-400">Loading admin panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden py-8 px-4">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
            <p className="text-slate-400 text-sm">Platform overview and user management</p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/20 transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-10">
          <AnalyticsCard label="Total Users" value={analytics?.total_users ?? 0} color="from-indigo-500 to-blue-500" />
          <AnalyticsCard label="Interviews" value={analytics?.total_interviews ?? 0} color="from-purple-500 to-pink-500" />
          <AnalyticsCard label="Resumes" value={analytics?.total_resumes ?? 0} color="from-teal-500 to-emerald-500" />
          <AnalyticsCard label="Code Reviews" value={analytics?.total_coding ?? 0} color="from-orange-500 to-red-500" />
          <AnalyticsCard label="Avg Score" value={analytics?.avg_interview_score ?? 0} color="from-yellow-500 to-amber-500" />
        </div>

        {/* Users Table */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-4">All Users ({users.length})</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 text-sm">
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Joined</th>
                  <th className="pb-3 pr-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-b border-white/5 text-sm">
                    <td className="py-3 pr-4 text-white">{u.name}</td>
                    <td className="py-3 pr-4 text-slate-300">{u.email}</td>
                    <td className="py-3 pr-4 text-slate-400">{formatDate(u.created_at)}</td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => handleDeleteUser(u.email)}
                        className="text-red-400 hover:text-red-300 text-xs font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsCard({ label, value, color }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} mx-auto mb-2`}></div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-xs mt-1">{label}</div>
    </div>
  );
}

export default Admin;