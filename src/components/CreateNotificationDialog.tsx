"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Bell, Shield, Send, RotateCcw, MessageSquare, Type } from 'lucide-react';

// Define proper TypeScript interfaces
interface NotificationData {
  title: string;
  message: string;
}

interface SessionUser {
  _id: string;
  email: string;
  role: 'admin' | 'superadmin' | string;
  name?: string;
}

const CreateNotificationDialog: React.FC = () => {
  // Get user session for role-based functionality
  const { data: session } = useSession();
  const user = session?.user as SessionUser;

  // State with proper TypeScript typing
  const [notificationData, setNotificationData] = useState<NotificationData>({
    title: "",
    message: ""
  });
  const [originalData, setOriginalData] = useState<NotificationData>({
    title: "",
    message: ""
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  // Role-based helper functions
  const isSuperAdmin = user?.role === 'superadmin';

  // Check if current form data differs from original (empty state)
  useEffect(() => {
    const changed = 
      notificationData.title !== originalData.title ||
      notificationData.message !== originalData.message;
    setHasChanges(changed);
  }, [notificationData, originalData]);

  // Handle input changes for text fields
  const handleInputChange = (field: keyof NotificationData, value: string) => {
    setNotificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset form to original values (empty)
  const handleReset = () => {
    setNotificationData(originalData);
  };

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (!open) {
      // Reset form state when closing if there are unsaved changes
      if (hasChanges) {
        setNotificationData(originalData);
      }
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can send notifications");
      return;
    }

    if (!notificationData.title.trim() || !notificationData.message.trim()) {
      toast.error("Title and message are required!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/fcm/send-to-all", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ 
          title: notificationData.title.trim(), 
          message: notificationData.message.trim(),
          click_action: "MAIN_ACTIVITY"
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Notification sent successfully!");
        
        // Reset form after successful send
        const emptyData: NotificationData = {
          title: "",
          message: ""
        };
        setNotificationData(emptyData);
        setOriginalData(emptyData);
        
        // Close dialog after successful send
        setIsOpen(false);
      } else {
        toast.error(result.message || "Failed to send notification");
      }
    } catch (error) {
      console.error("Send error:", error);
      toast.error("Something went wrong while sending notification!");
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user doesn't have permission
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300 transition-all duration-200 hover:scale-105 flex items-center gap-2"
        >
          <Bell className="w-4 h-4" />
          <span className="hidden sm:inline">Send Notification</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <span>Send Push Notification</span>
            {/* Super Admin indicator */}
            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3" />
              <span>Super Admin</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Send push notifications to all users. Notifications will be delivered instantly to all devices subscribed to the app.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Super Admin Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
              <Shield className="w-4 h-4" />
              <span>Super Admin Access</span>
            </div>
            <p className="text-blue-600 text-sm">
              You have full administrative privileges to send push notifications to all users across the platform.
            </p>
          </div>

          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
              Notification Title *
              <Type className="w-3 h-3 text-blue-500" />
            </Label>
            <Input
              id="title"
              type="text"
              value={notificationData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter notification title"
              className="w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500">
              The main heading that users will see in their notification panel.
            </p>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-semibold flex items-center gap-2">
              Notification Message *
              <MessageSquare className="w-3 h-3 text-blue-500" />
            </Label>
            <Textarea
              id="message"
              value={notificationData.message}
              onChange={(e : React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('message', e.target.value)}
              placeholder="Enter notification message"
              rows={4}
              className="w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500">
              The detailed message content that users will see in the notification.
            </p>
          </div>

          {/* Preview Section */}
          {(notificationData.title || notificationData.message) && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-700 font-medium mb-3">
                <Bell className="w-4 h-4" />
                <span>Preview</span>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                {notificationData.title && (
                  <div className="font-semibold text-gray-900 mb-1">
                    {notificationData.title}
                  </div>
                )}
                {notificationData.message && (
                  <div className="text-gray-600 text-sm">
                    {notificationData.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Changes Indicator */}
          {hasChanges && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Notification ready to send</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={loading || !hasChanges || !notificationData.title.trim() || !notificationData.message.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 transition-all duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
            
            {hasChanges && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
                className="transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="transition-all duration-200"
            >
              Cancel
            </Button>
          </div>

          {/* Footer Info */}
          <div className="text-xs text-gray-500 text-center pt-2">
            Notifications will be sent immediately to all users subscribed to the app
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotificationDialog;
