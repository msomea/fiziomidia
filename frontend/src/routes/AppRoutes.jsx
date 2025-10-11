import { Routes, Route } from "react-router";
import Home from "../pages/Home";
import About from "../pages/About";
import Services from "../pages/Services";
import Forum from "../pages/Forum";
import Contact from "../pages/Contact";
import PTProfile from "../pages/PTProfile";
import MemberProfile from "../pages/MemberProfile";
import Education from "../pages/Education";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/education" element={<Education />} />

      {/* Dynamic Profile Routes */}
      <Route path="/profile/pt/:id" element={<PTProfile />} />
      <Route path="/profile/member/:id" element={<MemberProfile />} />
    </Routes>
  );
}
