import { Backpack, Box, CheckSquare, Map, Radar, User } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { UserMenu } from "./UserMenu";

export function FloatingNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isUserPageActive = location.pathname === "/mon-espace";

  const handleUserMenuClick = () => {
    if (window.innerWidth < 768) {
      navigate("/mon-espace");
    } else {
      setIsMenuOpen(true);
    }
  };

  const navItems = [
    { name: "Inventaire", path: "/", icon: <Box size={24} /> },
    { name: "Sac", path: "/sac", icon: <Backpack size={24} /> },
    { name: "Check-list", path: "/checkpoint", icon: <CheckSquare size={24} /> },
    { name: "Bivouac", path: "/bivouac", icon: <Map size={24} /> },
    { name: "Achats", path: "/radar", icon: <Radar size={24} /> },
  ];

  return (
    <>
    <nav className="fixed z-50 left-1/2 -translate-x-1/2 bottom-6 md:bottom-auto md:top-6 flex items-center gap-3 print:hidden">
      <div className="flex items-center gap-1 p-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-color)]/70 backdrop-blur-md shadow-lg transition-all duration-300">
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `group relative p-3 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20"
                    : "text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--surface-color)]"
                }`
              }
              title={item.name}
            >
              {({ isActive }) => (
                <>
                  {/* Icône */}
                  <span className="relative z-10 flex-shrink-0">
                    {item.icon}
                  </span>

                  {/* Texte animé (visible sur PC uniquement) */}
                  <span
                    className={`hidden md:block overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-medium text-sm ${
                      isActive
                        ? "max-w-[200px] opacity-100 ml-2 mr-1"
                        : "max-w-0 opacity-0 mx-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 group-hover:mr-1"
                    }`}
                  >
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex items-center p-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-color)]/70 backdrop-blur-md shadow-lg transition-all duration-300">
        <button 
          onClick={handleUserMenuClick}
          className={`group relative p-3 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
            (isMenuOpen || isUserPageActive)
              ? "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20"
              : "text-[var(--text-muted)] hover:text-[var(--text-color)] hover:bg-[var(--surface-color)]"
          }`}
          title="Mon Espace"
        >
          <span className="relative z-10 flex-shrink-0">
            <User size={24} />
          </span>
          <span
            className={`hidden md:block overflow-hidden whitespace-nowrap transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-medium text-sm ${
              (isMenuOpen || isUserPageActive)
                ? "max-w-[200px] opacity-100 ml-2 mr-1"
                : "max-w-0 opacity-0 mx-0 group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-2 group-hover:mr-1"
            }`}
          >
            Mon Espace
          </span>
        </button>
      </div>
    </nav>
    <UserMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
