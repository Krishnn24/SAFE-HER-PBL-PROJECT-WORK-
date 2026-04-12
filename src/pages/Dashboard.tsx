import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, ArrowLeft, Loader2, Lock } from "lucide-react";
import TrustedContactsSection from "@/components/dashboard/TrustedContactsSection"; 
import FakeCallSection from "@/components/dashboard/FakeCallSection";
import SOSAlertsSection from "@/components/dashboard/SOSAlertsSection";
import ProfileSettingsSection from "@/components/dashboard/ProfileSettingsSection";
import PoliceStationLocatorSection from "@/components/dashboard/PoliceStationLocatorSection";
import SOSButton from "@/components/sos/SOSButton";
import SOSActiveOverlay from "@/components/sos/SOSActiveOverlay";
import ShakeDetector from "@/components/sos/ShakeDetector";
import PatternLockOverlay from "@/components/sos/PatternLockOverlay";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useSOSContext } from "@/contexts/SOSContext";
const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  const [showPatternTrigger, setShowPatternTrigger] = useState(false);
  const [pendingSOSTrigger, setPendingSOSTrigger] = useState<"shake" | "pattern" | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleSOSTrigger = useCallback(() => {
    // This will be called after confirmation
    setPendingSOSTrigger(null);
  }, []);

  const handleShakeTrigger = useCallback(() => {
    setPendingSOSTrigger("shake");
  }, []);

  const handlePatternVerified = useCallback(() => {
    setPendingSOSTrigger("pattern");
    setShowPatternTrigger(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SOS Active Overlay */}
      <SOSActiveOverlay />

      {/* Shake Detector */}
      <ShakeDetector 
        enabled={settings?.shake_enabled ?? false} 
        onSOSTrigger={handleShakeTrigger}
      />

      {/* Pattern Lock Trigger - accessible via keyboard shortcut or gesture */}
      {settings?.pattern_hash && (
        <PatternLockOverlay
          isOpen={showPatternTrigger}
          onClose={() => setShowPatternTrigger(false)}
          onPatternVerified={handlePatternVerified}
          mode="verify"
          savedPatternHash={settings.pattern_hash}
        />
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-glow transition-transform group-hover:scale-110">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold gradient-text">SafeHer</span>
              </Link>
              <span className="hidden sm:block text-muted-foreground">|</span>
              <h1 className="hidden sm:block text-lg font-semibold text-foreground">Dashboard</h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Pattern Trigger Button (if pattern is set) */}
              {settings?.pattern_hash && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPatternTrigger(true)}
                  className="hidden md:flex"
                >
                  <Lock className="w-4 h-4 mr-1" />
                  Pattern SOS
                </Button>
              )}
              <span className="hidden md:block text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Home
                </Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-8 py-8 pb-32">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Welcome to Your Safety Dashboard
            </h2>
            <p className="text-muted-foreground">
              Manage your emergency contacts, view alert history, and update your profile
            </p>
          </div>

          {/* Dashboard Sections */}
          <TrustedContactsSection />
          <SOSAlertsSection />
          <ProfileSettingsSection />
          <PoliceStationLocatorSection />
          <FakeCallSection />
        </div>
      </main>

      {/* Floating SOS Button */}
      <SOSButton variant="floating" />
    </div>
  );
};

export default Dashboard;
