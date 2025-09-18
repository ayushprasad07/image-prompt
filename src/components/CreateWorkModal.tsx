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

export function CreateWorkModal() {
  const [image, setImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  // ✅ Fetch categories
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

    // ✅ Correct endpoint (no params in URL)
    const res = await fetch(`/api/create-work`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      toast.success(data.message || "Work created successfully");
      setImage(null);
      setPrompt("");
      setCategoryId("");
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
    <div className="flex items-center justify-center">
      <Modal>
        <ModalTrigger className="bg-black dark:bg-white dark:text-black text-white flex justify-center group/modal-btn relative overflow-hidden px-4 py-2 rounded-md">
          <span className="group-hover/modal-btn:translate-x-40 text-center transition duration-500">
            Create Prompt
          </span>
          <div className="-translate-x-40 group-hover/modal-btn:translate-x-0 flex items-center justify-center absolute inset-0 transition duration-500 text-white z-20">
            <span className="invert">📝</span>
          </div>
        </ModalTrigger>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <ModalBody>
            <ModalContent>
              <h4 className="text-lg md:text-2xl text-neutral-600 dark:text-neutral-100 font-bold text-center mb-8">
                Create your{" "}
                <span className="px-1 py-0.5 rounded-md bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 border border-gray-200">
                  Work
                </span>
              </h4>

              {/* Image Upload */}
              <LabelInputContainer className="mb-4">
                <Label htmlFor="image">Upload Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
              </LabelInputContainer>

              {/* Prompt */}
              <LabelInputContainer className="mb-4">
                <Label htmlFor="prompt">Prompt</Label>
                <Input
                  id="prompt"
                  placeholder="Enter your prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </LabelInputContainer>

              {/* Category Dropdown */}
              <LabelInputContainer className="mb-4">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="border border-gray-300 dark:border-neutral-700 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 dark:text-white"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </LabelInputContainer>
            </ModalContent>

            <ModalFooter className="gap-4">
              <button
                type="button"
                className="px-2 py-1 bg-gray-200 text-black dark:bg-black dark:border-black dark:text-white border border-gray-300 rounded-md text-sm w-28"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-black text-white dark:bg-white dark:text-black text-sm px-2 py-1 rounded-md border border-black w-28 disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </ModalFooter>
          </ModalBody>
        </form>
      </Modal>
    </div>
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
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
