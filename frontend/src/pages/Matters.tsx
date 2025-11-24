import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Briefcase, 
  Plus, 
  Search,
  Filter,
  ArrowRight,
  Calendar,
  User
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Matters = () => {
  const navigate = useNavigate();
  const [matters, setMatters] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMatters = async () => {
      const { data, error } = await supabase
        .from("matters")
        .select("*, clients(full_name), profiles(full_name)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setMatters(data);
      }
    };

    fetchMatters();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "pending": return "secondary";
      case "closed": return "outline";
      case "archived": return "outline";
      default: return "secondary";
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredMatters = matters.filter((matter) =>
    matter.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    matter.matter_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    matter.clients?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Matters</h1>
            <p className="text-muted-foreground mt-1">Manage all your legal cases</p>
          </div>
          <Button onClick={() => navigate("/matters/new")} className="gap-2">
            <Plus className="w-4 h-4" />
            New Matter
          </Button>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by matter number, title, or client..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Matters List */}
        <div className="grid gap-4">
          {filteredMatters.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-semibold mb-2">No matters found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try adjusting your search" : "Get started by creating your first matter"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => navigate("/matters/new")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Matter
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredMatters.map((matter) => (
              <Card
                key={matter.id}
                className="hover-scale transition-smooth cursor-pointer shadow-elegant"
                onClick={() => navigate(`/matters/${matter.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{matter.title}</CardTitle>
                        <Badge variant={getStatusColor(matter.status)}>
                          {matter.status}
                        </Badge>
                        <Badge variant={getPriorityColor(matter.priority)}>
                          {matter.priority}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4">
                        <span className="font-mono">{matter.matter_number}</span>
                        {matter.clients && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {matter.clients.full_name}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Court</p>
                      <p className="font-medium">{matter.court_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Case Number</p>
                      <p className="font-medium font-mono">{matter.case_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Next Hearing
                      </p>
                      <p className="font-medium">{formatDate(matter.next_hearing_date)}</p>
                    </div>
                  </div>
                  {matter.description && (
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                      {matter.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Matters;
