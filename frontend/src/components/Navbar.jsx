import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import {
  Menu,
  X,
  MessageCircle,
  LogOut,
  UserCircle,
  LayoutDashboard,
  Globe,
} from "lucide-react";
import { useTranslation } from 'react-i18next'
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
  const { t, i18n } = useTranslation()

  const isGuest = user.role === "guest";

  const getDashboardPath = () => {
    if (isGuest) return "/login"; // guests go to login
    if (user.role === "physiotherapist") return `/dashboard/pt/${user._id}`;
    if (user.role === "member" || user.role === "pendingPhysiotherapist") return `/dashboard/member/${user._id}`;
    if (user.role === "admin") return `/dashboard/admin`;
    return "/";
  };

  const navLinks = [
    { key: 'home', path: "/" },
    { key: 'about', path: "/about" },
    { key: 'forum', path: "/forum" },
    { key: 'services', path: "/services" },
    { key: 'education', path: "/education" },
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

  const [langOpen, setLangOpen] = useState(false)
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
    setLangOpen(false)
  }

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
                key={link.key}
                to={link.path}
                className={({ isActive }) =>
                  `font-medium ${
                    isActive ? "text-caribbean" : "text-black hover:text-tufts"
                  }`
                }
              >
                {t(link.key)}
              </NavLink>
            ))}

            {/* 🌍 Language Switcher - ALWAYS VISIBLE */}
            <div className="relative">
              <button
                className="flex items-center gap-2 text-black hover:text-tufts"
                onClick={() => setLangOpen(!langOpen)}
                aria-label={t("language")}
              >
                <Globe className="w-5 h-5" />
                <span className="font-medium">
                  {(i18n.language || "en").slice(0, 2).toUpperCase()}
                </span>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md w-40 border border-gray-200">
                  <button
                    onClick={() => changeLanguage("en")}
                    className="block bg-gray-100 text-black w-full text-left px-4 py-2 hover:text-tufts text-sm"
                  >
                    {t("english")} (EN)
                  </button>
                  <button
                    onClick={() => changeLanguage("sw")}
                    className="block bg-gray-100 text-black w-full text-left px-4 py-2 hover:text-tufts text-sm"
                  >
                    {t("swahili")} (SW)
                  </button>
                </div>
              )}
            </div>

            {isGuest ? (
              <Link
                to="/login"
                className="btn btn-sm bg-caribbean text-white border-none hover:bg-tufts"
              >
                {t("login")}
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
                    <span className="font-medium capitalize">
                      {user.fullName}
                    </span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md w-48 border border-gray-200">
                      <Link
                        to={getDashboardPath()}
                        className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" /> {t("dashboard")}
                      </Link>

                      <button
                        onClick={() => {
                          handleLogout();
                          setDropdownOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-gray-100 text-sm w-full text-left"
                      >
                        <LogOut className="w-4 h-4" /> {t("logout")}
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

          {/* 🌍 Language Switcher - ALWAYS FIRST */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
            <Globe className="w-5 h-5 text-black" />
            <button
              onClick={() => { changeLanguage("en"); setMenuOpen(false); }}
              className="text-black hover:text-caribbean"
            >
              EN
            </button>
            <button
              onClick={() => { changeLanguage("sw"); setMenuOpen(false); }}
              className="text-black hover:text-caribbean"
            >
              SW
            </button>
          </div>

          {navLinks.map((link) => (
            <NavLink
              key={link.key}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-3 font-medium ${
                  isActive ? "text-caribbean" : "text-black hover:text-tufts"
                }`
              }
            >
              {t(link.key)}
            </NavLink>
          ))}

          {isGuest ? (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-caribbean font-semibold hover:text-tufts"
            >
              {t("login")}
            </Link>
          ) : (
            <>
              <Link
                to="/messages"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 text-black hover:text-caribbean"
              >
                <MessageCircle className="w-5 h-5" />
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
                {t("dashboard")}
              </Link>

              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-3 text-red-600 hover:text-tufts"
              >
                {t("logout")}
              </button>
            </>
          )}
        </div>
      )}

    </nav>
  );
}
