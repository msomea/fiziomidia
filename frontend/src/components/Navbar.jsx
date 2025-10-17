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
import API from "../api/axios";
import logo from "../assets/fm-bg.svg";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // ✅ Load current user using accessToken
  const loadCurrentUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.warn("User not authenticated:", err.response?.status);
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) loadCurrentUser();
  }, []);

  // ✅ Logout
  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      setUser(null);
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error("Logout failed. Try again.");
    }
  };

  // ✅ Navbar links
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Forum", path: "/forum" },
    { name: "Education", path: "/education" },
  ];

  // ✅ Determine dashboard path based on user role
  const getDashboardPath = () => {
    if (!user) return "/login";
    if (user.role === "physiotherapist") return `/dashboard/pt/${user._id}`;
    if (user.role === "member") return `/dashboard/member/${user._id}`;
    if (user.role === "admin") return `/dashboard/admin`;
    return "/";
  };

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center py-3">
        {/* ✅ Logo */}
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

        {/* ✅ Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
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

          {/* ✅ When user logged in */}
          {user ? (
            <>
              {/* Messages */}
              <Link
                to="/messages"
                className="btn btn-ghost btn-circle hover:bg-tufts"
              >
                <div className="indicator">
                  <MessageCircle className="w-5 h-5 text-black" />
                  <span className="badge badge-sm badge-primary indicator-item">
                    3
                  </span>
                </div>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  className="flex items-center gap-2 text-black hover:text-caribbean"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <UserCircle className="w-6 h-6" />
                  <span className="font-medium capitalize">
                    {user.name || user.fullName || "User"}
                  </span>
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
          ) : (
            // ✅ When not logged in
            <Link
              to="/login"
              className="btn btn-sm bg-caribbean text-white border-none hover:bg-tufts"
            >
              Login
            </Link>
          )}
        </div>

        {/* ✅ Mobile Menu Button */}
        <button
          className="md:hidden text-black"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* ✅ Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg border-t border-gray-200">
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

          {user ? (
            <>
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
          ) : (
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-caribbean font-semibold hover:text-tufts"
            >
              Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
