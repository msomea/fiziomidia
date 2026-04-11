import { BrowserRouter, useNavigate } from "react-router"; 
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ForumProvider } from "./contexts/ForumContext";
import { HomePageProvider } from "./contexts/HomePageContext";
import { setLogoutHandler } from "./api/axios";
import { useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

function AppContent() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLogoutHandler(() => logout(navigate));
  }, [logout, navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden flex flex-col bg-alice">
      <Navbar />
      <main className="flex-grow">
        <AppRoutes />
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ForumProvider>
          <HomePageProvider>
            <AppContent />
          </HomePageProvider>
        </ForumProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
