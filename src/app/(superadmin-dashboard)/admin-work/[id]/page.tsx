'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import Image from "next/image";
import { toast } from "sonner";
import { Copy, Loader, RefreshCw, CheckCircle, ArrowLeft, Trash2, Shield } from "lucide-react";
import UpdateDialog from "@/components/UpdateDialog";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
}

interface Work {
  _id: string;
  prompt: string;
  imageUrl: string;
  categoryId: Category | string; // Can be either populated object or string ID
  createdAt: string;
  isOptimistic?: boolean;
  originalData?: Partial<Work>;
}

// User session type
interface SessionUser {
  _id: string;
  email: string;
  role: 'admin' | 'superadmin';
  name?: string;
}

// Loading skeleton component
const WorkSkeleton = () => (
  <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="bg-gray-200 rounded-2xl w-full h-56 mb-6"></div>
    <div className="space-y-4">
      <div className="bg-gray-200 h-5 rounded-lg w-3/4"></div>
      <div className="bg-gray-200 h-4 rounded-lg w-1/2"></div>
      <div className="bg-gray-200 h-3 rounded-lg w-1/3"></div>
      <div className="flex gap-3 mt-6">
        <div className="bg-gray-200 h-10 rounded-xl flex-1"></div>
        <div className="bg-gray-200 h-10 w-10 rounded-xl"></div>
      </div>
    </div>
  </div>
);

const AdminWorksPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user as SessionUser;

  const [works, setWorks] = useState<Work[]>([]);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentlyUpdated, setRecentlyUpdated] = useState<Set<string>>(new Set());
  
  // Real-time update state
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalWorks, setTotalWorks] = useState(0);

  // Role-based helpers
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  // Helper function to get category name safely
  const getCategoryName = (categoryId: Category | string): string => {
    if (typeof categoryId === 'object' && categoryId?.name) {
      return categoryId.name;
    }
    if (typeof categoryId === 'string') {
      return categories[categoryId] || "Loading...";
    }
    return "Uncategorized";
  };

  // Helper function to get category ID safely
  const getCategoryId = (categoryId: Category | string): string => {
    if (typeof categoryId === 'object' && categoryId?._id) {
      return categoryId._id;
    }
    if (typeof categoryId === 'string') {
      return categoryId;
    }
    return '';
  };

  // Fetch categories for works that only have category IDs
  const fetchMissingCategories = useCallback(async (works: Work[]) => {
    const missingCategoryIds = works
      .filter(work => typeof work.categoryId === 'string')
      .map(work => work.categoryId as string)
      .filter(id => id && !categories[id]);

    const uniqueIds = [...new Set(missingCategoryIds)];

    if (uniqueIds.length === 0) return;

    try {
      const categoryPromises = uniqueIds.map(async (categoryId) => {
        try {
          const res = await axios.get(`/api/fetch-category-by-id/${categoryId}`);
          if (res.data.success) {
            return { id: categoryId, name: res.data.data.name };
          }
        } catch (err) {
          console.error(`Error fetching category ${categoryId}:`, err);
        }
        return null;
      });

      const results = await Promise.all(categoryPromises);
      const newCategories = results.reduce((acc, result) => {
        if (result) {
          acc[result.id] = result.name;
        }
        return acc;
      }, {} as Record<string, string>);

      // Only update if we have new categories
      if (Object.keys(newCategories).length > 0) {
        setCategories(prev => ({ ...prev, ...newCategories }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, [categories]); // Fixed: Only depend on categories, not works

  // Enhanced fetchWorks with silent updates for real-time polling
  const fetchWorks = useCallback(async (pageNum: number, showToast: boolean = false, silentUpdate: boolean = false) => {
    if (!id) return;
    
    if (!silentUpdate) {
      setLoading(true);
    }
    
    try {
      const response = await axios.get(`/api/get-work-by-admin/${id}?page=${pageNum}`);
      const { data, pagination, success } = response.data;

      if (success) {
        const worksData = data || [];
        
        // For silent updates, compare with current state to avoid unnecessary updates
        if (silentUpdate) {
          // Simple comparison - you might want to implement a more sophisticated comparison
          const hasChanges = JSON.stringify(worksData) !== JSON.stringify(works.filter(w => !w.isOptimistic));
          if (!hasChanges) {
            return; // No changes, skip update
          }
        }

        setWorks(worksData);
        setPages(pagination?.pages || 1);
        setPage(pagination?.page || pageNum);
        setTotalWorks(pagination?.total || 0);
        
        // Fetch missing categories
        await fetchMissingCategories(worksData);
        
        if (showToast) {
          toast.success("Works refreshed successfully");
        }
      }
    } catch (error: any) {
      if (!silentUpdate) {
        console.error("Error fetching works:", error);
        toast.error("Failed to fetch works");
      }
    } finally {
      if (!silentUpdate) {
        setLoading(false);
      }
    }
  }, [id, fetchMissingCategories]); // Fixed: Removed works dependency to prevent infinite loop

  // Fixed: Separate polling functions with proper dependencies [web:502]
  const startPolling = useCallback(() => {
    if (!isSuperAdmin || pollingIntervalRef.current) return;

    console.log("🔄 Real-time polling started for SuperAdmin");
    setIsPolling(true);
    
    pollingIntervalRef.current = setInterval(() => {
      // Use current page value directly to avoid stale closure
      fetchWorks(page, false, true); // Silent update
    }, 3000); // Poll every 3 seconds
  }, [isSuperAdmin, fetchWorks, page]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    console.log("⏹️ Real-time polling stopped");
  }, []); // Fixed: Empty dependency array since it doesn't depend on anything

  // Setup polling for superadmin - Fixed with proper dependency management [web:499]
  useEffect(() => {
    if (isSuperAdmin && !isPolling) {
      startPolling();
    } else if (!isSuperAdmin && isPolling) {
      stopPolling();
    }

    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isSuperAdmin]); // Fixed: Only depend on isSuperAdmin, not the functions

  // Initial fetch - separate effect to avoid conflicts
  useEffect(() => {
    if (id) {
      fetchWorks(page);
    }
  }, [id, page]); // Fixed: Removed fetchWorks from dependencies to prevent loop

  // Enhanced copy to clipboard with fallback
  const copyToClipboard = async (text: string, workId: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopiedId(workId);
        toast.success("Prompt copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
        return;
      }
      
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedId(workId);
        toast.success("Prompt copied to clipboard!");
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      toast.error("Failed to copy to clipboard");
    }
  };

  // Optimistic delete work
  const handleDeleteWork = async (workId: string) => {
    // Store original data for rollback
    const originalWorks = works;
    const originalTotal = totalWorks;
    
    // Optimistic update: remove immediately
    setWorks(prevWorks => prevWorks.filter(w => w._id !== workId));
    setTotalWorks(prev => prev - 1);
    
    try {
      const res = await axios.delete(`/api/delete-work/${workId}`);
      
      if (res.status === 202 || res.status === 200) {
        toast.success(res.data.message || "Work deleted successfully");
        // For superadmin, the polling will handle the real-time update
      } else {
        // Revert optimistic update on failure
        setWorks(originalWorks);
        setTotalWorks(originalTotal);
        toast.error(res.data.message || "Failed to delete work");
      }
    } catch (error: any) {
      // Revert optimistic update on error
      setWorks(originalWorks);
      setTotalWorks(originalTotal);
      console.error("Delete work error:", error);
      toast.error(error.response?.data?.message || "Something went wrong while deleting");
    }
  };

  // Handle optimistic work update with proper category handling
  const handleWorkUpdated = async (workId: string, updatedData: Partial<Work>) => {
    // Handle category update properly
    let categoryInfo = updatedData.categoryId;
    if (typeof updatedData.categoryId === 'string') {
      // If we get a category ID, try to get the name
      if (!categories[updatedData.categoryId]) {
        try {
          const res = await axios.get(`/api/fetch-category-by-id/${updatedData.categoryId}`);
          if (res.data.success) {
            setCategories(prev => ({
              ...prev,
              [updatedData.categoryId as string]: res.data.data.name
            }));
            categoryInfo = {
              _id: updatedData.categoryId,
              name: res.data.data.name
            } as Category;
          }
        } catch (err) {
          console.error("Error fetching category:", err);
        }
      } else {
        categoryInfo = {
          _id: updatedData.categoryId,
          name: categories[updatedData.categoryId]
        } as Category;
      }
    }

    // Store original data and apply optimistic update immediately
    setWorks(prevWorks =>
      prevWorks.map(work =>
        work._id === workId
          ? {
              ...work,
              ...updatedData,
              categoryId: categoryInfo || work.categoryId,
              isOptimistic: true,
              originalData: {
                prompt: work.prompt,
                categoryId: work.categoryId,
                imageUrl: work.imageUrl
              }
            }
          : work
      )
    );

    // Add visual indicator
    setRecentlyUpdated(prev => new Set(prev).add(workId));
    
    // Remove visual indicator after 3 seconds
    setTimeout(() => {
      setRecentlyUpdated(prev => {
        const newSet = new Set(prev);
        newSet.delete(workId);
        return newSet;
      });
    }, 3000);

    // Show optimistic success message
    toast.success(isSuperAdmin ? "Work updated with SuperAdmin privileges!" : "Work updated successfully!");
  };

  // Handle optimistic update success confirmation
  const handleOptimisticSuccess = (workId: string) => {
    setWorks(prevWorks =>
      prevWorks.map(work =>
        work._id === workId
          ? {
              ...work,
              isOptimistic: false,
              originalData: undefined
            }
          : work
      )
    );
  };

  // Handle optimistic update failure (rollback)
  const handleOptimisticError = (workId: string, errorMessage: string) => {
    setWorks(prevWorks =>
      prevWorks.map(work =>
        work._id === workId && work.originalData
          ? {
              ...work,
              ...work.originalData,
              isOptimistic: false,
              originalData: undefined
            }
          : work
      )
    );

    // Remove from recently updated
    setRecentlyUpdated(prev => {
      const newSet = new Set(prev);
      newSet.delete(workId);
      return newSet;
    });

    toast.error(`Update failed: ${errorMessage}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pages || loading) return;
    setPage(newPage);
  };

  // Toggle polling function
  const togglePolling = useCallback(() => {
    if (isPolling) {
      stopPolling();
    } else {
      startPolling();
    }
  }, [isPolling, startPolling, stopPolling]);

  return (
    // Fixed: Full screen container with proper height and width [web:520][web:523]
    <div className="w-full min-h-screen h-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      {/* Fixed: Full width container with proper spacing */}
      <div className="w-full h-full py-10 px-6 md:px-20">
        {/* Enhanced Header with real-time status */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-slate-200 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Admin Works
                </h1>
                {isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <span className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                      SuperAdmin
                    </span>
                    {isPolling && (
                      <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live Updates</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {totalWorks} work{totalWorks !== 1 ? 's' : ''} found
                {isSuperAdmin && isPolling && (
                  <span className="text-green-600 ml-2">• Live monitoring active</span>
                )}
              </p>
            </div>
          </div>

          {/* Enhanced Refresh Button with polling control */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <button
                onClick={togglePolling}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 backdrop-blur-sm border rounded-xl transition-all duration-300",
                  isPolling 
                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                    : "bg-white/80 border-white/20 text-gray-700 hover:bg-white hover:shadow-lg"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", isPolling ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
                <span className="hidden sm:inline">{isPolling ? 'Stop Live Updates' : 'Start Live Updates'}</span>
              </button>
            )}
            
            <button
              onClick={() => fetchWorks(page, true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span className="hidden sm:inline">Manual Refresh</span>
            </button>
          </div>
        </div>

        {/* Fixed: Content container with full width and proper height */}
        <div className="w-full flex-1">
          {loading && works.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <WorkSkeleton key={i} />
              ))}
            </div>
          ) : works.length === 0 ? (
            // Fixed: Full width and centered empty state with proper height [web:523][web:524]
            <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No works found</h3>
              <p className="text-gray-600 mb-8 text-lg max-w-md">
                {isSuperAdmin 
                  ? "This admin hasn't created any works yet. As SuperAdmin, you have full access to view and modify all works." 
                  : "This admin hasn't created any works yet."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Fixed: Full width grid container */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {works.map((work, index) => (
                  <div
                    key={work._id}
                    className={cn(
                      "group bg-white rounded-3xl p-6 shadow-sm border transition-all duration-500 hover:-translate-y-2 relative",
                      work.isOptimistic && "border-blue-400 shadow-blue-200/50",
                      recentlyUpdated.has(work._id) && "border-green-400 shadow-green-200/50 shadow-lg",
                      isSuperAdmin && "ring-1 ring-purple-100",
                      "border-gray-100 hover:shadow-xl hover:border-gray-200"
                    )}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* SuperAdmin indicator */}
                    {isSuperAdmin && (
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-purple-500 text-white p-1 rounded-full shadow-sm">
                          <Shield className="w-3 h-3" />
                        </div>
                      </div>
                    )}

                    {/* Optimistic Update Indicator */}
                    {work.isOptimistic && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg">
                          <Loader className="w-4 h-4 animate-spin" />
                        </div>
                      </div>
                    )}

                    {/* Success Update Indicator */}
                    {recentlyUpdated.has(work._id) && !work.isOptimistic && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <div className="bg-green-500 text-white p-1 rounded-full shadow-lg animate-bounce">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                    )}

                    {/* Image Container */}
                    <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-gray-50 to-gray-100">
                      <Image
                        src={work.imageUrl}
                        alt={work.prompt}
                        width={400}
                        height={300}
                        className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Category Badge - Fixed with safe category name extraction */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm border border-gray-100">
                          {getCategoryName(work.categoryId)}
                        </span>
                      </div>

                      {/* Enhanced Copy Button */}
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={() => copyToClipboard(work.prompt, work._id)}
                          className={cn(
                            "p-2 backdrop-blur-sm rounded-full shadow-sm border transition-all duration-200 hover:scale-105",
                            copiedId === work._id
                              ? "bg-green-100 border-green-200 text-green-600"
                              : "bg-white/95 border-gray-100 hover:bg-white text-gray-600"
                          )}
                          title="Copy prompt to clipboard"
                        >
                          {copiedId === work._id ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                      {/* Full Prompt */}
                      <h3 className="text-lg font-bold text-gray-900 leading-7 group-hover:text-blue-600 transition-colors duration-300">
                        {work.prompt}
                      </h3>
                      
                      {/* Date with update indicators */}
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 font-medium">
                          Created {new Date(work.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        
                        {work.isOptimistic && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                            {isSuperAdmin ? "SuperAdmin Updating..." : "Updating..."}
                          </span>
                        )}
                        
                        {recentlyUpdated.has(work._id) && !work.isOptimistic && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            {isSuperAdmin ? "SuperAdmin Updated!" : "Updated!"}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-2">
                        {/* Update Dialog with optimistic callbacks */}
                        <UpdateDialog 
                          id={work._id.toString()} 
                          onUpdateSuccess={handleWorkUpdated}
                          onOptimisticSuccess={handleOptimisticSuccess}
                          onOptimisticError={handleOptimisticError}
                        />

                        {/* Enhanced Delete Button */}
                        <button
                          onClick={() => handleDeleteWork(work._id)}
                          className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center border border-red-100 hover:border-red-200"
                          title={isSuperAdmin ? "Delete work (SuperAdmin)" : "Delete work"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subtle decoration with SuperAdmin accent */}
                    <div className={cn(
                      "absolute top-0 right-0 w-24 h-24 bg-gradient-to-br to-transparent rounded-br-3xl pointer-events-none",
                      isSuperAdmin ? "from-purple-500/5" : "from-blue-500/5"
                    )}></div>
                  </div>
                ))}
              </div>

              {/* Enhanced Pagination Controls */}
              {pages > 1 && (
                <div className="w-full flex justify-center items-center gap-4 mt-12">
                  <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1 || loading}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                          page <= 1 || loading
                            ? "text-gray-400 cursor-not-allowed opacity-50"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                        )}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Previous</span>
                      </button>

                      <div className="flex items-center gap-1 px-4 py-2">
                        <span className="text-gray-600 font-medium">
                          Page {page} of {pages}
                        </span>
                        {(loading || isPolling) && <Loader className="w-4 h-4 animate-spin ml-2" />}
                      </div>

                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= pages || loading}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2",
                          page >= pages || loading
                            ? "text-gray-400 cursor-not-allowed opacity-50"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                        )}
                      >
                        <span>Next</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWorksPage;
