"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import { Shield, Save, RotateCcw, Link2, Loader2, Lock /* or ShieldCheck */ } from "lucide-react";

type Role = "admin" | "superadmin" | string;
interface SessionUser {
  _id: string;
  email: string;
  role: Role;
  name?: string;
}

interface PrivacyDto {
  _id?: string;
  url: string;
  createdAt?: string;
}

type GivePolicyProps = {
  triggerClassName?: string;
  defaultOpen?: boolean;
};

const GivePolicy: React.FC<GivePolicyProps> = ({ triggerClassName, defaultOpen = false }) => {
  const { data: session, status } = useSession();
  const user = session?.user as SessionUser | undefined;
  const isSuperAdmin = user?.role === "superadmin";

  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);

  const [url, setUrl] = useState<string>("");
  const [originalUrl, setOriginalUrl] = useState<string>("");

  const hasChanges = useMemo(() => url.trim() !== originalUrl.trim(), [url, originalUrl]);

  useEffect(() => {
    const loadPolicy = async () => {
      if (!isOpen || !isSuperAdmin) return;
      setFetching(true);
      try {
        const res = await fetch("/api/get-privacy-policy", { method: "GET", cache: "no-store" });
        if (!res.ok) {
          setUrl("");
          setOriginalUrl("");
          return;
        }
        const data = (await res.json()) as { success: boolean; data?: PrivacyDto | null };
        if (data?.success && data.data?.url) {
          setUrl(data.data.url);
          setOriginalUrl(data.data.url);
        } else {
          setUrl("");
          setOriginalUrl("");
        }
      } catch (err) {
        console.error("Fetch privacy policy failed", err);
        toast.error("Failed to load current privacy policy");
        setUrl("");
        setOriginalUrl("");
      } finally {
        setFetching(false);
      }
    };
    loadPolicy();
  }, [isOpen, isSuperAdmin]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setLoading(false);
      if (hasChanges) setUrl(originalUrl);
    }
  };

  const validateUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "URL is required";
    try {
      const u = new URL(trimmed);
      if (!/^https?:$/.test(u.protocol)) return "Only http/https URLs are allowed";
    } catch {
      return "Enter a valid URL";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can update the privacy policy");
      return;
    }
    if (!hasChanges) {
      toast.info("No changes to save");
      return;
    }
    const errMsg = validateUrl(url);
    if (errMsg) {
      toast.error(errMsg);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/create-privacy-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const result = await res.json();
      if (res.ok && result?.success) {
        toast.success("Privacy Policy updated successfully");
        setOriginalUrl(url.trim());
        setIsOpen(false);
      } else {
        toast.error(result?.message || "Failed to update privacy policy");
      }
    } catch (err) {
      console.error("Privacy policy update error:", err);
      toast.error("Something went wrong while updating privacy policy");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;
  if (!isSuperAdmin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={
            triggerClassName ??
            "bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-200 hover:border-indigo-300 transition-all duration-200 hover:scale-105 flex items-center gap-2"
          }
        >
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Privacy Policy</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span>Give Policy</span>
            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3" />
              <span>Super Admin</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Set or update the platform’s Privacy Policy URL. This is stored as a single upserted record and cached server-side.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-10 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading current policy...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="policyUrl" className="text-sm font-semibold flex items-center gap-2">
                Privacy Policy URL
                <Link2 className="w-3 h-3 text-indigo-500" />
              </Label>
              <Input
                id="policyUrl"
                type="url"
                inputMode="url"
                placeholder="https://example.com/privacy"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                autoComplete="off"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Provide an http/https link to the live Privacy Policy page.
              </p>
            </div>

            {hasChanges && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  <span>Unsaved changes</span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading || !hasChanges}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </>
                )}
              </Button>

              {hasChanges && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setUrl(originalUrl)}
                  disabled={loading}
                  className="transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
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

            <div className="text-xs text-gray-500 text-center pt-2">
              Changes take effect immediately; server cache is cleared on update.
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GivePolicy;
