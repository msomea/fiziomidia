import { Routes, Route } from "react-router";
import Home from "../pages/Home";
import About from "../pages/About";
import Forum from "../pages/Forum";
import Education from "../pages/Education";

import MemberProfile from "../pages/MemberProfile";
import PTProfile from "../pages/PTProfile";
import MemberDashboard from "../pages/member/MemberDashboard";
import PTDashboard from "../pages/pt/PTDashboard";
import MessagesPage from "../pages/Messages";
import ConversationPage from "../pages/Conversation";
import MemberProfileSettings from "../pages/member/MemberProfileSettings";
import PTProfileSettings from "../pages/pt/PTProfileSettings";
import CreatePost from "../pages/CreatePost";
import FindProfessionals from "../components/home/FindProfessionals";
import AdminSponsorships from "../pages/admin/AdminSponsorships";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmail from "../pages/auth/VerifyEmail"; 
import AdminDashboard from "../pages/admin/AdminDashboard";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      {/* Public Pages */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/forum/create" element={<CreatePost />} />
      <Route path="/education" element={<Education />} />

      {/* Dynamic Public Profile Routes */}
      <Route path="/profile/pt/:id" element={<PTProfile />} />
      <Route path="/profile/member/:id" element={<MemberProfile />} />
      <Route path="/find-professionals" element={<FindProfessionals />} />

      {/* Protected Routes - To be implemented with authentication */ }
      <Route path="/dashboard/pt/:id" element={<PTDashboard/>} />
      <Route path="/dashboard/member/:id" element={<MemberDashboard />} />
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:conversationId" element={<ConversationPage />} />

      {/* Profile Settings Routes */}
      <Route path="/settings/pt/:id" element={<PTProfileSettings />} />
      <Route path="/settings/member/:id" element={<MemberProfileSettings  />} />

      {/* Admin Routes */}
      <Route path="/subs/:id/sponsor" element={<AdminSponsorships />} />
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      
    </Routes>
  );
}
