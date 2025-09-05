import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MyImagesPage from './pages/MyImagesPage';
import ProfilePage from './pages/ProfilePage';
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
        </Routes>
        <ToastContainer />
      </Router>
    </ToastProvider>
  );
}

export default App;
