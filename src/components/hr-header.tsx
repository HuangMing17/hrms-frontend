import { Search, Bell, User, Sun, Moon } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "./ui/avatar";

interface HRHeaderProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export function HRHeader({
  isDarkMode,
  onToggleTheme,
}: HRHeaderProps) {
  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-pink-200 dark:border-pink-800 shadow-sm">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gradient">
            GODCosmetics
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Hệ thống quản lý nhân sự
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
     

        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          className="hover-glow"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-yellow-400" />
          ) : (
            <Moon className="h-5 w-5 text-purple-600" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
        </Button>

        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src="" alt="User" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">
              Hoàng Duy Minh
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Store Manager
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
