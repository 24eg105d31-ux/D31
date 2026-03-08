import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell, User, CheckCircle2, AlertTriangle, XCircle, LogOut, Shield } from "lucide-react";
import { notificationItems } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";

const iconMap = {
  success: { icon: CheckCircle2, cls: "text-success" },
  warning: { icon: AlertTriangle, cls: "text-warning" },
  error: { icon: XCircle, cls: "text-destructive" },
};

const TopNav = () => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    window.location.href = "/login";
  };

  return (
    <header className="bg-nav text-nav-foreground px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <span className="font-extrabold">CRMS</span>
          <span className="font-normal ml-1">- Anurag University</span>
        </Link>
      </h1>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 text-sm font-medium hover:opacity-80 transition-opacity"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs((p) => !p)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Bell className="w-5 h-5" />
                <span className="text-sm font-medium">Notifications</span>
              </button>
              {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-card text-card-foreground rounded-lg shadow-lg border border-border z-50 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border font-semibold text-sm">Recent Alerts</div>
                  {notificationItems.map((n, i) => {
                    const { icon: Icon, cls } = iconMap[n.type];
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
                        <Icon className={`w-4 h-4 shrink-0 ${cls}`} />
                        <span className="text-sm">{n.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-medium">{user?.name}</span>
                {/* Role Badge */}
                <span 
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isAdmin 
                      ? "bg-orange-500 text-white" 
                      : "bg-blue-500 text-white"
                  }`}
                >
                  {isAdmin ? "Admin" : "Student"}
                </span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card text-card-foreground rounded-lg shadow-lg border border-border z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border">
                    <div className="font-semibold text-sm">{user?.name}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                    {/* Role Badge in Dropdown */}
                    <span 
                      className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        isAdmin 
                          ? "bg-orange-500 text-white" 
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {isAdmin ? "Admin" : "Student"}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium bg-primary px-4 py-2 rounded hover:opacity-90 transition-opacity"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNav;
