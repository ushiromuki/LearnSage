import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  GraduationCap,
  Home,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "../ui/button";

const instructorLinks = [
  { href: "/courses/create", icon: BookOpen, label: "Create Course" },
  { href: "/courses/manage", icon: Settings, label: "Manage Courses" },
];

const studentLinks = [
  { href: "/courses", icon: BookOpen, label: "Browse Courses" },
  { href: "/my-courses", icon: GraduationCap, label: "My Courses" },
];

export function SidebarNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const links = [
    { href: "/", icon: Home, label: "Dashboard" },
    ...(user?.role === "instructor" ? instructorLinks : studentLinks),
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-sidebar-foreground">
          Learning MS
        </h2>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            <a
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm",
                location === link.href
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
              )}
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </a>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
