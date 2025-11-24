import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock,
  MapPin,
  Gavel,
  FileText,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Calendar = () => {
  const { toast } = useToast();
  const [hearings, setHearings] = useState<any[]>([]);
  const [matters, setMatters] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [formData, setFormData] = useState({
    title: "",
    matter_id: "",
    hearing_date: "",
    court_name: "",
    judge_name: "",
    location: "",
    notes: ""
  });

  useEffect(() => {
    fetchHearings();
    fetchMatters();
  }, []);

  const fetchHearings = async () => {
    const { data, error } = await supabase
      .from("hearings")
      .select("*, matters(title, matter_number)")
      .order("hearing_date", { ascending: true });

    if (!error && data) {
      setHearings(data);
    }
  };

  const fetchMatters = async () => {
    const { data, error } = await supabase
      .from("matters")
      .select("id, title, matter_number")
      .eq("status", "active")
      .order("title");

    if (!error && data) {
      setMatters(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("hearings")
      .insert([{ ...formData, created_by: user.id }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create hearing",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Hearing scheduled successfully",
      });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        matter_id: "",
        hearing_date: "",
        court_name: "",
        judge_name: "",
        location: "",
        notes: ""
      });
      fetchHearings();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "default";
      case "completed": return "secondary";
      case "postponed": return "outline";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const upcomingHearings = hearings.filter(h => 
    new Date(h.hearing_date) >= new Date() && h.status === "scheduled"
  );

  const pastHearings = hearings.filter(h => 
    new Date(h.hearing_date) < new Date() || h.status !== "scheduled"
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendar & Hearings</h1>
            <p className="text-muted-foreground mt-1">Manage court dates and hearing schedules</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Schedule Hearing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Schedule New Hearing</DialogTitle>
                  <DialogDescription>
                    Enter the hearing details below
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Hearing Title *</Label>
                    <Input
                      id="title"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Preliminary Hearing"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="matter_id">Matter *</Label>
                    <select
                      id="matter_id"
                      required
                      value={formData.matter_id}
                      onChange={(e) => setFormData({ ...formData, matter_id: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select a matter</option>
                      {matters.map((matter) => (
                        <option key={matter.id} value={matter.id}>
                          {matter.matter_number} - {matter.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="hearing_date">Date & Time *</Label>
                    <Input
                      id="hearing_date"
                      type="datetime-local"
                      required
                      value={formData.hearing_date}
                      onChange={(e) => setFormData({ ...formData, hearing_date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="court_name">Court Name</Label>
                      <Input
                        id="court_name"
                        value={formData.court_name}
                        onChange={(e) => setFormData({ ...formData, court_name: e.target.value })}
                        placeholder="e.g., District Court"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="judge_name">Judge Name</Label>
                      <Input
                        id="judge_name"
                        value={formData.judge_name}
                        onChange={(e) => setFormData({ ...formData, judge_name: e.target.value })}
                        placeholder="e.g., Hon. John Smith"
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Courtroom 3, Building A"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional notes or preparation items"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Schedule Hearing</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Hearings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              Upcoming Hearings
            </CardTitle>
            <CardDescription>
              {upcomingHearings.length} scheduled hearings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingHearings.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No upcoming hearings scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingHearings.map((hearing) => (
                  <Card key={hearing.id} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg mb-1">{hearing.title}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {hearing.matters?.matter_number} - {hearing.matters?.title}
                          </p>
                        </div>
                        <Badge variant={getStatusColor(hearing.status)}>
                          {hearing.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{formatDate(hearing.hearing_date)} at {formatTime(hearing.hearing_date)}</span>
                        </div>
                        {hearing.court_name && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Gavel className="w-4 h-4" />
                            <span>{hearing.court_name}</span>
                          </div>
                        )}
                        {hearing.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{hearing.location}</span>
                          </div>
                        )}
                        {hearing.judge_name && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="font-medium">Judge:</span>
                            <span>{hearing.judge_name}</span>
                          </div>
                        )}
                      </div>
                      {hearing.notes && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <p className="text-sm text-muted-foreground">{hearing.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Hearings */}
        {pastHearings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Past Hearings</CardTitle>
              <CardDescription>
                {pastHearings.length} completed or cancelled hearings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pastHearings.map((hearing) => (
                  <div key={hearing.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-smooth">
                    <div>
                      <h4 className="font-medium mb-1">{hearing.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {hearing.matters?.matter_number} • {formatDate(hearing.hearing_date)}
                      </p>
                    </div>
                    <Badge variant={getStatusColor(hearing.status)}>
                      {hearing.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Calendar;
