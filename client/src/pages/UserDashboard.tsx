import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut } from "lucide-react";

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const switchRoleMutation = trpc.auth.switchRole.useMutation();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleSwitchToAdmin = async () => {
    try {
      await switchRoleMutation.mutateAsync({ role: "admin" });
      setLocation("/admin");
    } catch (error) {
      console.error("Failed to switch role:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">NEU Library</h1>
          <div className="flex gap-4 items-center">
            {user?.role === "admin" && (
              <Button 
                variant="outline" 
                onClick={handleSwitchToAdmin}
                disabled={switchRoleMutation.isPending}
              >
                Switch to Admin
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="flex gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            Welcome to NEU Library!
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Hello, {user?.name || user?.email}
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto">
            You are logged in as a regular user. You can view library information and resources.
            {user?.role === "admin" && " You also have admin privileges and can switch to the admin dashboard."}
          </p>
        </div>
      </main>
    </div>
  );
}
