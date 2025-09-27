"use client";
import React, { useEffect, useState } from "react";
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
import { Settings, Shield, Save, RotateCcw, Hash, Clock, Smartphone } from 'lucide-react';


// Define proper TypeScript interfaces to match the MongoDB model
interface AdKeys {
  _id?: string;
  intestrialAd: string;
  bannerAd: string;
  rewardedAd: string;
  nativeAd: string; // NEW: Added nativeAd field
  adCounter: number;
  adShowAfter: number;
}


interface SessionUser {
  _id: string;
  email: string;
  role: 'admin' | 'superadmin' | string;
  name?: string;
}


const SettingsDialog: React.FC = () => {
  // Get user session for role-based functionality
  const { data: session } = useSession();
  const user = session?.user as SessionUser;


  // State with proper TypeScript typing
  const [adKeys, setAdKeys] = useState<AdKeys>({
    intestrialAd: "",
    bannerAd: "",
    rewardedAd: "",
    nativeAd: "", // NEW: Added nativeAd field
    adCounter: 0,
    adShowAfter: 0
  });
  const [originalKeys, setOriginalKeys] = useState<AdKeys>({
    intestrialAd: "",
    bannerAd: "",
    rewardedAd: "",
    nativeAd: "", // NEW: Added nativeAd field
    adCounter: 0,
    adShowAfter: 0
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fetchingKeys, setFetchingKeys] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);


  // Role-based helper functions
  const isSuperAdmin = user?.role === 'superadmin';


  // Check if current form data differs from original
  useEffect(() => {
    const changed = 
      adKeys.intestrialAd !== originalKeys.intestrialAd ||
      adKeys.bannerAd !== originalKeys.bannerAd ||
      adKeys.rewardedAd !== originalKeys.rewardedAd ||
      adKeys.nativeAd !== originalKeys.nativeAd || // NEW: Added nativeAd to change detection
      adKeys.adCounter !== originalKeys.adCounter ||
      adKeys.adShowAfter !== originalKeys.adShowAfter;
    setHasChanges(changed);
  }, [adKeys, originalKeys]);


  // Fetch advertisement keys when dialog opens
  useEffect(() => {
    const fetchAdKeys = async () => {
      if (!isOpen || !isSuperAdmin) return;
      
      setFetchingKeys(true);
      try {
        const response = await fetch('/api/get-keys');
        const data = await response.json();
        
        if (data.success && data.data) {
          const keysData: AdKeys = {
            intestrialAd: data.data.intestrialAd || "",
            bannerAd: data.data.bannerAd || "",
            rewardedAd: data.data.rewardedAd || "",
            nativeAd: data.data.nativeAd || "", // NEW: Added nativeAd to fetch logic
            adCounter: Number(data.data.adCounter) || 0,
            adShowAfter: Number(data.data.adShowAfter) || 0
          };
          setAdKeys(keysData);
          setOriginalKeys(keysData);
        } else {
          // If no keys found, set empty values
          const emptyKeys: AdKeys = {
            intestrialAd: "",
            bannerAd: "",
            rewardedAd: "",
            nativeAd: "", // NEW: Added nativeAd to empty state
            adCounter: 0,
            adShowAfter: 0
          };
          setAdKeys(emptyKeys);
          setOriginalKeys(emptyKeys);
        }
      } catch (error) {
        console.error("Error fetching advertisement keys:", error);
        toast.error("Failed to load advertisement settings");
      } finally {
        setFetchingKeys(false);
      }
    };


    fetchAdKeys();
  }, [isOpen, isSuperAdmin]);


  // Handle input changes for string fields - Updated to include nativeAd
  const handleInputChange = (field: keyof Omit<AdKeys, 'adCounter' | 'adShowAfter'>, value: string) => {
    setAdKeys(prev => ({
      ...prev,
      [field]: value
    }));
  };


  // Handle number input changes
  const handleNumberChange = (field: 'adCounter' | 'adShowAfter', value: string) => {
    const numericValue = value === '' ? 0 : parseFloat(value) || 0;
    setAdKeys(prev => ({
      ...prev,
      [field]: numericValue
    }));
  };


  // Reset form to original values
  const handleReset = () => {
    setAdKeys(originalKeys);
  };


  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (!open) {
      // Reset form state when closing if there are unsaved changes
      if (hasChanges) {
        setAdKeys(originalKeys);
      }
      setLoading(false);
    }
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isSuperAdmin) {
      toast.error("Only Super Admin can update advertisement settings");
      return;
    }


    if (!hasChanges) {
      toast.info("No changes to save");
      return;
    }


    setLoading(true);


    try {
      const updateData = {
        intestrialAd: adKeys.intestrialAd.trim(),
        bannerAd: adKeys.bannerAd.trim(),
        rewardedAd: adKeys.rewardedAd.trim(),
        nativeAd: adKeys.nativeAd.trim(), // NEW: Added nativeAd to update data
        adCounter: adKeys.adCounter,
        adShowAfter: adKeys.adShowAfter
      };


      const response = await fetch('/api/create-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });


      const result = await response.json();


      if (response.ok && result.success) {
        toast.success("Advertisement settings updated successfully");
        
        // Update original keys to reflect the new saved state
        setOriginalKeys(adKeys);
        
        // Close dialog after successful update
        setIsOpen(false);
      } else {
        toast.error(result.message || "Failed to update advertisement settings");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Something went wrong while updating settings");
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
          className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200 hover:border-purple-300 transition-all duration-200 hover:scale-105 flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Ad Settings</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span>Ad Management</span>
            {/* Super Admin indicator */}
            <div className="ml-auto flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3" />
              <span>Super Admin</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Manage advertisement unit IDs, counter settings, and timing controls for your application. These settings control ads and display frequency across the platform.
          </DialogDescription>
        </DialogHeader>


        {fetchingKeys ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading advertisement settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Super Admin Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-purple-700 font-medium mb-2">
                <Shield className="w-4 h-4" />
                <span>Super Admin Access</span>
              </div>
              <p className="text-purple-600 text-sm">
                You have full administrative privileges to manage advertisement settings and display timing for the entire platform.
              </p>
            </div>


            {/* Ad Counter Field */}
            <div className="space-y-2">
              <Label htmlFor="adCounter" className="text-sm font-semibold flex items-center gap-2">
                Ad Counter
                <Hash className="w-3 h-3 text-purple-500" />
              </Label>
              <Input
                id="adCounter"
                type="number"
                value={adKeys.adCounter || ""}
                onChange={(e) => handleNumberChange('adCounter', e.target.value)}
                placeholder="Enter ad counter value"
                min="0"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Controls how many ads are shown before displaying the next ad in rotation.
              </p>
            </div>


            {/* Ad Show After Field */}
            <div className="space-y-2">
              <Label htmlFor="adShowAfter" className="text-sm font-semibold flex items-center gap-2">
                Ad Show After
                <Clock className="w-3 h-3 text-purple-500" />
              </Label>
              <Input
                id="adShowAfter"
                type="number"
                value={adKeys.adShowAfter || ""}
                onChange={(e) => handleNumberChange('adShowAfter', e.target.value)}
                placeholder="Enter ad show after value"
                min="0"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Number of interactions or time delay before showing ads to users.
              </p>
            </div>


            {/* Interstitial Ad Field */}
            <div className="space-y-2">
              <Label htmlFor="intestrialAd" className="text-sm font-semibold flex items-center gap-2">
                Interstitial Ad ID
                <Shield className="w-3 h-3 text-purple-500" />
              </Label>
              <Input
                id="intestrialAd"
                type="text"
                value={adKeys.intestrialAd}
                onChange={(e) => handleInputChange('intestrialAd', e.target.value)}
                placeholder="Enter interstitial ad unit ID"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Full-screen ads that appear at natural transition points in your app.
              </p>
            </div>


            {/* Banner Ad Field */}
            <div className="space-y-2">
              <Label htmlFor="bannerAd" className="text-sm font-semibold flex items-center gap-2">
                Banner Ad ID
                <Shield className="w-3 h-3 text-purple-500" />
              </Label>
              <Input
                id="bannerAd"
                type="text"
                value={adKeys.bannerAd}
                onChange={(e) => handleInputChange('bannerAd', e.target.value)}
                placeholder="Enter banner ad unit ID"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Rectangular ads that appear at the top or bottom of the screen.
              </p>
            </div>


            {/* Rewarded Ad Field */}
            <div className="space-y-2">
              <Label htmlFor="rewardedAd" className="text-sm font-semibold flex items-center gap-2">
                Rewarded Ad ID
                <Shield className="w-3 h-3 text-purple-500" />
              </Label>
              <Input
                id="rewardedAd"
                type="text"
                value={adKeys.rewardedAd}
                onChange={(e) => handleInputChange('rewardedAd', e.target.value)}
                placeholder="Enter rewarded ad unit ID"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Video ads that users can watch to earn rewards or bonuses.
              </p>
            </div>


            {/* Native Ad Field - NEW */}
            <div className="space-y-2">
              <Label htmlFor="nativeAd" className="text-sm font-semibold flex items-center gap-2">
                Native Ad ID
                <Smartphone className="w-3 h-3 text-purple-500" />
              </Label>
              <Input
                id="nativeAd"
                type="text"
                value={adKeys.nativeAd}
                onChange={(e) => handleInputChange('nativeAd', e.target.value)}
                placeholder="Enter native ad unit ID"
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-purple-500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                Native ads that blend seamlessly with your app's content and design.
              </p>
            </div>


            {/* Changes Indicator */}
            {hasChanges && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-amber-700 text-sm font-medium">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <span>You have unsaved changes</span>
                </div>
              </div>
            )}


            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading || !hasChanges}
                className="flex-1 bg-purple-600 hover:bg-purple-700 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
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


            {/* Footer Info */}
            <div className="text-xs text-gray-500 text-center pt-2">
              Changes will be applied immediately across the platform and cached for 60 seconds
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};


export default SettingsDialog;
