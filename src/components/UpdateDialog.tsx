"use client";
import React, { useEffect, useState } from "react";
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
  onUpdateSuccess?: () => void;
}

const UpdateDialog: React.FC<UpdateDialogProps> = ({ id, onUpdateSuccess }) => {
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

  // Fetch work details when dialog opens
  useEffect(() => {
    const fetchWorkDetails = async () => {
      if (!id || !isOpen) return;
      
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
  }, [id, isOpen]);

  // Fetch categories when dialog opens
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isOpen) return;
      
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
  }, [isOpen]);

  // Handle image selection with proper typing
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImage(file);
    
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      
      // Clean up object URL when component unmounts
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (!open) {
      // Reset form state when closing
      setWork(null);
      setPrompt("");
      setCategoryId("");
      setImage(null);
      setPreview("");
      setLoading(false);
    }
  };

  // Handle form submission with proper error handling
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }
    
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);

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
        toast.success(result.message || "Work updated successfully!");
        setIsOpen(false);
        
        // Call parent callback to refresh data
        if (onUpdateSuccess) {
          onUpdateSuccess();
        }
      } else {
        toast.error(result.message || "Failed to update work");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Something went wrong while updating");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 border border-blue-100 hover:border-blue-200">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Update
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Work</DialogTitle>
          <DialogDescription>
            Make changes to your work. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        {fetchingWork || fetchingCategories ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm text-gray-600">Loading...</span>
          </div>
        ) : work ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prompt Field */}
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-medium">
                Prompt <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt..."
                required
                className="w-full"
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Category <span className="text-red-500">*</span>
              </Label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="image" className="text-sm font-medium">
                Update Image (optional)
              </Label>
              <Input
                id="image"
                type="file"
                onChange={handleImageChange}
                accept="image/*"
                className="w-full"
              />
              
              {/* Image Preview */}
              {preview && (
                <div className="mt-2">
                  <img
                    src={preview}
                    alt="Preview"
                    className="h-32 w-32 rounded-md object-cover border border-gray-200"
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-600">Failed to load work details</p>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="mt-4"
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
