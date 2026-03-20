import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.currentRole === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/user");
      }
    }
  }, [isAuthenticated, user, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 h-8 w-8" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
            NEU Library
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Visitor Management System
          </p>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Sign in with your NEU email to access the library visitor management system.
            </p>
            
            <a href={getLoginUrl()}>
              <Button className="w-full" size="lg">
                Sign in with Google
              </Button>
            </a>
            
            <p className="text-xs text-gray-500 text-center">
              Only authorized NEU staff can access this system.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
