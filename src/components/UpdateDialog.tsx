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
import { Edit, Shield, User } from 'lucide-react';

// Define proper TypeScript interfaces
interface Work {
  _id: string;
  prompt: string;
  categoryId: string;
  imageUrl: string;
}

interface Category {
  _id: string;
  name: string;
}

interface UpdateDialogProps {
  id: string;
  onUpdateSuccess?: (workId: string, updatedData: Partial<Work>) => void;
  onOptimisticSuccess?: (workId: string) => void;
  onOptimisticError?: (workId: string, error: string) => void;
}

// User role type for better type safety
type UserRole = 'admin' | 'superadmin' | string;

interface SessionUser {
  _id: string;
  email: string;
  role: UserRole;
  name?: string;
}

const UpdateDialog: React.FC<UpdateDialogProps> = ({ 
  id, 
  onUpdateSuccess, 
  onOptimisticSuccess, 
  onOptimisticError 
}) => {
  // Get user session for role-based functionality
  const { data: session } = useSession();
  const user = session?.user as SessionUser;

  // State with proper TypeScript typing
  const [work, setWork] = useState<Work | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [prompt, setPrompt] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [fetchingWork, setFetchingWork] = useState<boolean>(false);
  const [fetchingCategories, setFetchingCategories] = useState<boolean>(false);

  // Role-based helper functions
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';
  const canEdit = isAdmin || isSuperAdmin;

  // Get role-specific styling and text
  const getRoleInfo = () => {
    if (isSuperAdmin) {
      return {
        icon: Shield,
        label: 'Super Admin',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      };
    } else if (isAdmin) {
      return {
        icon: User,
        label: 'Admin',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }
    return {
      icon: User,
      label: 'User',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const roleInfo = getRoleInfo();

  // Fetch work details when dialog opens
  useEffect(() => {
    const fetchWorkDetails = async () => {
      if (!id || !isOpen || !canEdit) return;
      
      setFetchingWork(true);
      try {
        const response = await fetch(`/api/fetch-work-by-id/${id}`);
        const data = await response.json();
        
        if (data.success && data.work) {
          const workData = data.work as Work;
          setWork(workData);
          setPrompt(workData.prompt || "");
          setCategoryId(workData.categoryId || "");
          setPreview(workData.imageUrl || "");
        } else {
          toast.error("Failed to fetch work details");
        }
      } catch (error) {
        console.error("Error fetching work:", error);
        toast.error("Error loading work details");
      } finally {
        setFetchingWork(false);
      }
    };

    fetchWorkDetails();
  }, [id, isOpen, canEdit]);

  // Fetch categories when dialog opens
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen || categories.length > 0 || !canEdit) return;
      
      setFetchingCategories(true);
      try {
        const response = await fetch("/api/get-all-categories");
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          setCategories(data.data as Category[]);
        } else {
          toast.error("Failed to fetch categories");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Error loading categories");
      } finally {
        setFetchingCategories(false);
      }
    };

    fetchCategories();
  }, [isOpen, categories.length, canEdit]);

  // Handle image selection with proper typing
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    
    if (file) {
      // Clean up previous object URL if it exists
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (!open) {
      // Clean up object URL when closing
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
      
      // Reset form state when closing
      setWork(null);
      setPrompt("");
      setCategoryId("");
      setImage(null);
      setPreview("");
      setLoading(false);
    }
  };

  // Handle form submission with optimistic updates
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast.error("You don't have permission to edit this work");
      return;
    }
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);

    // Prepare optimistic update data
    const optimisticData: Partial<Work> = {
      prompt: prompt.trim(),
      categoryId: categoryId,
    };

    // If new image is selected, include the preview
    if (image) {
      optimisticData.imageUrl = preview;
    }

    // Trigger optimistic update immediately
    if (onUpdateSuccess) {
      onUpdateSuccess(id, optimisticData);
    }

    // Close dialog immediately for better UX
    setIsOpen(false);

    try {
      const formData = new FormData();
      formData.append("prompt", prompt.trim());
      formData.append("categoryId", categoryId);
      
      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`/api/update-work/${id}`, {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Confirm optimistic update was successful
        if (onOptimisticSuccess) {
          onOptimisticSuccess(id);
        }
        
        // Role-specific success message
        if (isSuperAdmin) {
          console.log("SuperAdmin successfully updated work:", id);
        } else {
          console.log("Admin successfully updated work:", id);
        }
      } else {
        // Rollback optimistic update
        if (onOptimisticError) {
          onOptimisticError(id, result.message || "Failed to update work");
        }
      }
    } catch (error) {
      console.error("Update error:", error);
      // Rollback optimistic update
      if (onOptimisticError) {
        onOptimisticError(id, "Something went wrong while updating");
      }
    } finally {
      setLoading(false);
    }
  };

  // Don't render if user doesn't have permission
  if (!canEdit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className={`flex-1 ${roleInfo.bgColor} hover:opacity-90 ${roleInfo.color} px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 border ${roleInfo.borderColor}`}>
          <Edit className="w-4 h-4" />
          <span className="hidden sm:inline">Update</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5" />
            <span>Update Work</span>
            {/* Role indicator */}
            <div className={`ml-auto flex items-center gap-1 px-2 py-1 ${roleInfo.bgColor} ${roleInfo.color} rounded-full text-xs font-medium`}>
              <roleInfo.icon className="w-3 h-3" />
              <span>{roleInfo.label}</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {isSuperAdmin 
              ? "As a Super Admin, you have full access to edit any work. Changes will be applied immediately." 
              : "Make changes to your work. Changes will be applied immediately."
            }
          </DialogDescription>
        </DialogHeader>

        {fetchingWork || fetchingCategories ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading...</span>
          </div>
        ) : work ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role-based header info */}
            {isSuperAdmin && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 text-purple-700 font-medium">
                  <Shield className="w-4 h-4" />
                  <span>Super Admin Access</span>
                </div>
                <p className="text-purple-600 mt-1">
                  You have administrative privileges to edit any work in the system.
                </p>
              </div>
            )}

            {/* Prompt Field */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-semibold flex items-center gap-2">
                Prompt <span className="text-red-500">*</span>
                {isSuperAdmin && <Shield className="w-3 h-3 text-purple-500" />}
              </Label>
              <Input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your creative prompt..."
                required
                className="w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-semibold flex items-center gap-2">
                Category <span className="text-red-500">*</span>
                {isSuperAdmin && <Shield className="w-3 h-3 text-purple-500" />}
              </Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                required
                disabled={loading}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {isSuperAdmin && (
                <p className="text-xs text-purple-600">
                  As Super Admin, you can assign works to any category.
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label htmlFor="image" className="text-sm font-semibold flex items-center gap-2">
                Update Image (optional)
                {isSuperAdmin && <Shield className="w-3 h-3 text-purple-500" />}
              </Label>
              <Input
                id="image"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all duration-200"
                disabled={loading}
              />
              
              {/* Image Preview */}
              {preview && (
                <div className="relative group">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-40 w-40 rounded-lg object-cover border-2 border-gray-200 shadow-sm transition-all duration-200 group-hover:shadow-md"
                  />
                  {isSuperAdmin && (
                    <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full">
                      <Shield className="w-3 h-3" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading || !prompt.trim() || !categoryId}
                className={`flex-1 transition-all duration-200 ${
                  isSuperAdmin 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    {isSuperAdmin ? 'Update as Super Admin' : 'Save Changes'}
                  </>
                )}
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

            {/* Role-based footer info */}
            <div className="text-xs text-gray-500 text-center">
              {isSuperAdmin 
                ? "Changes will be logged with Super Admin privileges"
                : "Changes will be saved to your admin account"
              }
            </div>
          </form>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-4">Failed to load work details</p>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UpdateDialog;
