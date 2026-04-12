import { useNavigate } from "react-router-dom";
import { Heart, MessageSquare, User } from "lucide-react";

interface BottomNavProps {
  active: "discover" | "messages" | "profile";
}

const BottomNav = ({ active }: BottomNavProps) => {
  const navigate = useNavigate();

  const items = [
    { id: "discover" as const, icon: Heart, label: "Discover", path: "/discover" },
    { id: "messages" as const, icon: MessageSquare, label: "Messages", path: "/messages" },
    { id: "profile" as const, icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border z-50">
      <div className="flex items-center justify-around max-w-md mx-auto py-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className="w-6 h-6"
                fill={isActive && item.id === "discover" ? "currentColor" : "none"}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
