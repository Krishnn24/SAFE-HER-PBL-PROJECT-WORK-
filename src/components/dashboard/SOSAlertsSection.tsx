import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, MapPin, Clock, Loader2, Play, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import type { Database } from "@/integrations/supabase/types";

type AlertStatus = Database["public"]["Enums"]["alert_status"];

interface SOSAlert {
  id: string;
  status: AlertStatus;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  trigger_method: string | null;
  created_at: string;
  resolved_at: string | null;
  notes: string | null;
  audio_url: string | null;
  signedAudioUrl?: string | null;
}

const SOSAlertsSection = () => {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const ITEMS_PER_PAGE = 10;

  const fetchAlerts = useCallback(async (pageNum: number = 0) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("sos_alerts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(pageNum * ITEMS_PER_PAGE, (pageNum + 1) * ITEMS_PER_PAGE - 1);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load SOS alerts",
        variant: "destructive",
      });
    } else {
      // Generate signed URLs for audio files (1 hour expiration)
      const alertsWithSignedUrls = await Promise.all(
        (data || []).map(async (alert) => {
          if (alert.audio_url && !alert.audio_url.startsWith('http')) {
            // audio_url is a file path, generate signed URL
            const { data: signedData } = await supabase.storage
              .from("sos-recordings")
              .createSignedUrl(alert.audio_url, 3600); // 1 hour expiration
            return { ...alert, signedAudioUrl: signedData?.signedUrl || null };
          }
          // Legacy: audio_url might already be a full URL
          return { ...alert, signedAudioUrl: alert.audio_url };
        })
      );

      if (pageNum === 0) {
        setAlerts(alertsWithSignedUrls);
      } else {
        setAlerts(prev => [...prev, ...alertsWithSignedUrls]);
      }
      setHasMore((data?.length || 0) === ITEMS_PER_PAGE);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAlerts(0);
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('sos-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sos_alerts'
        },
        () => {
          fetchAlerts(0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const getStatusBadge = (status: AlertStatus) => {
    const variants: Record<AlertStatus, { variant: "default" | "destructive" | "secondary" | "outline"; label: string }> = {
      active: { variant: "destructive", label: "Active" },
      resolved: { variant: "default", label: "Resolved" },
      cancelled: { variant: "secondary", label: "Cancelled" },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTriggerIcon = (method: string | null) => {
    switch (method) {
      case "shake":
        return "📱";
      case "pattern":
        return "🔐";
      default:
        return "👆";
    }
  };

  const openLocation = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAlerts(nextPage);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <CardTitle>SOS Alert History</CardTitle>
            <CardDescription>Your recent emergency alerts</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No SOS alerts</p>
            <p className="text-sm">Your emergency alert history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 bg-muted/50 rounded-xl border border-border"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(alert.status)}
                    {alert.trigger_method && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        {getTriggerIcon(alert.trigger_method)}
                        <span className="capitalize">{alert.trigger_method}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(alert.created_at), "PPp")}
                  </div>
                </div>

                {alert.address && (
                  <div className="flex items-start gap-2 text-sm text-foreground mb-2">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{alert.address}</span>
                  </div>
                )}

                {alert.latitude && alert.longitude && (
                  <div className="flex items-center gap-2 mb-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openLocation(Number(alert.latitude), Number(alert.longitude))}
                      className="text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      View Location
                    </Button>
                  </div>
                )}

                {alert.signedAudioUrl && (
                  <div className="mt-2">
                    <audio controls className="w-full h-8" src={alert.signedAudioUrl}>
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                )}

                {alert.notes && (
                  <p className="text-sm text-muted-foreground mt-2 italic">
                    "{alert.notes}"
                  </p>
                )}

                {alert.resolved_at && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Resolved: {format(new Date(alert.resolved_at), "PPp")}
                  </p>
                )}
              </div>
            ))}
            
            {hasMore && (
              <Button 
                variant="outline" 
                onClick={loadMore}
                className="w-full"
              >
                Load More
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SOSAlertsSection;
