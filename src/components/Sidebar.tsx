"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconLogout,
} from "@tabler/icons-react";
import { Users, FileText } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function SideBar({ children }: { children: React.ReactNode }) {
  const links = [
    {
      label: "Dashboard",
      href: "/superadmin",
      icon: <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
    {
      label: "Admins",
      href: "/admins",
      icon: <Users className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />,
    },
  ];

  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/sign-in" });
  };

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden border bg-gray-100 md:flex-row dark:bg-neutral-800",
        "h-[100vh]"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto gap-y-5">
            {/* Logo */}
            <Logo small={!open} />

            {/* Links */}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

          {/* Logout Button */}
          <div className="mt-auto flex justify-end">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition cursor-pointer"
            >
              <IconLogout className="h-5 w-5 shrink-0" />
              {open && <span>Logout</span>}
            </button>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main content */}
      <div className="flex flex-1 overflow-y-scroll">{children}</div>
    </div>
  );
}

// Enhanced Logo Component with proper SuperAdmin branding
export const Logo = ({ small }: { small?: boolean }) => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className={cn("relative", small ? "h-6 w-6" : "h-10 w-10")}>
        {/* Main Shield Background */}
        <svg
          className="h-full w-full text-blue-600 dark:text-blue-400 drop-shadow-sm"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" />
        </svg>

        {/* Crown Icon Inside Shield */}
        <svg
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400 dark:text-yellow-300"
          width={small ? "12" : "16"}
          height={small ? "12" : "16"}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M5 16L3 8L5.5 10L8.5 4L12 7L15.5 4L18.5 10L21 8L19 16H5ZM19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
        </svg>

        {/* Subtle Glow Effect for Enhanced Version */}
        {!small && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full blur-sm -z-10"></div>
        )}
      </div>

      {/* Enhanced Text with Gradient */}
      {!small && (
        <div className="flex flex-col">
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            SuperAdmin
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
            Control Panel
          </span>
        </div>
      )}
    </a>
  );
};
