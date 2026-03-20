import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut, Users, Calendar } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    reason: "",
    college: "",
    employeeType: "",
    startDate: "",
    endDate: "",
  });

  const statsQuery = trpc.stats.get.useQuery(
    {
      reason: filters.reason || undefined,
      college: filters.college || undefined,
      employeeType: (filters.employeeType as any) || undefined,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    },
    { enabled: user?.currentRole === "admin" }
  );

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleSwitchToUser = async () => {
    const switchRoleMutation = trpc.auth.switchRole.useMutation();
    try {
      await switchRoleMutation.mutateAsync({ role: "user" });
      setLocation("/user");
    } catch (error) {
      console.error("Failed to switch role:", error);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      reason: "",
      college: "",
      employeeType: "",
      startDate: "",
      endDate: "",
    });
  };

  if (user?.currentRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Access Denied</p>
          <p className="text-gray-600">You don't have permission to view this page.</p>
          <Button onClick={() => setLocation("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">NEU Library - Admin Dashboard</h1>
          <div className="flex gap-4 items-center">
            <Button 
              variant="outline" 
              onClick={handleSwitchToUser}
            >
              Switch to User
            </Button>
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Visitors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsQuery.data?.dailyCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">visitors today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsQuery.data?.weeklyCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">visitors this week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total (Filtered)</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsQuery.data?.totalCount || 0}
              </div>
              <p className="text-xs text-muted-foreground">visitors matching filters</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Reason for Visit
                </label>
                <Input
                  placeholder="e.g., Study, Research"
                  value={filters.reason}
                  onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  College
                </label>
                <Input
                  placeholder="e.g., Engineering"
                  value={filters.college}
                  onChange={(e) => setFilters({ ...filters, college: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Employee Type
                </label>
                <Select value={filters.employeeType} onValueChange={(value) => setFilters({ ...filters, employeeType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="non-employee">Non-employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleResetFilters}
              className="mt-4"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Visitor Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Visitor Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {statsQuery.isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading visitor logs...</p>
              </div>
            ) : statsQuery.data?.logs && statsQuery.data.logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4 font-semibold">Date</th>
                      <th className="text-left py-2 px-4 font-semibold">Reason</th>
                      <th className="text-left py-2 px-4 font-semibold">College</th>
                      <th className="text-left py-2 px-4 font-semibold">Employee Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statsQuery.data.logs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">
                          {new Date(log.date).toLocaleString()}
                        </td>
                        <td className="py-2 px-4">{log.reason}</td>
                        <td className="py-2 px-4">{log.college}</td>
                        <td className="py-2 px-4 capitalize">{log.employeeType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No visitor logs found matching the filters.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
