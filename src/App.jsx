import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import AddListing from './pages/AddListing';
import HousingMap from './pages/HousingMap';
import Chatbot from './components/Chatbot';  // ← Keep this import

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Remove this route: <Route path="/MlChatbot" element={<Chatbot/>} /> */}
        <Route path="/HousingMap" element={<HousingMap />} />
        <Route path="/listings" element={<Listings />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard/tenant"
          element={
            <ProtectedRoute role="tenant">
              <TenantDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/landlord"
          element={
            <ProtectedRoute role="landlord">
              <LandlordDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/landlord/new"
          element={
            <ProtectedRoute role="landlord">
              <AddListing />
            </ProtectedRoute>
          }
        />
      </Routes>
      
      {/* CHATBOT WIDGET - Shows on every page */}
      <Chatbot />  {/* ← Add this here */}
      
      <Footer />
    </AuthProvider>
  );
}

export default App;