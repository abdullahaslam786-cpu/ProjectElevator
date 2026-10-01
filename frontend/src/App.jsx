import React from "react";
import { BrowserRouter as Router, Routes, Route, Outlet, useLocation } from "react-router-dom";
// import { Toaster } from "react-hot-toast";

// Standard Components
import Navbar from "./components/Navbar";
import Home from "./Home/Home";
import Profile from "./Profile/Profile";
import ProfileEdit from "./Profile/ProfileEdit";
import HowDoesItWork from "./Profile/components/HowDoesItWork";
import ProjectDetail from "./Project/ProjectDetail";
import Register from "./Auth/Register";
import Login from "./Auth/Login";

import ElevatorDesigner3 from "./ElevatorDesigner/ElevatorDesigner3";
import OTP from "./Auth/OTP";
import FancyGoldButton from "./Project/FancyGoldButton";

// Dashboard Components - Segment B Fabricators
import Dashboard from "./SegmentB Fabricators/Dashboard";
import AssignedProjects from "./SegmentB Fabricators/AssignedProjects";
import ReviewSpecifications from "./SegmentB Fabricators/ReviewSpecifications";
import SubmitPricing from "./SegmentB Fabricators/SubmitPricing";
import ShopDrawings from "./SegmentB Fabricators/ShopDrawings";
import ProductionStatus from "./SegmentB Fabricators/ProductionStatus";
import Messages from "./SegmentB Fabricators/Messages";
import DashboardSidebar from "./SegmentB Fabricators/components/DashboardSidebar";
import DashboardNavbar from "./SegmentB Fabricators/components/DashboardNavber";
import GradientGallery from "./SegmentC Suppliers/GradientGallery";

// Dashboard Components - Segment C Suppliers (Pages)
import Analytics from "./SegmentC Suppliers/pages/Analytics";
import SupplierDashboard from "./SegmentC Suppliers/pages/Dashboard";
import LeadRequests from "./SegmentC Suppliers/pages/LeadRequests";
import ProductCatalog from "./SegmentC Suppliers/pages/ProductCatalog";
import SubscriptionManagement from "./SegmentC Suppliers/pages/SubscriptionManagement";
import UploadProducts from "./SegmentC Suppliers/pages/UploadProducts";
import SampleRequests from "./SegmentC Suppliers/pages/SampleRequests";

// IMPORTANT: Imported your Layout component from the SegmentC components folder
import SupplierLayout from "./SegmentC Suppliers/components/Layout";
import CabInspiration from "./Profile/components/CabInspiration";
import { ToastProvider } from "./context/ToastContext";
// import Step1 from "./Profile/components/steps/Step1";
// import Step6 from "./Profile/components/steps/Step6";
import Step5 from "./Profile/components/steps/Step5";
import Step4 from "./Profile/components/steps/Step4";
import Step3 from "./Profile/components/steps/Step3";
import Step2 from "./Profile/components/steps/Step2";

// ---

// 1. Layout specifically for the Fabricator Dashboard (Segment B)
const DashboardLayout = () => {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <DashboardNavbar />
        <main style={{ padding: "20px", flex: 1 }}>
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

// ---

const AppContent = () => {
  const location = useLocation();
  
  // Array to hide the MAIN layout navbar on Fabricator/Supplier dashboard URLs
  // AND on the auth pages (login/register), which render their own full-page layout.
  const hideMainNavbarPaths = [
    // Auth paths
    "/login",
    "/register",
    // Segment B paths
    "/dashboard_fabricator", 
    "/assignedprojects", 
    "/reviewspecifications", 
    "/submitpricing",
    "/shopdrawings", 
    "/productionstatus",
    "/messages",
    // Segment C paths
    "/supplier/dashboard",
    "/supplier/analytics",
    "/supplier/leads",
    "/supplier/catalog",
    "/supplier/samples",
    "/supplier/subscription",
    "/supplier/upload"
  ];


  
  // Dynamic check to see if the current route is a dashboard, auth page, or starts with /supplier
  const isDashboard = hideMainNavbarPaths.includes(location.pathname) || location.pathname.startsWith("/supplier");

  return (
    <>
      {/* Show Main Public Navbar only if it's NOT a dashboard/auth route */}
      {!isDashboard && <Navbar />}

      <Routes>
        {/* Standard Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile-edit" element={<ProfileEdit />} />
        <Route path="/how-does-it-work" element={<HowDoesItWork />} />
        {/* <Route path="/step1" element={<Step1 />} /> */}
        <Route path="/step2" element={<Step2 />} />
        <Route path="/step3" element={<Step3 />} />
        <Route path="/step4" element={<Step4 />} />
        <Route path="/step5" element={<Step5 />} />
        <Route path="/cab-inspiration" element={<CabInspiration />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/design/:id" element={<ElevatorDesigner3 />} />
        <Route path="/verify-otp" element={<OTP />} />
        <Route path="/button" element={<FancyGoldButton />} />
        
        {/* Grouped Fabricator Dashboard Routes (Segment B) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard_fabricator" element={<Dashboard />} />
          <Route path="/assignedprojects" element={<AssignedProjects />} />
          <Route path="/reviewspecifications" element={<ReviewSpecifications />} />
          <Route path="/submitpricing" element={<SubmitPricing />} />
          <Route path="/shopdrawings" element={<ShopDrawings />} />
          <Route path="/productionstatus" element={<ProductionStatus />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/color" element={<GradientGallery />} />
        </Route>

        {/* Grouped Supplier Dashboard Routes (Segment C) using your Layout component */}
        <Route element={<SupplierLayout />}>
          <Route path="/supplier/dashboard" element={<SupplierDashboard/>} />
          <Route path="/supplier/analytics" element={<Analytics />} />
          <Route path="/supplier/leads" element={<LeadRequests />} />
          <Route path="/supplier/catalog" element={<ProductCatalog />} />
          <Route path="/supplier/samples" element={<SampleRequests />} />
          <Route path="/supplier/subscription" element={<SubscriptionManagement />} />
          <Route path="/supplier/upload" element={<UploadProducts />} />
        </Route>
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <Router>
   <ToastProvider>
      <AppContent />
      </ToastProvider>
    </Router>
  );
};

export default App;