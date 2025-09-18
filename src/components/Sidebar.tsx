"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconLayoutDashboard,
  IconBrandYoutube,
  IconNotes,
  IconFileText,
  IconFileDescription,
  IconLogout,   
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { FileText, Sparkles, Users } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SideBar({ children }: { children: React.ReactNode }) {
  const links = [
    { label: "Dashboard", href: "/superadmin", icon: <IconLayoutDashboard className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" /> },
    { label: "Admins", href: "/admins", icon: <Users className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" /> }
  ];
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    signOut({ callbackUrl: "/sign-in" });
  };


  return (
    <div className={cn("mx-auto flex w-full flex-1 flex-col overflow-hidden border bg-gray-100 md:flex-row dark:bg-neutral-800", "h-[100vh]")}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto gap-y-5">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>

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

      <div className="flex flex-1 overflow-y-scroll">{children}</div>
    </div>
  );
}

export const Logo = () => {
  return (
    // <a
    //   href="#"
    //   className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    // >
    //   <Sparkles className="h-8 w-8 text-blue-600" />
    //   <motion.span
    //     initial={{ opacity: 0 }}
    //     animate={{ opacity: 1 }}
    //     className="font-semibold whitespace-pre text-black dark:text-white"
    //   >
    //     Image-Prompt Admin
    //   </motion.span>
    // </a>
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black dark:text-white"
    >
      <div className="relative">
        <svg 
          className="h-8 w-8 text-blue-600 dark:text-blue-400" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 2L2 7c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12L12 2z"/>
        </svg>
        <svg 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-white" 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5 3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1 0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z"/>
        </svg>
      </div>
      <span className="font-bold text-lg text-gray-900 dark:text-white">SuperAdmin</span>
    </a>
  );
};
export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      {/* <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" /> */}
      <FileText className="h-8 w-8 text-blue-600" />
    </a>
  );
};
