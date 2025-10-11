import { Routes, Route } from "react-router";
import Home from "../pages/Home";
import About from "../pages/About";
import Services from "../pages/Services";
import Forum from "../pages/Forum";
import Contact from "../pages/Contact";
import Profile from "../pages/Profile";
import Education from "../pages/Education";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/education" element={<Education />} />
    </Routes>
  );
}
