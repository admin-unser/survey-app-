"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  ClipboardCheck,
  LayoutDashboard,
  FolderOpen,
  Map,
  Calendar,
  FileText,
  Menu,
  LogOut,
  User,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: "ダッシュボード", href: "/dashboard", icon: LayoutDashboard },
  { name: "案件管理", href: "/cases", icon: FolderOpen },
  { name: "報告書一覧", href: "/reports", icon: FileText },
  { name: "マップ", href: "/map", icon: Map },
  { name: "カレンダー", href: "/calendar", icon: Calendar },
  { name: "使い方ガイド", href: "/guide", icon: BookOpen },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {navigation.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {item.name}
            {isActive && (
              <ChevronRight className="ml-auto h-4 w-4" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function UserMenu() {
  const { profile, signOut } = useAuth();

  return (
    <div className="border-t p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-3 px-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {profile?.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start text-left">
              <span className="text-sm font-medium truncate max-w-[140px]">
                {profile?.full_name || "ユーザー"}
              </span>
              <span className="text-xs text-muted-foreground">
                {profile?.role === "admin" ? "管理者" : "現場担当"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            プロフィール
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive cursor-pointer focus:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            ログアウト
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <ClipboardCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-foreground">現調報告</h1>
          <p className="text-[11px] text-muted-foreground">
            Field Survey App
          </p>
        </div>
      </div>
      <NavLinks onNavigate={onNavigate} />
      <UserMenu />
    </div>
  );
}

export function DesktopSidebar() {
  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col border-r bg-sidebar">
      <SidebarContent />
    </aside>
  );
}

export function MobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const currentPage = navigation.find(
    (n) => pathname === n.href || pathname.startsWith(n.href + "/")
  );

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur lg:hidden px-4">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="-ml-2">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ClipboardCheck className="h-4 w-4" />
        </div>
        <span className="font-semibold text-sm">
          {currentPage?.name || "現調報告"}
        </span>
      </div>
    </header>
  );
}

const bottomNavItems = [
  { name: "ホーム", href: "/dashboard", icon: LayoutDashboard },
  { name: "案件", href: "/cases", icon: FolderOpen },
  { name: "報告書", href: "/reports", icon: FileText },
  { name: "マップ", href: "/map", icon: Map },
  { name: "ガイド", href: "/guide", icon: BookOpen },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-around px-1 py-1.5">
        {bottomNavItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
