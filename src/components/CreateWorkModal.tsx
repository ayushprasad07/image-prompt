"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalTrigger,
} from "./ui/animated-modal";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Sparkles } from "lucide-react";

// Add interface for props
interface CreateWorkModalProps {
  onWorkCreated?: () => void; // Callback function to refresh parent
}

export function CreateWorkModal({ onWorkCreated }: CreateWorkModalProps) {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // ✅ Fetch categories when component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/get-all-categories");
        const data = await res.json();
        if (res.ok) {
          setCategories(data.data || []);
        } else {
          toast.error(data.message || "Failed to load categories");
        }
      } catch (err) {
        console.error(err);
        toast.error("Error fetching categories");
      }
    };
    fetchCategories();
  }, []);

  // Handle image selection and preview
  const handleImageChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Please select a valid image file");
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageChange(file);
    }
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleImageChange(files[0]);
    }
  };

  // Remove image
  const removeImage = () => {
    setImage(null);
    setImagePreview("");
  };

  // Reset form function
  const resetForm = () => {
    setImage(null);
    setImagePreview("");
    setPrompt("");
    setCategoryId("");
  };

  return (
    <div className="flex items-center justify-center">
      <Modal>
        <ModalTrigger className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex justify-center group/modal-btn relative overflow-hidden px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500 font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Create Work
          </span>
          <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
            <Upload className="w-5 h-5" />
          </div>
        </ModalTrigger>

        <ModalBody className="max-w-2xl max-h-[90vh] overflow-hidden">
          <WorkForm 
            image={image}
            imagePreview={imagePreview}
            prompt={prompt}
            categoryId={categoryId}
            categories={categories}
            loading={loading}
            dragActive={dragActive}
            onImageChange={handleImageChange}
            onFileInputChange={handleFileInputChange}
            onDrag={handleDrag}
            onDrop={handleDrop}
            onRemoveImage={removeImage}
            onPromptChange={setPrompt}
            onCategoryChange={setCategoryId}
            onWorkCreated={onWorkCreated}
            onResetForm={resetForm}
            setLoading={setLoading}
          />
        </ModalBody>
      </Modal>
    </div>
  );
}

// Separate WorkForm component that has access to useModal
interface WorkFormProps {
  image: File | null;
  imagePreview: string;
  prompt: string;
  categoryId: string;
  categories: { _id: string; name: string }[];
  loading: boolean;
  dragActive: boolean;
  onImageChange: (file: File) => void;
  onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrag: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRemoveImage: () => void;
  onPromptChange: (prompt: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onWorkCreated?: () => void;
  onResetForm: () => void;
  setLoading: (loading: boolean) => void;
}

// This component is now inside the Modal context and can use useModal
function WorkForm({
  image,
  imagePreview,
  prompt,
  categoryId,
  categories,
  loading,
  dragActive,
  onImageChange,
  onFileInputChange,
  onDrag,
  onDrop,
  onRemoveImage,
  onPromptChange,
  onCategoryChange,
  onWorkCreated,
  onResetForm,
  setLoading
}: WorkFormProps) {
  // Now we can safely import and use useModal inside the Modal context
  const { useModal } = require("./ui/animated-modal");
  const { setOpen } = useModal();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!image || !prompt || !categoryId) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("image", image);
      formData.append("prompt", prompt);
      formData.append("categoryId", categoryId);

      const res = await fetch(`/api/create-work`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Work created successfully");
        
        // Reset form
        onResetForm();
        
        // Close modal
        setOpen(false);
        
        // Call parent callback to refresh the works list
        if (onWorkCreated) {
          onWorkCreated();
        }
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error creating work");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data" className="h-full flex overflow-y-scroll flex-col">
      {/* Scrollable Content Area with overflow-y-scroll */}
      <ModalContent className="flex-1 overflow-y-scroll px-6 py-4">
        {/* Enhanced Header */}
        <div className="text-center mb-6">
          <h4 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Create Your Masterpiece
          </h4>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Upload your image and add creative details
          </p>
        </div>

        {/* Image Preview Section */}
        {imagePreview && (
          <div className="mb-6 relative group">
            <div className="relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-md">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                <button
                  type="button"
                  onClick={onRemoveImage}
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-lg transform hover:scale-110"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1.5 rounded-full shadow-lg">
              <ImageIcon className="w-3 h-3" />
            </div>
          </div>
        )}

        {/* Enhanced Image Upload */}
        <LabelInputContainer className="mb-4">
          <Label htmlFor="image" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload Image
          </Label>
          <div
            className={cn(
              "relative border-2 border-dashed rounded-xl text-center transition-all duration-300 cursor-pointer group hover:border-blue-400",
              dragActive 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" 
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50",
              imagePreview 
                ? "border-green-400 bg-green-50 dark:bg-green-950/20 p-4"
                : "p-8"
            )}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            onClick={() => document.getElementById('image')?.click()}
          >
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={onFileInputChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {!imagePreview ? (
              <div className="space-y-3">
                <div className="mx-auto w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors">
                  <Upload className="w-full h-full" />
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-700 dark:text-gray-300 group-hover:text-blue-600">
                    Drag & drop your image here
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    or <span className="text-blue-600 font-medium">browse</span> to choose a file
                  </p>
                </div>
                <p className="text-xs text-gray-400">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto w-6 h-6 text-green-500">
                  <ImageIcon className="w-full h-full" />
                </div>
                <p className="text-sm font-medium text-green-600">
                  Image uploaded successfully!
                </p>
                <p className="text-xs text-gray-500">
                  Click to change image
                </p>
              </div>
            )}
          </div>
        </LabelInputContainer>

        {/* Enhanced Prompt Input */}
        <LabelInputContainer className="mb-4">
          <Label htmlFor="prompt" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Creative Prompt
          </Label>
          <div className="relative">
            <Input
              id="prompt"
              placeholder="Describe your creative vision..."
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value)}
              className="pl-4 pr-10 py-2.5 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
        </LabelInputContainer>

        {/* Enhanced Category Selection */}
        <LabelInputContainer className="mb-4">
          <Label htmlFor="category" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Category
          </Label>
          <div className="relative">
            <select
              id="category"
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full border-2 border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm bg-white dark:bg-gray-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">Choose a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </LabelInputContainer>
      </ModalContent>

      {/* Fixed Footer - Always visible */}
      <ModalFooter className="gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
        <ModalCancelButton />
        <button
          type="submit"
          disabled={loading || !image || !prompt || !categoryId}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2 shadow-md"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Creating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Create Work
            </>
          )}
        </button>
      </ModalFooter>
    </form>
  );
}

// Cancel button component that uses the modal context
function ModalCancelButton() {
  const { useModal } = require("./ui/animated-modal");
  const { setOpen } = useModal();
  
  return (
    <button
      type="button"
      onClick={() => setOpen(false)}
      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
    >
      Cancel
    </button>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-1", className)}>
      {children}
    </div>
  );
};
