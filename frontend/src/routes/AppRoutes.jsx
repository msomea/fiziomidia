import { Routes, Route } from "react-router";
import ProtectedRoute from "../components/ProtectedRoute";
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
import PTSubManagementPage from "../pages/pt/PTSubmanagementPage";
import EditPostPage from "../pages/forum/EditPostPage";
import CreatePostPage from "../pages/forum/CreatePostPage"
import PostDetailPage from "../pages/forum/PostDetailPage";
import UpgradeToPT from "../components/dashboard/member/UpgradeToPT";
import MessageRouterPage  from "../pages/message/MessageRouterPage";
import UsersPage from "../pages/message/UsersPage";
import AdminUserDetails from "../components/admin/AdminUserDetails";
import AdminAppointmentDetails from "../components/admin/AdminAppointmentDetails";
import AdminPromotionDetail from "../components/admin/AdminPromotionDetail";
import AdminClinicPromotionDetail from "../components/admin/AdminClinicPromotionDetail";
import AdminSponsorshipDetail from "../components/admin/AdminSubSponsorshipDetail";
import AdminProductSponsorshipDetail from "../components/admin/AdminProductSponsorshipDetail";
import AdminProfileSettings from "../pages/admin/AdminProfileSetting";
import Services from "../pages/services/Services";
import CreatePromotion from "../pages/services/CreatePromotion";
import ListPromotions from "../pages/services/ListPromotions";
import ListSponsoredProduct from "../pages/services/ListSponsoredProduct";
import CreateSponsoredProduct from "../pages/services/CreateSponsoredProduct";
import CreateClinicPromotion from "../pages/services/CreateClinicPromotion";
import ListClinicPromotions from "../pages/services/ListClinicPromotions";
import ManageClinicPromotion from "../pages/clinic/ManageClinicPromotion";
import ForumModRequestsDetail from "../components/admin/ForumModRequestsDetail";
import AdminSendEmail from "../pages/admin/AdminSendEmail";
import PTAppointmentsPage from "../pages/pt/PTAppointmentsPage";
import PTClinicAppointmentPage from "../pages/pt/PTClinicAppointmentPage";
import PTClinicAppointmentDetailPage from "../pages/pt/PTClinicAppointmentDetailPage";
import PTAppointmentDetailsPage from "../pages/pt/PTApointmentDetailsPage";
import BookAppointment from "../pages/appointment/RequestAppointment";
import MemberAppointmentsPage from "../pages/member/MemberAppointmentPage";
import MemberClinicAppointmentsPage from "../pages/member/MemberClinicAppointmentsPage";
import MemberClinicAppointmentDetailPage from "../pages/member/MemberClinicAppointmentDetailPage";
import ClinicDetails from "../pages/clinic/ClinicDetails";
import ClinicAppointmentRequest from "../pages/clinic/ClinicAppointmentRequest";
import ResourceLibrary from "../pages/education/ResourceLibrary";
import ResourceDetails from "../pages/education/ResourceDetails";
import UploadResource from "../pages/education/UploadResource";
import ResourceRequests from "../pages/education/ResourceRequests";
import ResourceNeeds from "../pages/education/ResourceNeeds";
import MyResources from "../pages/education/MyResources";
import Assistant from "../pages/assistant/Assistant";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/verify-email/:token" element={<VerifyEmail />} />

      {/* Public Pages Routes */}
      <Route path="/education/library" element={<ResourceLibrary />} />
      <Route path="/education/resources/:id" element={<ResourceDetails />} />
      <Route path="/education/upload" element={<ProtectedRoute><UploadResource /></ProtectedRoute>} />
      <Route path="/education/requests" element={<ProtectedRoute><ResourceRequests /></ProtectedRoute>} />
      <Route path="/education/needs" element={<ProtectedRoute><ResourceNeeds /></ProtectedRoute>} />
      <Route path="/education/my-uploads" element={<ProtectedRoute><MyResources /></ProtectedRoute>} />
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/forum" element={<Forum />} />
      <Route path="/forum/post/:id" element={<PostDetailPage />} />
      <Route path="/education" element={<Education />} />
      <Route path="/assistant" element={<Assistant />} />

      {/* Dynamic Public Profile Routes */}
      <Route path="/profile/pt/:id" element={<PTProfile />} />
      <Route path="/profile/member/:id" element={<MemberProfile />} />
      <Route path="/find-professionals" element={<FindProfessionals />} />

      {/* Services Routes */}
      <Route path="/services/promotions/create" element={<ProtectedRoute><CreatePromotion /></ProtectedRoute>} />
      <Route path="/services" element={<Services />} />
      <Route path="/services/promotions" element={<ListPromotions />} />
      <Route path="/services/sponsored" element={<ListSponsoredProduct />} />
      <Route path="/services/sponsored/create" element={<ProtectedRoute><CreateSponsoredProduct /></ProtectedRoute>} />
      
      {/* Clinic Promotion Routes */}
      <Route path="/services/clinic-promotions/create" element={<ProtectedRoute><CreateClinicPromotion /></ProtectedRoute>} />
      <Route path="/services/clinic-promotions" element={<ListClinicPromotions />} />
      <Route path="/clinic/promotions/manage/:promotionId" element={<ProtectedRoute><ManageClinicPromotion /></ProtectedRoute>} />

      {/* Clinic Routes */}
      <Route path="/clinic/:clinicId" element={<ClinicDetails />} />
      <Route path="/clinic/:clinicId/request-appointment" element={<ClinicAppointmentRequest />} />


      {/* Dashboard Routes */}
      <Route path="/dashboard/pt/:_id" element={<ProtectedRoute><PTDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/member/:id" element={<ProtectedRoute><MemberDashboard /></ProtectedRoute>} />
      <Route path="/upgrade-to-pt" element={<ProtectedRoute><UpgradeToPT /></ProtectedRoute>} />
      <Route path="/forum/sub/:subId/manage" element={<ProtectedRoute><PTSubManagementPage /></ProtectedRoute>} />

      {/* Forum Routes */}
      <Route path="/forum/edit/:ptId/:postId" element={<ProtectedRoute><EditPostPage /></ProtectedRoute>} />
      <Route path="/forum/create" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />

      {/* Appointment Routes */}
      <Route path="/appointments/book/:ptId" element={<ProtectedRoute><BookAppointment /></ProtectedRoute>} />
      <Route path="/pt/:id/appointments" element={<ProtectedRoute><PTAppointmentsPage /></ProtectedRoute>} />
      <Route path="/pt/clinic-appointments" element={<ProtectedRoute><PTClinicAppointmentPage /></ProtectedRoute>} />
      <Route path="/pt/clinic-appointments/:id" element={<ProtectedRoute><PTClinicAppointmentDetailPage /></ProtectedRoute>} />
      <Route path="/pt/appointments/:id" element={<ProtectedRoute><PTAppointmentDetailsPage /></ProtectedRoute>} />
      <Route path="/appointments/member/:id" element={<ProtectedRoute><MemberAppointmentsPage /></ProtectedRoute>} />
      <Route path="/member/clinic-appointments" element={<ProtectedRoute><MemberClinicAppointmentsPage /></ProtectedRoute>} />
      <Route path="/member/clinic-appointments/:id" element={<ProtectedRoute><MemberClinicAppointmentDetailPage /></ProtectedRoute>} />


      {/* Message Routes */ }      
      <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
      <Route path="/messages/user/:receiverId" element={<ProtectedRoute><MessageRouterPage /></ProtectedRoute>} />
      <Route path="/messages/:id" element={<ProtectedRoute><ConversationPage /></ProtectedRoute>} />
      <Route path="/messages/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />

      {/* Profile Settings Routes */}
      <Route path="/settings/pt/:id" element={<ProtectedRoute><PTProfileSettings /></ProtectedRoute>} />
      <Route path="/settings/member/:id" element={<ProtectedRoute><MemberProfileSettings /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/subs/:id/sponsor" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSponsorships /></ProtectedRoute>} />
      <Route path="/dashboard/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminUserDetails /></ProtectedRoute>} />
      <Route path="/admin/appointments/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminAppointmentDetails /></ProtectedRoute>} />
      <Route path="/admin/promotions/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminPromotionDetail /></ProtectedRoute>} />
      <Route path="/admin/clinic-promotions/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminClinicPromotionDetail /></ProtectedRoute>} />
      <Route path="/admin/sponsorship/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSponsorshipDetail /></ProtectedRoute>} />
      <Route path="/admin/sponsored-products/:id" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProductSponsorshipDetail /></ProtectedRoute>} />
      <Route path="/admin/forum/mod-requests/:id" element={<ProtectedRoute allowedRoles={["admin"]}><ForumModRequestsDetail /></ProtectedRoute>} />
      <Route path="/users/:id/send-email" element={<ProtectedRoute allowedRoles={["admin"]}><AdminSendEmail /></ProtectedRoute>} />
      <Route path="/settings/admin" element={<ProtectedRoute allowedRoles={["admin"]}><AdminProfileSettings /></ProtectedRoute>} />

      {/* Temp routes for debugging */}
      
      
    </Routes>
  );
}
