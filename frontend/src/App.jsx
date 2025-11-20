import { BrowserRouter } from "react-router"; 
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ForumProvider } from "./context/ForumContext";
import { setLogoutHandler } from "./api/axios";
import { useEffect } from "react";

function AppContent() {
  const { logout } = useAuth();

  useEffect(() => {
    setLogoutHandler(() => logout());
  }, [logout]);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-alice">
        <Navbar />
        <main className="flex-grow">
          <AppRoutes />
        </main>
        <Footer />
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <ForumProvider>
        <AppContent />
      </ForumProvider>
    </AuthProvider>
  );
}

export default App;
