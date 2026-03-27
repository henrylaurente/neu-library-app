import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { LogOut, Users, Calendar, TrendingUp, Plus, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [filters, setFilters] = useState({
    reason: "",
    college: "",
    employeeType: "all",
    startDate: "",
    endDate: "",
  });
  const [isAddingVisitor, setIsAddingVisitor] = useState(false);
  const [newVisitor, setNewVisitor] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    reason: "",
    college: "",
    employeeType: "staff" as "teacher" | "staff" | "non-employee",
  });

  const statsQuery = trpc.stats.get.useQuery(
    {
      reason: filters.reason || undefined,
      college: filters.college || undefined,
      employeeType: (filters.employeeType && filters.employeeType !== "all" ? filters.employeeType : undefined) as any,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    },
    { enabled: user?.currentRole === "admin", refetchInterval: 5000 }
  );

  const createVisitorMutation = trpc.visitors.log.useMutation({
    onSuccess: () => {
      toast.success("Visitor logged successfully!");
      setNewVisitor({
        date: new Date().toISOString().split("T")[0],
        time: new Date().toTimeString().slice(0, 5),
        reason: "",
        college: "",
        employeeType: "staff",
      });
      setIsAddingVisitor(false);
      statsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to log visitor: ${error.message}`);
    },
  });

  const switchRoleMutation = trpc.auth.switchRole.useMutation({
    onSuccess: () => {
      setLocation("/user");
    },
    onError: (error) => {
      toast.error(`Failed to switch role: ${error.message}`);
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  const handleSwitchToUser = () => {
    switchRoleMutation.mutate({ role: "user" });
  };

  const handleResetFilters = () => {
    setFilters({
      reason: "",
      college: "",
      employeeType: "all",
      startDate: "",
      endDate: "",
    });
  };

  const handleAddVisitor = () => {
    if (!newVisitor.reason || !newVisitor.college) {
      toast.error("Please fill in all required fields");
      return;
    }

    const [year, month, day] = newVisitor.date.split("-");
    const [hours, minutes] = newVisitor.time.split(":");
    const visitDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));

    createVisitorMutation.mutate({
      date: visitDate,
      reason: newVisitor.reason,
      college: newVisitor.college,
      employeeType: newVisitor.employeeType,
    });
  };

  const reasons = ["Study", "Research", "Borrowing Books", "Group Project", "Quiet Reading", "Computer Lab"];
  const colleges = [
    "College of Engineering",
    "College of Arts",
    "College of Science",
    "College of Business",
    "College of Education",
  ];

  const isLoading = statsQuery.isLoading;
  const data = statsQuery.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Users className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NEU Library Dashboard</h1>
              <p className="text-sm text-gray-500">Visitor Management System</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Dialog open={isAddingVisitor} onOpenChange={setIsAddingVisitor}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2">
                  <Plus size={18} />
                  Log Visitor
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Log New Visitor</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Date</label>
                    <input
                      type="date"
                      value={newVisitor.date}
                      onChange={(e) => setNewVisitor({ ...newVisitor, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Time</label>
                    <input
                      type="time"
                      value={newVisitor.time}
                      onChange={(e) => setNewVisitor({ ...newVisitor, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Reason for Visit *</label>
                    <Select value={newVisitor.reason} onValueChange={(value) => setNewVisitor({ ...newVisitor, reason: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {reasons.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">College *</label>
                    <Select value={newVisitor.college} onValueChange={(value) => setNewVisitor({ ...newVisitor, college: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-2">Employee Type</label>
                    <Select value={newVisitor.employeeType} onValueChange={(value) => setNewVisitor({ ...newVisitor, employeeType: value as any })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="non-employee">Non-employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddVisitor}
                    disabled={createVisitorMutation.isPending}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  >
                    {createVisitorMutation.isPending ? "Logging..." : "Log Visitor"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={handleSwitchToUser}
              disabled={switchRoleMutation.isPending}
              className="border-gray-300"
            >
              {switchRoleMutation.isPending ? "Switching..." : "Switch to User"}
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut size={18} />
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users size={18} className="text-blue-600" />
                </div>
                Today's Visitors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{isLoading ? "-" : data?.dailyCount || 0}</div>
              <p className="text-xs text-gray-500 mt-1">visitors today</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Calendar size={18} className="text-indigo-600" />
                </div>
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{isLoading ? "-" : data?.weeklyCount || 0}</div>
              <p className="text-xs text-gray-500 mt-1">visitors this week</p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-0 hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <TrendingUp size={18} className="text-purple-600" />
                </div>
                Total (Filtered)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{isLoading ? "-" : data?.totalCount || 0}</div>
              <p className="text-xs text-gray-500 mt-1">visitors matching filters</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="bg-white shadow-sm border-0 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Filters</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="text-gray-600 border-gray-300"
              >
                <RefreshCw size={16} className="mr-2" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Reason for Visit</label>
                <Input
                  placeholder="e.g., Study, Research"
                  value={filters.reason}
                  onChange={(e) => setFilters({ ...filters, reason: e.target.value })}
                  className="border-gray-300"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">College</label>
                <Input
                  placeholder="e.g., Engineering"
                  value={filters.college}
                  onChange={(e) => setFilters({ ...filters, college: e.target.value })}
                  className="border-gray-300"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Employee Type</label>
                <Select value={filters.employeeType} onValueChange={(value) => setFilters({ ...filters, employeeType: value })}>
                  <SelectTrigger className="border-gray-300">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="non-employee">Non-employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visitor Logs Table */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Visitor Logs</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => statsQuery.refetch()}
                disabled={statsQuery.isRefetching}
                className="text-gray-600"
              >
                <RefreshCw size={16} className={statsQuery.isRefetching ? "animate-spin" : ""} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">Loading visitor logs...</div>
              </div>
            ) : data?.logs && data.logs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Date & Time</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Reason</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">College</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Employee Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.logs.map((log: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm text-gray-900">
                          {new Date(log.date).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700">{log.reason}</td>
                        <td className="py-3 px-4 text-sm text-gray-700">{log.college}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            log.employeeType === "teacher"
                              ? "bg-blue-100 text-blue-800"
                              : log.employeeType === "staff"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                            {log.employeeType === "non-employee" ? "Non-employee" : log.employeeType.charAt(0).toUpperCase() + log.employeeType.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex justify-center py-8">
                <div className="text-gray-500">No visitor logs found</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
