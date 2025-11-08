import { BrowserRouter } from "react-router";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { ForumProvider } from "./context/ForumContext";

function App() {
  return (
    <AuthProvider>
      <ForumProvider>
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
      </ForumProvider>
    </AuthProvider>
  );
}

export default App;
