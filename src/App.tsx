import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { FloatingNav } from "./components/FloatingNav";
import Inventaire from "./pages/Inventaire";
import Sac from "./pages/Sac";
import CheckPoint from "./pages/CheckPoint";
import Bivouac from "./pages/Bivouac";
import Radar from "./pages/Radar";
import Auth from "./pages/Auth";
import SharePack from "./pages/SharePack";
import { useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";

function App() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--color-primary)] w-10 h-10" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen relative flex flex-col">
        <Routes>
          <Route path="/share/:id" element={<SharePack />} />
          <Route path="*" element={
            !session ? <Auth /> : (
              <>
                <FloatingNav />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Inventaire />} />
                    <Route path="/sac" element={<Sac />} />
                    <Route path="/checkpoint" element={<CheckPoint />} />
                    <Route path="/bivouac" element={<Bivouac />} />
                    <Route path="/radar" element={<Radar />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </>
            )
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
