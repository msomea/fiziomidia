import { useState } from "react";
import { Link, NavLink } from "react-router";
import { Menu, X } from "lucide-react";
import logo from "../assets/fm-bg.svg";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Services", path: "/services" },
    { name: "Forum", path: "/forum" },
    { name: "Education", path: "/education" },
    { name: "Contact", path: "/contact" },
  ];

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
          <Link
            to="/profile"
            className="btn btn-sm bg-caribbean text-white border-none hover:bg-tufts"
          >
            My Profile
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-black"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg border-t border-gray-200">
          <ul className="flex flex-col items-center py-3 space-y-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `font-medium ${
                    isActive ? "text-caribbean" : "text-black hover:text-tufts"
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
            <Link
              to="/profile"
              className="btn btn-sm bg-caribbean text-white border-none hover:bg-tufts"
              onClick={() => setMenuOpen(false)}
            >
              My Profile
            </Link>
          </ul>
        </div>
      )}
    </nav>
  );
}
