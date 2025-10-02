"use client";
import React, { useState, useEffect, useRef } from "react";
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
import { Bell, Shield, Send, RotateCcw, MessageSquare, Type, Image as ImageIcon } from "lucide-react";

interface NotificationData {
  title: string;
  message: string;
  // click_action is hardcoded; not exposed in UI
}

interface SessionUser {
  _id: string;
  email: string;
  role: "admin" | "superadmin" | string;
  name?: string;
}

const CreateNotificationDialog: React.FC = () => {
  const { data: session } = useSession();
  const user = session?.user as SessionUser;

  const isSuperAdmin = user?.role === "superadmin";

  const [notificationData, setNotificationData] = useState<NotificationData>({
    title: "",
    message: "",
  });
  const [originalData, setOriginalData] = useState<NotificationData>({
    title: "",
    message: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const changed =
      notificationData.title !== originalData.title ||
      notificationData.message !== originalData.message ||
      imageFile !== null;
    setHasChanges(changed);
  }, [notificationData, originalData, imageFile]);

  const handleInputChange = (field: keyof NotificationData, value: string) => {
    setNotificationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleReset = () => {
    setNotificationData(originalData);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      if (hasChanges) {
        handleReset();
      }
      setLoading(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isSuperAdmin) {
      toast.error("Only Super Admin can send notifications");
      return;
    }

    const title = notificationData.title.trim();
    const message = notificationData.message.trim();
    const click_action = "MAIN_ACTIVITY"; // hardcoded

    if (!title || !message) {
      toast.error("Title and message are required!");
      return;
    }

    setLoading(true);

    try {
      const form = new FormData();
      form.append("title", title);
      form.append("message", message);
      form.append("click_action", click_action); // always present
      if (imageFile) {
        form.append("image", imageFile);
      }

      const response = await fetch("/api/send-to-all", {
        method: "POST",
        body: form,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("Notification sent successfully!");

        const emptyData: NotificationData = { title: "", message: "" };
        setNotificationData(emptyData);
        setOriginalData(emptyData);
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";

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

      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <span>Send Push Notification</span>
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 font-medium mb-2">
              <Shield className="w-4 h-4" />
              <span>Super Admin Access</span>
            </div>
            <p className="text-blue-600 text-sm">
              You have full administrative privileges to send push notifications to all users across the platform.
            </p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
              Notification Title *
              <Type className="w-3 h-3 text-blue-500" />
            </Label>
            <Input
              id="title"
              type="text"
              value={notificationData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Enter notification title"
              className="w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              required
            />
            <p className="text-xs text-gray-500">
              The main heading that users will see in their notification panel.
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-semibold flex items-center gap-2">
              Notification Message *
              <MessageSquare className="w-3 h-3 text-blue-500" />
            </Label>
            <Textarea
              id="message"
              value={notificationData.message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleInputChange("message", e.target.value)
              }
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

          {/* Image Upload (optional) */}
          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm font-semibold flex items-center gap-2">
              Optional Image
              <ImageIcon className="w-3 h-3 text-blue-500" />
            </Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
              disabled={loading}
            />
            {imagePreview && (
              <div className="mt-2 border rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="max-h-48 w-full object-cover" />
              </div>
            )}
            <p className="text-xs text-gray-500">
              If provided, the image will be uploaded to Cloudinary and attached to the notification.
            </p>
          </div>

          {hasChanges && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Notification ready to send</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={loading || !notificationData.title.trim() || !notificationData.message.trim()}
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

            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading || (!hasChanges && !imageFile)}
              className="transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear
            </Button>

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

          <div className="text-xs text-gray-500 text-center pt-2">
            Notifications will be sent immediately to all users subscribed to the app
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNotificationDialog;
