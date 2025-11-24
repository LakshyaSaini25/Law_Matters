import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  FileText, 
  Calendar, 
  Clock, 
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeMatters: 0,
    upcomingHearings: 0,
    pendingTasks: 0,
    totalDocuments: 0,
    thisMonthHours: 0,
  });
  const [recentMatters, setRecentMatters] = useState<any[]>([]);
  const [upcomingHearings, setUpcomingHearings] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch matters count
      const { count: mattersCount } = await supabase
        .from("matters")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

      // Fetch recent matters
      const { data: matters } = await supabase
        .from("matters")
        .select("*, clients(full_name)")
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch upcoming hearings count
      const { count: hearingsCount } = await supabase
        .from("hearings")
        .select("*", { count: "exact", head: true })
        .gte("hearing_date", new Date().toISOString())
        .eq("status", "scheduled");

      // Fetch upcoming hearings
      const { data: hearings } = await supabase
        .from("hearings")
        .select("*, matters(title)")
        .gte("hearing_date", new Date().toISOString())
        .eq("status", "scheduled")
        .order("hearing_date", { ascending: true })
        .limit(5);

      // Fetch pending tasks count
      const { count: tasksCount } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "in_progress"]);

      // Fetch documents count
      const { count: documentsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });

      // Fetch this month's billable hours
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { data: timeEntries } = await supabase
        .from("time_entries")
        .select("hours")
        .eq("user_id", user.id)
        .gte("date", startOfMonth);

      const totalHours = timeEntries?.reduce((sum, entry) => sum + Number(entry.hours), 0) || 0;

      setStats({
        activeMatters: mattersCount || 0,
        upcomingHearings: hearingsCount || 0,
        pendingTasks: tasksCount || 0,
        totalDocuments: documentsCount || 0,
        thisMonthHours: Math.round(totalHours * 10) / 10,
      });

      setRecentMatters(matters || []);
      setUpcomingHearings(hearings || []);
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: "Active Matters",
      value: stats.activeMatters,
      icon: Briefcase,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Upcoming Hearings",
      value: stats.upcomingHearings,
      icon: Calendar,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: AlertCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      title: "Total Documents",
      value: stats.totalDocuments,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Hours This Month",
      value: stats.thisMonthHours,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! Here's your practice overview.</p>
          </div>
          <Button onClick={() => navigate("/matters/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            New Matter
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((stat, index) => (
            <Card key={index} className="hover-scale transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Matters and Upcoming Hearings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Matters */}
          <Card className="shadow-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Matters</CardTitle>
                  <CardDescription>Latest cases in your practice</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/matters")}>
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMatters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No matters yet</p>
                    <Button 
                      variant="link" 
                      onClick={() => navigate("/matters/new")}
                      className="mt-2"
                    >
                      Create your first matter
                    </Button>
                  </div>
                ) : (
                  recentMatters.map((matter) => (
                    <div
                      key={matter.id}
                      onClick={() => navigate(`/matters/${matter.id}`)}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-smooth"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{matter.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Client: {matter.clients?.full_name || "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getPriorityColor(matter.priority)}>
                          {matter.priority}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Hearings */}
          <Card className="shadow-elegant">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Hearings</CardTitle>
                  <CardDescription>Scheduled court appearances</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/calendar")}>
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingHearings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No upcoming hearings</p>
                  </div>
                ) : (
                  upcomingHearings.map((hearing) => (
                    <div
                      key={hearing.id}
                      className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-smooth"
                    >
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
                        <p className="text-xs font-medium text-primary">
                          {new Date(hearing.hearing_date).toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {new Date(hearing.hearing_date).getDate()}
                        </p>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{hearing.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {hearing.matters?.title || "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(hearing.hearing_date)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get you started</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 gap-2"
                onClick={() => navigate("/matters/new")}
              >
                <Briefcase className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">New Matter</p>
                  <p className="text-xs text-muted-foreground">Create a new case</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 gap-2"
                onClick={() => navigate("/clients/new")}
              >
                <Plus className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Add Client</p>
                  <p className="text-xs text-muted-foreground">Register new client</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 gap-2"
                onClick={() => navigate("/documents")}
              >
                <FileText className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Upload Document</p>
                  <p className="text-xs text-muted-foreground">Add case files</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start p-4 gap-2"
                onClick={() => navigate("/time-tracking")}
              >
                <Clock className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="font-medium">Log Time</p>
                  <p className="text-xs text-muted-foreground">Track billable hours</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
