import { Routes, Route } from "react-router";
import Home from "../pages/Home";
import About from "../pages/About";
import Services from "../pages/Services";
import Forum from "../pages/Forum";
import Contact from "../pages/Contact";
import Education from "../pages/Education";

import MemberProfile from "../pages/MemberProfile";
import PTProfile from "../pages/PTProfile";
import MemberDashboard from "../pages/member/MemberDashboard";
import PTDashboard from "../pages/pt/PTDashboard";
import MemberProfileSettings from "../pages/member/MemberProfileSettings";
import PTProfileSettings from "../pages/pt/PTProfileSettings";
import CreatePost from "../pages/CreatePost";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/forum/create" element={<CreatePost />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/education" element={<Education />} />

      {/* Dynamic Public Profile Routes */}
      <Route path="/profile/pt/:id" element={<PTProfile />} />
      <Route path="/profile/member/:id" element={<MemberProfile />} />

      {/* Protected Routes - To be implemented with authentication */ }
      <Route path="/dashboard/pt/:id" element={<PTDashboard/>} />
      <Route path="/dashboard/member/:id" element={<MemberDashboard  />} />

      {/* Profile Settings Routes */}
      <Route path="/settings/pt/:id" element={<PTProfileSettings />} />
      <Route path="/settings/member/:id" element={<MemberProfileSettings  />} />
    </Routes>
  );
}
