import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import { AnimatePresence } from "framer-motion";
import { AnimatedPage } from "./components/AnimatedPage";

function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Inventaire /></AnimatedPage>} />
        <Route path="/sac" element={<AnimatedPage><Sac /></AnimatedPage>} />
        <Route path="/checkpoint" element={<AnimatedPage><CheckPoint /></AnimatedPage>} />
        <Route path="/bivouac" element={<AnimatedPage><Bivouac /></AnimatedPage>} />
        <Route path="/radar" element={<AnimatedPage><Radar /></AnimatedPage>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

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
                <main className="flex-1 overflow-x-hidden">
                  <AnimatedRoutes />
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
