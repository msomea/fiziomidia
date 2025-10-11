import { useState } from "react";
import { Menu, X, Home, Calendar, Users, FileText, Megaphone, Settings } from "lucide-react";
import { Link, useLocation } from "react-router";
import avatar from "../../assets/avatar.jpg";

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(!open);
  const { pathname } = useLocation();

  const navItems = [
    { name: "Appointments", icon: Calendar, path: "/appointments" },
    { name: "Patients", icon: Users, path: "/patients" },
    { name: "Forum", icon: FileText, path: "/forum" },
    { name: "Promotion", icon: Megaphone, path: "/promotion" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <>
      {/* Toggle Button (Mobile) */}
      <button
        onClick={toggle}
        className="md:hidden fixed top-4 left-4 z-50 bg-caribbean text-white p-2 rounded-md shadow"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-full w-64 bg-white shadow-lg transition-transform duration-300 z-40 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-caribbean">FizioMidia</h2>
        </div>

        <div className="p-4">
          <div className="flex flex-col items-center mb-6">
            <img
              src={avatar}
              alt="PT Avatar"
              className="w-16 h-16 rounded-full mb-2"
            />
            <h3 className="font-semibold">Dr. John Mwita</h3>
            <p className="text-sm text-gray-500">Physiotherapist</p>
          </div>

          <ul className="space-y-2">
            {navItems.map(({ name, icon: Icon, path }) => (
              <li key={name}>
                <Link
                  to={path}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors ${
                    pathname === path
                      ? "bg-caribbean text-white"
                      : "hover:bg-alice hover:text-black"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
