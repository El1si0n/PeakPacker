import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
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

const ROUTES = ["/", "/sac", "/checkpoint", "/bivouac", "/radar"];

function AnimatedRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  const [touchEnd, setTouchEnd] = useState<{x: number, y: number} | null>(null);

  const minSwipeDistance = 40;

  const onTouchStart = (e: React.TouchEvent) => {
    if (location.pathname === '/bivouac') return;
    if ((e.target as HTMLElement).closest('.leaflet-container, [data-dnd-context], [role="dialog"], input, textarea, select')) return;
    setTouchEnd(null);
    if (e.targetTouches.length === 1) {
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (location.pathname === '/bivouac') return;
    if ((e.target as HTMLElement).closest('.leaflet-container, [data-dnd-context], [role="dialog"], input, textarea, select')) return;
    if (!touchStart) return;
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;

    if (Math.abs(distanceY) > Math.abs(distanceX)) return;

    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = ROUTES.indexOf(location.pathname);
      if (currentIndex === -1) return;

      if (isLeftSwipe && currentIndex < ROUTES.length - 1) {
        navigate(ROUTES[currentIndex + 1]);
      } else if (isRightSwipe && currentIndex > 0) {
        navigate(ROUTES[currentIndex - 1]);
      }
    }
  };
  
  return (
    <div 
      className="flex-1 h-full w-full flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEndEvent}
    >
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
    </div>
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
