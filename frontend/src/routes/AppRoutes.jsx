import { Routes, Route } from "react-router";
import Home from "../pages/Home";
import About from "../pages/About";
import Forum from "../pages/forum/Forum";
import Education from "../pages/Education";
import MemberProfile from "../pages/MemberProfile";
import PTProfile from "../pages/PTProfile";
import MemberDashboard from "../pages/member/MemberDashboard";
import PTDashboard from "../pages/pt/PTDashboard";
import MessagesPage from "../pages/message/Messages";
import ConversationPage from "../pages/message/Conversation";
import MemberProfileSettings from "../pages/member/MemberProfileSettings";
import PTProfileSettings from "../pages/pt/PTProfileSettings";
import FindProfessionals from "../components/home/FindProfessionals";
import AdminSponsorships from "../pages/admin/AdminSponsorships";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import VerifyEmail from "../pages/auth/VerifyEmail"; 
import AdminDashboard from "../pages/admin/AdminDashboard";
import PTForumPage from "../pages/pt/PTForumPage";
import EditPostPage from "../pages/forum/EditPostPage";
import CreatePostPage from "../pages/forum/CreatePostPage"
import PostDetailPage from "../pages/forum/PostDetailPage";
import UpgradeToPT from "../components/dashboard/member/UpgradeToPT";
import MessageRouterPage  from "../pages/message/MessageRouterPage";
import AdminUserDetails from "../components/admin/AdminUserDetails";
import AdminAppointmentDetails from "../components/admin/AdminAppointmentDetails";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Public Pages Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/forum/post/:id" element={<PostDetailPage />} />
      <Route path="/education" element={<Education />} />

      {/* Dynamic Public Profile Routes */}
      <Route path="/profile/pt/:id" element={<PTProfile />} />
      <Route path="/profile/member/:id" element={<MemberProfile />} />
      <Route path="/find-professionals" element={<FindProfessionals />} />

      {/* Dashboard Routes */}
      <Route path="/dashboard/pt/:_id" element={<PTDashboard />} />
      <Route path="/dashboard/member/:id" element={<MemberDashboard />} />
      <Route path="/upgrade-to-pt" element={<UpgradeToPT />} />

      {/* Forum Routes */}
      <Route path="/forum/pt/posts/:id" element={<PTForumPage />} />
      <Route path="/forum/edit/:ptId/:postId" element={<EditPostPage />} />
      <Route path="/forum/create" element={<CreatePostPage />} />

      {/* Message Routes */ }      
      <Route path="/messages" element={<MessagesPage />} />
      <Route path="/messages/:id" element={<ConversationPage />} />
      <Route path="/messages/user/:receiverId" element={<MessageRouterPage />} />

      {/* Profile Settings Routes */}
      <Route path="/settings/pt/:id" element={<PTProfileSettings />} />
      <Route path="/settings/member/:id" element={<MemberProfileSettings  />} />

      {/* Admin Routes */}
      <Route path="/subs/:id/sponsor" element={<AdminSponsorships />} />
      <Route path="/dashboard/admin" element={<AdminDashboard />} />
      <Route path="/admin/users/:id" element={<AdminUserDetails />} />
      <Route path="/admin/appointments/:id" element={<AdminAppointmentDetails />} />

      {/* Temp routes for debuging */}
      
      
    </Routes>
  );
}
