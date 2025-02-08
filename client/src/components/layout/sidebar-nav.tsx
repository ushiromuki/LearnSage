import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  GraduationCap,
  Home,
  LogOut,
  Settings,
  User,
  BarChart,
  Building2,
  Users,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "../ui/button";

const adminLinks = [
  { href: "/admin/tenants", icon: Building2, label: "テナント管理" },
  { href: "/admin/users", icon: Users, label: "ユーザー管理" },
  { href: "/courses/create", icon: BookOpen, label: "コース作成" },
  { href: "/courses/manage", icon: Settings, label: "コース管理" },
  { href: "/analytics", icon: BarChart, label: "分析ダッシュボード" },
];

const instructorLinks = [
  { href: "/courses/create", icon: BookOpen, label: "コース作成" },
  { href: "/courses/manage", icon: Settings, label: "コース管理" },
  { href: "/analytics", icon: BarChart, label: "分析ダッシュボード" },
];

const studentLinks = [
  { href: "/courses", icon: BookOpen, label: "コース一覧" },
  { href: "/my-courses", icon: GraduationCap, label: "受講中のコース" },
];

export function SidebarNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  let roleLinks = studentLinks;
  if (user?.role === "admin") {
    roleLinks = adminLinks;
  } else if (user?.role === "instructor") {
    roleLinks = instructorLinks;
  }

  const links = [
    { href: "/", icon: Home, label: "ダッシュボード" },
    ...roleLinks,
    { href: "/profile", icon: User, label: "プロフィール" },
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
          ログアウト
        </Button>
      </div>
    </div>
  );
}