import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MyImagesPage from './pages/MyImagesPage';
import ProfilePage from './pages/ProfilePage';
import AuthConfirmPage from './pages/AuthConfirmPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { ToastProvider } from './contexts/ToastContext';
import ToastContainer from './components/ToastContainer';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/my-images" element={<MyImagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/auth/confirm" element={<AuthConfirmPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
        <ToastContainer />
      </Router>
    </ToastProvider>
  );
}

export default App;
