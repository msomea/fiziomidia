import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import {
  Menu,
  X,
  MessageCircle,
  LogOut,
  UserCircle,
  LayoutDashboard,
} from "lucide-react";
import toast from "react-hot-toast";
import logo from "../assets/fm-bg.svg";
import { useAuth } from "../context/AuthContext";
import { useUnreadMessages } from "../hooks/useUnreadMessages";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useUnreadMessages();

  const isGuest = user.role === "guest";

  const getDashboardPath = () => {
    if (isGuest) return "/login"; // guests go to login
    if (user.role === "physiotherapist") return `/dashboard/pt/${user._id}`;
    if (user.role === "member" || user.role === "pendingPhysiotherapist") return `/dashboard/member/${user._id}`;
    if (user.role === "admin") return `/dashboard/admin`;
    return "/";
  };

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Forum", path: "/forum" },
    { name: "Services", path: "/services" },
    { name: "Education", path: "/education" },
  ];

  const handleLogout = async () => {
    try {
      await logout(navigate);
      toast.success("Logged out successfully!");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Try again.");
    }
  };

  // set mobile view based on 1030px breakpoint
  useEffect(() => {
    const checkMobile = () => {
      const mobile = typeof window !== "undefined" && window.innerWidth < 1030;
      setIsMobileView(mobile);
      // Close mobile menu when switching to desktop
      if (!mobile) setMenuOpen(false);
    };

    // run once
    checkMobile();

    // listen for resize
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo}
            alt="FizioMidia Logo"
            className="w-8 h-8 md:w-10 md:h-10 object-contain"
          />
          <span className="text-xl font-bold text-black">
            Fizio<span className="text-caribbean">Midia</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        {!isMobileView && (
          <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `font-medium ${
                  isActive ? "text-caribbean" : "text-black hover:text-tufts"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          {isGuest ? (
            <Link
              to="/login"
              className="btn btn-sm bg-caribbean text-white border-none hover:bg-tufts"
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                to="/messages"
                className="btn btn-ghost btn-circle hover:bg-tufts"
              >
                <div className="indicator">
                  <MessageCircle className="w-5 h-5 text-black" />
                  {unreadCount > 0 && (
                    <span className="badge badge-sm badge-primary indicator-item">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              </Link>

              <div className="relative">
                <button
                  className="flex items-center gap-2 text-black hover:text-caribbean"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <UserCircle className="w-6 h-6" />
                  <span className="font-medium capitalize">{user.fullName}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md w-48 border border-gray-200">
                    <Link
                      to={getDashboardPath()}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Dashboard
                    </Link>

                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 text-sm w-full text-left"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          </div>
        )}

        {/* Mobile Menu Toggle */}
        {isMobileView && (
          <button className="text-black" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && isMobileView && (
        <div className="bg-white shadow-lg border-t border-gray-200">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 font-medium ${
                  isActive ? "text-caribbean" : "text-black hover:text-tufts"
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}

          {isGuest ? (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-caribbean font-semibold hover:text-tufts"
            >
              Login
            </Link>
          ) : (
            <>
              <Link
                to="/messages"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-black hover:text-caribbean"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                </div>
                {unreadCount > 0 && (
                  <span className="badge badge-primary">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to={getDashboardPath()}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-black hover:text-caribbean"
              >
                Dashboard
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-red-600 hover:text-tufts"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
