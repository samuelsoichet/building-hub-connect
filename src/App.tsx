
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import WorkOrders from "./pages/WorkOrders";
import Documents from "./pages/Documents";
import Payments from "./pages/Payments";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/documents" element={<Documents />} />
            
            {/* Protected Routes for all authenticated users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/work-orders" element={<WorkOrders />} />
            </Route>
            
            {/* Routes that require tenant role */}
            <Route element={<ProtectedRoute allowedRoles={['tenant']} />}>
              {/* Add tenant-specific routes here */}
            </Route>
            
            {/* Routes that require admin role */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              {/* Add admin-specific routes here */}
            </Route>
            
            {/* Routes that require maintenance role */}
            <Route element={<ProtectedRoute allowedRoles={['maintenance']} />}>
              {/* Add maintenance-specific routes here */}
            </Route>
            
            {/* Routes for admins and tenants */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'tenant']} />}>
              <Route path="/payments" element={<Payments />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
