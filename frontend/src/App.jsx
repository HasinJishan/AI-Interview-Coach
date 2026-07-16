import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Interview from "./pages/Interview";
import Results from "./pages/Results";
import ResumeUpload from "./pages/ResumeUpload";
import CodingPractice from "./pages/CodingPractice";
import History from "./pages/History";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <Interview />
            </ProtectedRoute>
          }
        />
        <Route
  path="/results"
  element={
    <ProtectedRoute>
      <Results />
    </ProtectedRoute>
  }
/>
<Route
  path="/resume"
  element={
    <ProtectedRoute>
      <ResumeUpload />
    </ProtectedRoute>
  }
/>
<Route
  path="/coding-practice"
  element={
    <ProtectedRoute>
      <CodingPractice />
    </ProtectedRoute>
  }
/>
<Route
  path="/history"
  element={
    <ProtectedRoute>
      <History />
    </ProtectedRoute>
  }
/>
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>
      </Routes>
    </Router>

  );
}

export default App;