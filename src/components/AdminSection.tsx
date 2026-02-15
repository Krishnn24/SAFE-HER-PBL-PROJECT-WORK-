import { 
  Users, 
  AlertTriangle, 
  MapPin, 
  History, 
  Building2, 
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  Activity
} from "lucide-react";

const AdminSection = () => {
  const adminFeatures = [
    {
      icon: Users,
      title: "User Management",
      description: "View and manage all registered users with detailed profiles and activity logs.",
    },
    {
      icon: AlertTriangle,
      title: "Live SOS Alerts",
      description: "Monitor active emergency alerts in real-time with instant notification system.",
    },
    {
      icon: MapPin,
      title: "Live Location Tracking",
      description: "View users' locations on an interactive map during active emergencies.",
    },
    {
      icon: History,
      title: "Incident History",
      description: "Access complete logs of past incidents with detailed timelines and outcomes.",
    },
    {
      icon: Building2,
      title: "Police Stations",
      description: "Manage and update the database of nearby police stations and emergency services.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "View comprehensive statistics on alerts, users, and response times.",
    },
  ];

  const stats = [
    { label: "Active Users", value: "128", icon: Users, trend: "+12%" },
    { label: "Alerts Today", value: "47", icon: AlertTriangle, trend: "-8%" },
    { label: "Resolved", value: "45", icon: CheckCircle, trend: "+15%" },
    { label: "Avg. Response", value: "2.3m", icon: Clock, trend: "-20%" },
  ];

  const recentAlerts = [
    { id: "#2847", user: "Sarah M.", location: "Downtown", status: "Active", time: "2m ago" },
    { id: "#2846", user: "Emily R.", location: "Westside", status: "Resolved", time: "15m ago" },
    { id: "#2845", user: "Jessica L.", location: "Central", status: "Resolved", time: "32m ago" },
    { id: "#2844", user: "Amanda K.", location: "North", status: "Resolved", time: "1h ago" },
  ];

  return (
    <section id="admin" className="py-20 lg:py-32 bg-secondary/5">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-secondary/20 text-secondary-foreground dark:bg-secondary dark:text-secondary-foreground text-sm font-semibold mb-6">
            Admin Dashboard
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
            Powerful <span className="gradient-text">Command Center</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive admin panel for authorities and guardians to monitor, manage, and respond 
            to emergencies with maximum efficiency.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Main Dashboard Preview */}
          <div className="lg:col-span-2 bg-card rounded-3xl border border-border overflow-hidden shadow-lg">
            {/* Dashboard Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">Dashboard Overview</span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="p-4 rounded-2xl bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="w-5 h-5 text-primary" />
                      <span className={`text-xs font-medium ${stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                        {stat.trend}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Chart Placeholder */}
              <div className="h-40 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-secondary/10 flex items-end justify-between px-6 pb-4 mb-6">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((height, i) => (
                  <div
                    key={i}
                    className="w-4 rounded-t-lg gradient-bg opacity-70"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>

              {/* Recent Alerts Table */}
              <div className="rounded-2xl border border-border overflow-hidden">
                <div className="p-4 bg-muted/30 border-b border-border">
                  <span className="font-semibold text-foreground">Recent Alerts</span>
                </div>
                <div className="divide-y divide-border">
                  {recentAlerts.map((alert) => (
                    <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono text-muted-foreground">{alert.id}</span>
                        <span className="text-sm font-medium text-foreground">{alert.user}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{alert.location}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          alert.status === 'Active' 
                            ? 'bg-destructive/20 text-destructive' 
                            : 'bg-green-500/20 text-green-600 dark:text-green-400'
                        }`}>
                          {alert.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            {adminFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="p-5 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminSection;
