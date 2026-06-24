import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LivestockList from './pages/livestock/LivestockList';
import LivestockDetail from './pages/livestock/LivestockDetail';
import VehicleList from './pages/vehicle/VehicleList';
import VehicleDetail from './pages/vehicle/VehicleDetail';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SellerDashboard from './pages/seller_dashboard/SellerDashboard';
import Verification from './pages/verification/Verification';
import AddLivestock from './pages/seller_dashboard/AddLivestock';
import AddVehicle from './pages/seller_dashboard/AddVehicle';
import EditVehicle from './pages/seller_dashboard/EditVehicle';
import EditLivestock from './pages/seller_dashboard/EditLivestock';
import ProtectedRoute from './components/ProtectedRoute';
import './styles/main.css';

function App() {
  // Mobile-first state management
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Detect mobile device and handle viewport changes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    let previousHeight = window.innerHeight;
    
    const handleResize = () => {
      checkMobile();
      
      // Handle mobile keyboard appearance
      const currentHeight = window.innerHeight;
      if (currentHeight < previousHeight) {
        setKeyboardVisible(true);
      } else {
        setKeyboardVisible(false);
      }
      previousHeight = currentHeight;
    };

    // Initial check
    checkMobile();
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Fix for mobile viewport height issues (without breaking scroll)
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    setVH();
    window.addEventListener('resize', setVH);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      window.removeEventListener('resize', setVH);
    };
  }, []);

  // Mobile-specific toast configuration
  const toastConfig = {
    position: isMobile ? 'top-center' : 'top-right',
    duration: isMobile ? 3000 : 4000,
    style: {
      maxWidth: isMobile ? '90vw' : '350px',
      fontSize: isMobile ? '14px' : '16px',
      padding: isMobile ? '12px 16px' : '16px 20px',
      borderRadius: '12px',
    },
  };

  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/livestock" element={<LivestockList />} />
              <Route path="/livestock/:id" element={<LivestockDetail />} />
              <Route path="/vehicles" element={<VehicleList />} />
              <Route path="/vehicles/:id" element={<VehicleDetail />} />
              
              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Edit Routes */}
              <Route path="/seller/edit-vehicle/:id" element={
                <ProtectedRoute role="seller" requireVerified={false}>
                  <EditVehicle />
                </ProtectedRoute>
              } />
              <Route path="/seller/edit-livestock/:id" element={
                <ProtectedRoute role="seller" requireVerified={false}>
                  <EditLivestock />
                </ProtectedRoute>
              } />
              
              {/* Seller Dashboard */}
              <Route path="/seller/dashboard" element={
                <ProtectedRoute role="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } />
              
              {/* Verification page */}
              <Route path="/seller/verify" element={
                <ProtectedRoute role="seller">
                  <Verification />
                </ProtectedRoute>
              } />
              
              {/* Add Forms - keyboard-aware on mobile */}
              <Route path="/seller/add-livestock" element={
                <ProtectedRoute role="seller" requireVerified={true}>
                  <div 
                    className="form-wrapper"
                    style={{
                      marginBottom: keyboardVisible && isMobile ? '300px' : 0,
                      transition: 'margin-bottom 0.2s ease',
                    }}
                  >
                    <AddLivestock />
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="/seller/add-vehicle" element={
                <ProtectedRoute role="seller" requireVerified={true}>
                  <div 
                    className="form-wrapper"
                    style={{
                      marginBottom: keyboardVisible && isMobile ? '300px' : 0,
                      transition: 'margin-bottom 0.2s ease',
                    }}
                  >
                    <AddVehicle />
                  </div>
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          
          {/* Mobile-optimized Toaster */}
          <Toaster 
            position={toastConfig.position}
            toastOptions={{
              duration: toastConfig.duration,
              style: toastConfig.style,
              success: {
                iconTheme: {
                  primary: '#4CAF50',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#f44336',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;