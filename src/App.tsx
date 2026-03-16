import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import ErrorBoundary from "./components/ErrorBoundary";
import { useTranslationDetector } from "./hooks/useTranslationDetector";
import ProtectedRoute from "./components/ProtectedRoute";

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Monitor = lazy(() => import("./pages/Monitor"));
const Companies = lazy(() => import("./pages/Companies"));
const ServiceTypes = lazy(() => import("./pages/ServiceTypes"));
const Votes = lazy(() => import("./pages/Votes"));
const Users = lazy(() => import("./pages/Users"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const StatusOperacao = lazy(() => import("./pages/StatusOperacao"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();
  useTranslationDetector(); // Detect browser translation

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center w-full min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const fallback = (
    <div className="flex items-center justify-center w-full min-h-[50vh] py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="flex min-h-screen w-full">
      {isAuthenticated ? (
        <>
          <Sidebar />
          <div className="flex-1 min-w-0">
            <Navbar />
            <SidebarInset className="pt-14">
              <div className="container mx-auto min-w-0 px-4 py-4 sm:px-6 lg:px-8">
                <Suspense fallback={fallback}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/monitor" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
                  <Route path="/monitor/:companyId" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
                  <Route path="/votes" element={<ProtectedRoute><Votes /></ProtectedRoute>} />
                  <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
                  <Route path="/service-types" element={<ProtectedRoute><ServiceTypes /></ProtectedRoute>} />
                  <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
                  <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
                  <Route path="/status-operacao" element={<ProtectedRoute><StatusOperacao /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
                </Suspense>
              </div>
            </SidebarInset>
          </div>
        </>
      ) : (
        <div className="w-full">
          <Suspense fallback={fallback}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/monitor" element={<ProtectedRoute><Monitor /></ProtectedRoute>} />
            <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
            <Route path="/service-types" element={<ProtectedRoute><ServiceTypes /></ProtectedRoute>} />
            <Route path="/votes" element={<ProtectedRoute><Votes /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
            <Route path="/status-operacao" element={<ProtectedRoute><StatusOperacao /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          </Suspense>
        </div>
      )}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <ThemeProvider>
            <SidebarProvider>
              <ErrorBoundary>
                <AppContent />
              </ErrorBoundary>
            </SidebarProvider>
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
