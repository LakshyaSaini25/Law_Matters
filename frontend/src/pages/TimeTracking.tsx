import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Clock, 
  Plus, 
  Play,
  Pause,
  Square,
  DollarSign,
  Calendar,
  FileText
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TimeTracking = () => {
  const { toast } = useToast();
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [matters, setMatters] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [formData, setFormData] = useState({
    matter_id: "",
    description: "",
    hours: "",
    date: new Date().toISOString().split('T')[0],
    billable_rate: "",
    is_billable: true
  });

  useEffect(() => {
    fetchTimeEntries();
    fetchMatters();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, startTime]);

  const fetchTimeEntries = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("time_entries")
      .select("*, matters(title, matter_number)")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (!error && data) {
      setTimeEntries(data);
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

  const handleStartTracking = () => {
    setStartTime(new Date());
    setIsTracking(true);
    setElapsedTime(0);
  };

  const handleStopTracking = async () => {
    if (!startTime) return;
    
    const hours = elapsedTime / 3600;
    setFormData({ ...formData, hours: hours.toFixed(2) });
    setIsTracking(false);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("time_entries")
      .insert([{
        ...formData,
        user_id: user.id,
        hours: parseFloat(formData.hours),
        billable_rate: formData.billable_rate ? parseFloat(formData.billable_rate) : null
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create time entry",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Time entry created successfully",
      });
      setIsDialogOpen(false);
      setFormData({
        matter_id: "",
        description: "",
        hours: "",
        date: new Date().toISOString().split('T')[0],
        billable_rate: "",
        is_billable: true
      });
      setStartTime(null);
      setElapsedTime(0);
      fetchTimeEntries();
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + Number(entry.hours), 0);
  const billableHours = timeEntries.filter(e => e.is_billable).reduce((sum, entry) => sum + Number(entry.hours), 0);
  const totalRevenue = timeEntries.reduce((sum, entry) => 
    sum + (entry.is_billable ? Number(entry.hours) * (Number(entry.billable_rate) || 0) : 0), 0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Time Tracking</h1>
            <p className="text-muted-foreground mt-1">Track billable hours and manage time entries</p>
          </div>
          <div className="flex gap-2">
            {!isTracking ? (
              <Button onClick={handleStartTracking} className="gap-2">
                <Play className="w-4 h-4" />
                Start Timer
              </Button>
            ) : (
              <Button onClick={handleStopTracking} variant="destructive" className="gap-2">
                <Square className="w-4 h-4" />
                Stop Timer
              </Button>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Manual Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Add Time Entry</DialogTitle>
                    <DialogDescription>
                      Enter the time entry details below
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="matter_id">Matter</Label>
                      <select
                        id="matter_id"
                        value={formData.matter_id}
                        onChange={(e) => setFormData({ ...formData, matter_id: e.target.value })}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select a matter (optional)</option>
                        {matters.map((matter) => (
                          <option key={matter.id} value={matter.id}>
                            {matter.matter_number} - {matter.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="hours">Hours *</Label>
                        <Input
                          id="hours"
                          type="number"
                          step="0.25"
                          required
                          value={formData.hours}
                          onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                          placeholder="e.g., 2.5"
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What did you work on?"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="billable_rate">Billable Rate ($/hr)</Label>
                        <Input
                          id="billable_rate"
                          type="number"
                          step="0.01"
                          value={formData.billable_rate}
                          onChange={(e) => setFormData({ ...formData, billable_rate: e.target.value })}
                          placeholder="e.g., 250.00"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-8">
                        <input
                          type="checkbox"
                          id="is_billable"
                          checked={formData.is_billable}
                          onChange={(e) => setFormData({ ...formData, is_billable: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="is_billable">Billable</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Entry</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Timer Display */}
        {isTracking && (
          <Card className="border-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time Tracking Active</p>
                    <p className="text-3xl font-bold font-mono">{formatTime(elapsedTime)}</p>
                  </div>
                </div>
                <Button onClick={handleStopTracking} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  Stop & Save
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Total Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHours.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Billable Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{billableHours.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries List */}
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
            <CardDescription>All tracked time entries</CardDescription>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-20" />
                <h3 className="text-lg font-semibold mb-2">No time entries yet</h3>
                <p className="text-muted-foreground">Start tracking your time to see entries here</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="py-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{entry.description}</h4>
                        {entry.is_billable && (
                          <Badge variant="default" className="text-xs">Billable</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(entry.date)}
                        </span>
                        {entry.matters && (
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {entry.matters.matter_number}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {Number(entry.hours).toFixed(2)} hours
                        </span>
                        {entry.billable_rate && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${(Number(entry.hours) * Number(entry.billable_rate)).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TimeTracking;
