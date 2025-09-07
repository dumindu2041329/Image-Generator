import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import MyImagesPage from './pages/MyImagesPage';
import ProfilePage from './pages/ProfilePage';
import AuthConfirmPage from './pages/AuthConfirmPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';
import { clerkPubKey } from './lib/clerk';

function App() {
  if (!clerkPubKey || clerkPubKey.includes('YOUR_CLERK_PUBLISHABLE_KEY')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Clerk Configuration Required</h1>
          <p className="text-gray-300 mb-6">
            Please add your Clerk publishable key to the .env file to enable authentication.
          </p>
          <div className="bg-gray-800 rounded-lg p-4 text-left">
            <code className="text-green-400 text-sm">
              VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider 
      publishableKey={clerkPubKey}
      routerPush={(to) => {
        // Update the URL and notify modal to switch views
        window.history.pushState(null, '', to);
        window.dispatchEvent(new CustomEvent('clerk:navigate', { detail: to }));
      }}
      routerReplace={(to) => {
        window.history.replaceState(null, '', to);
        window.dispatchEvent(new CustomEvent('clerk:navigate', { detail: to }));
      }}
    >
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            {/* Ensure auth paths render app content behind the modal */}
            <Route path="/sign-in" element={<HomePage />} />
            <Route path="/sign-up" element={<HomePage />} />
            <Route path="/factor-one" element={<HomePage />} />
            <Route path="/my-images" element={<MyImagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/auth/confirm" element={<AuthConfirmPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Routes>
          <ToastContainer />
        </Router>
      </ToastProvider>
    </ClerkProvider>
  );
}

export default App;
