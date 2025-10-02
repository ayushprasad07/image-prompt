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
import { Shield, Save, RotateCcw, Link2, Loader2, Lock } from "lucide-react";

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
  termsAdnConditions: string;
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

  const [policyUrl, setPolicyUrl] = useState<string>("");
  const [termsUrl, setTermsUrl] = useState<string>("");

  const [originalPolicyUrl, setOriginalPolicyUrl] = useState<string>("");
  const [originalTermsUrl, setOriginalTermsUrl] = useState<string>("");

  const hasChanges = useMemo(
    () =>
      policyUrl.trim() !== originalPolicyUrl.trim() ||
      termsUrl.trim() !== originalTermsUrl.trim(),
    [policyUrl, originalPolicyUrl, termsUrl, originalTermsUrl]
  );

  useEffect(() => {
    const loadPolicy = async () => {
      if (!isOpen || !isSuperAdmin) return;
      setFetching(true);
      try {
        const res = await fetch("/api/get-privacy-policy", { method: "GET", cache: "no-store" });
        if (!res.ok) {
          setPolicyUrl("");
          setTermsUrl("");
          setOriginalPolicyUrl("");
          setOriginalTermsUrl("");
          return;
        }
        const data = (await res.json()) as { success: boolean; data?: PrivacyDto | null };
        if (data?.success && data.data) {
          setPolicyUrl(data.data.url || "");
          setTermsUrl(data.data.termsAdnConditions || "");
          setOriginalPolicyUrl(data.data.url || "");
          setOriginalTermsUrl(data.data.termsAdnConditions || "");
        } else {
          setPolicyUrl("");
          setTermsUrl("");
          setOriginalPolicyUrl("");
          setOriginalTermsUrl("");
        }
      } catch (err) {
        console.error("Fetch privacy policy failed", err);
        toast.error("Failed to load current policy and terms URLs");
        setPolicyUrl("");
        setTermsUrl("");
        setOriginalPolicyUrl("");
        setOriginalTermsUrl("");
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
      if (hasChanges) {
        setPolicyUrl(originalPolicyUrl);
        setTermsUrl(originalTermsUrl);
      }
    }
  };

  const validateHttpUrl = (value: string) => {
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
      toast.error("Only Super Admin can update");
      return;
    }
    if (!hasChanges) {
      toast.info("No changes to save");
      return;
    }

    const urlErr = validateHttpUrl(policyUrl);
    if (urlErr) {
      toast.error(`Privacy Policy URL: ${urlErr}`);
      return;
    }
    const termsErr = validateHttpUrl(termsUrl);
    if (termsErr) {
      toast.error(`Terms & Conditions URL: ${termsErr}`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/create-privacy-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: policyUrl.trim(),
          termsAdnConditions: termsUrl.trim(),
        }),
      });
      const result = await res.json();
      if (res.ok && result?.success) {
        toast.success("Privacy & Terms URLs updated");
        setOriginalPolicyUrl(policyUrl.trim());
        setOriginalTermsUrl(termsUrl.trim());
        setIsOpen(false);
      } else {
        toast.error(result?.message || "Failed to update URLs");
      }
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Something went wrong while updating");
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
          <span className="hidden sm:inline">Privacy & Terms</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <span>Privacy & Terms</span>
            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3" />
              <span>Super Admin</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Update the Privacy Policy and Terms & Conditions URLs. Stored as a single upserted record and cached server-side.
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-10 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading current URLs...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Privacy Policy URL */}
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
                value={policyUrl}
                onChange={(e) => setPolicyUrl(e.target.value)}
                autoComplete="off"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Must be an http/https link to the live Privacy Policy page.
              </p>
            </div>

            {/* Terms & Conditions URL */}
            <div className="space-y-2">
              <Label htmlFor="termsUrl" className="text-sm font-semibold flex items-center gap-2">
                Terms & Conditions URL
                <Link2 className="w-3 h-3 text-indigo-500" />
              </Label>
              <Input
                id="termsUrl"
                type="url"
                inputMode="url"
                placeholder="https://example.com/terms"
                value={termsUrl}
                onChange={(e) => setTermsUrl(e.target.value)}
                autoComplete="off"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-indigo-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Must be an http/https link to the live Terms & Conditions page.
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
                  onClick={() => {
                    setPolicyUrl(originalPolicyUrl);
                    setTermsUrl(originalTermsUrl);
                  }}
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
