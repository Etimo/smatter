import { Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AuthWrapper from "./auth-wrapper";
import { Navbar } from "./components/navbar";
import { Toaster } from "./components/ui/toaster";
import FeedPage from "./pages/private/feed";
import ProfilePage from "./pages/private/profile";
import Login from "./pages/public/login";
import Register from "./pages/public/register";
import { useUserStore } from "./stores/user-store";

const App = () => {
  const PrivateLayout = () => {
    return (
      <AuthWrapper>
        <div className="min-h-full">
          <Navbar />
          <main className="-mt-32">
            <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
              <div className="rounded-lg bg-white py-6 shadow sm:px-6">
                <Routes>
                  <Route index element={<Navigate to="/feed" />} />
                  <Route path="feed" element={<FeedPage />} />
                  <Route path="profile/:userId" element={<ProfilePage />} />
                  <Route path="*" element={<>Not found!</>} />
                </Routes>
              </div>
            </div>
          </main>
          <Toaster />
        </div>
      </AuthWrapper>
    );
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private routes */}
        <Route path="/*" element={<PrivateLayout />} />
      </Routes>
    </Suspense>
  );
};

export default App;
