'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import Image from "next/image";
import { toast } from "sonner";
import { Copy, Loader, RefreshCw, CheckCircle, ArrowLeft, Trash2, Shield, Menu, X } from "lucide-react";
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
  categoryId: Category | string;
  createdAt: string;
  isOptimistic?: boolean;
  originalData?: Partial<Work>;
}

interface SessionUser {
  _id: string;
  email: string;
  role: 'admin' | 'superadmin';
  name?: string;
}

// Enhanced loading skeleton component with better responsive sizing
const WorkSkeleton = () => (
  <div className="bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-sm border border-gray-100 animate-pulse">
    <div className="bg-gray-200 rounded-lg sm:rounded-xl lg:rounded-2xl w-full h-40 sm:h-48 lg:h-56 mb-3 sm:mb-4 lg:mb-6"></div>
    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
      <div className="bg-gray-200 h-4 sm:h-5 rounded-md lg:rounded-lg w-3/4"></div>
      <div className="bg-gray-200 h-3 sm:h-4 rounded-md lg:rounded-lg w-1/2"></div>
      <div className="bg-gray-200 h-3 rounded-md lg:rounded-lg w-1/3"></div>
      <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
        <div className="bg-gray-200 h-8 sm:h-10 rounded-lg lg:rounded-xl flex-1"></div>
        <div className="bg-gray-200 h-8 sm:h-10 w-8 sm:w-10 rounded-lg lg:rounded-xl"></div>
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Real-time update state
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalWorks, setTotalWorks] = useState(0);

  // Refs to avoid stale closures and circular dependencies
  const categoriesRef = useRef(categories);
  const worksRef = useRef(works);
  const pageRef = useRef(page);

  // Update refs when state changes
  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    worksRef.current = works;
  }, [works]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  // Role-based helpers
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = user?.role === 'admin';

  // Helper function to get category name safely
  const getCategoryName = (categoryId: Category | string): string => {
    if (typeof categoryId === 'object' && categoryId?.name) {
      return categoryId.name;
    }
    if (typeof categoryId === 'string') {
      return categoriesRef.current[categoryId] || "Loading...";
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

  // [Previous helper functions remain the same - fetchMissingCategories, fetchWorks, etc.]
  const fetchMissingCategories = useCallback(async (worksData: Work[]) => {
    const currentCategories = categoriesRef.current;
    
    const missingCategoryIds = worksData
      .filter(work => typeof work.categoryId === 'string')
      .map(work => work.categoryId as string)
      .filter(id => id && !currentCategories[id]);

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

      if (Object.keys(newCategories).length > 0) {
        setCategories(prev => ({ ...prev, ...newCategories }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  }, []);

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
        
        if (silentUpdate) {
          const currentWorks = worksRef.current.filter(w => !w.isOptimistic);
          const hasChanges = JSON.stringify(worksData) !== JSON.stringify(currentWorks);
          
          if (!hasChanges) {
            return;
          }
        }

        setWorks(worksData);
        setPages(pagination?.pages || 1);
        setPage(pagination?.page || pageNum);
        setTotalWorks(pagination?.total || 0);
        
        fetchMissingCategories(worksData);
        
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
  }, [id, fetchMissingCategories]);

  const startPolling = useCallback(() => {
    if (!isSuperAdmin || pollingIntervalRef.current) return;

    console.log("🔄 Real-time polling started for SuperAdmin");
    setIsPolling(true);
    
    pollingIntervalRef.current = setInterval(() => {
      const currentPage = pageRef.current;
      fetchWorks(currentPage, false, true);
    }, 3000);
  }, [isSuperAdmin, fetchWorks]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
    console.log("⏹️ Real-time polling stopped");
  }, []);

  useEffect(() => {
    if (isSuperAdmin && !isPolling) {
      startPolling();
    } else if (!isSuperAdmin && isPolling) {
      stopPolling();
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isSuperAdmin, isPolling, startPolling, stopPolling]);

  useEffect(() => {
    if (id) {
      fetchWorks(1);
    }
  }, [id]);

  useEffect(() => {
    if (id && page > 1) {
      fetchWorks(page);
    }
  }, [page, fetchWorks]);

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

  const handleDeleteWork = async (workId: string) => {
    const originalWorks = works;
    const originalTotal = totalWorks;
    
    setWorks(prevWorks => prevWorks.filter(w => w._id !== workId));
    setTotalWorks(prev => prev - 1);
    
    try {
      const res = await axios.delete(`/api/delete-work/${workId}`);
      
      if (res.status === 202 || res.status === 200) {
        toast.success(res.data.message || "Work deleted successfully");
      } else {
        setWorks(originalWorks);
        setTotalWorks(originalTotal);
        toast.error(res.data.message || "Failed to delete work");
      }
    } catch (error: any) {
      setWorks(originalWorks);
      setTotalWorks(originalTotal);
      console.error("Delete work error:", error);
      toast.error(error.response?.data?.message || "Something went wrong while deleting");
    }
  };

  const handleWorkUpdated = async (workId: string, updatedData: Partial<Work>) => {
    let categoryInfo = updatedData.categoryId;
    if (typeof updatedData.categoryId === 'string') {
      const currentCategories = categoriesRef.current;
      if (!currentCategories[updatedData.categoryId]) {
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
          name: currentCategories[updatedData.categoryId]
        } as Category;
      }
    }

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

    setRecentlyUpdated(prev => new Set(prev).add(workId));
    
    setTimeout(() => {
      setRecentlyUpdated(prev => {
        const newSet = new Set(prev);
        newSet.delete(workId);
        return newSet;
      });
    }, 3000);

    toast.success(isSuperAdmin ? "Work updated with SuperAdmin privileges!" : "Work updated successfully!");
  };

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

  const togglePolling = useCallback(() => {
    if (isPolling) {
      stopPolling();
    } else {
      startPolling();
    }
  }, [isPolling, startPolling, stopPolling]);

  return (
    <div className="w-full min-h-screen h-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="w-full h-full py-4 sm:py-6 lg:py-10 px-3 sm:px-6 lg:px-8 xl:px-20">
        {/* Enhanced Mobile-First Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
          {/* Back Button and Title Section */}
          <div className="flex flex-col space-y-3 sm:space-y-0">
            {/* Back Button and Mobile Menu */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300 text-sm sm:text-base"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Back</span>
              </button>
              
              {/* Mobile Actions Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-lg text-gray-700 hover:bg-white transition-all duration-300"
              >
                {showMobileMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Title and Status */}
            <div>
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-slate-200 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent leading-tight">
                  Admin Works
                </h1>
                {isSuperAdmin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-purple-50 px-2 py-1 rounded-full">
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
                      <span className="text-xs sm:text-sm text-purple-700 font-medium">
                        SuperAdmin
                      </span>
                    </div>
                    {isPolling && (
                      <div className="flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="hidden xs:inline">Live Updates</span>
                        <span className="xs:hidden">Live</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 sm:mt-2">
                <span className="font-semibold">{totalWorks}</span> work{totalWorks !== 1 ? 's' : ''} found
                {isSuperAdmin && isPolling && (
                  <span className="text-green-600 ml-2 hidden sm:inline">• Live monitoring active</span>
                )}
              </p>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 lg:gap-3">
            {isSuperAdmin && (
              <button
                onClick={togglePolling}
                className={cn(
                  "flex items-center gap-2 px-3 lg:px-4 py-2 backdrop-blur-sm border rounded-xl transition-all duration-300 text-sm lg:text-base",
                  isPolling 
                    ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                    : "bg-white/80 border-white/20 text-gray-700 hover:bg-white hover:shadow-lg"
                )}
              >
                <div className={cn("w-2 h-2 rounded-full", isPolling ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
                <span className="hidden md:inline">{isPolling ? 'Stop Live Updates' : 'Start Live Updates'}</span>
                <span className="md:hidden">{isPolling ? 'Stop' : 'Start'}</span>
              </button>
            )}
            
            <button
              onClick={() => fetchWorks(page, true)}
              disabled={loading}
              className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl text-gray-700 hover:bg-white hover:shadow-lg transition-all duration-300 text-sm lg:text-base"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              <span className="hidden md:inline">Manual Refresh</span>
              <span className="md:hidden">Refresh</span>
            </button>
          </div>

          {/* Mobile Actions Menu */}
          {showMobileMenu && (
            <div className="sm:hidden bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-3 shadow-lg space-y-2">
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    togglePolling();
                    setShowMobileMenu(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 border rounded-lg transition-all duration-300 text-sm",
                    isPolling 
                      ? "bg-green-50 border-green-200 text-green-700" 
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", isPolling ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
                  <span>{isPolling ? 'Stop Live Updates' : 'Start Live Updates'}</span>
                </button>
              )}
              
              <button
                onClick={() => {
                  fetchWorks(page, true);
                  setShowMobileMenu(false);
                }}
                disabled={loading}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 transition-all duration-300 text-sm"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                <span>Manual Refresh</span>
              </button>
            </div>
          )}
        </div>

        {/* Content container with enhanced responsive grid */}
        <div className="w-full flex-1">
          {loading && works.length === 0 ? (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
              {[...Array(8)].map((_, i) => (
                <WorkSkeleton key={i} />
              ))}
            </div>
          ) : works.length === 0 ? (
            <div className="w-full min-h-[50vh] sm:min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4 sm:mb-6">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">No works found</h3>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-6 sm:mb-8 max-w-sm sm:max-w-md leading-relaxed">
                {isSuperAdmin 
                  ? "This admin hasn't created any works yet. As SuperAdmin, you have full access to view and modify all works." 
                  : "This admin hasn't created any works yet."
                }
              </p>
            </div>
          ) : (
            <>
              {/* Enhanced Responsive Works Grid */}
              <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 xl:gap-8">
                {works.map((work, index) => (
                  <div
                    key={work._id}
                    className={cn(
                      "group bg-white rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-sm border transition-all duration-500 hover:-translate-y-1 sm:hover:-translate-y-2 relative",
                      work.isOptimistic && "border-blue-400 shadow-blue-200/50",
                      recentlyUpdated.has(work._id) && "border-green-400 shadow-green-200/50 shadow-lg",
                      isSuperAdmin && "ring-1 ring-purple-100",
                      "border-gray-100 hover:shadow-xl hover:border-gray-200"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* SuperAdmin indicator */}
                    {isSuperAdmin && (
                      <div className="absolute top-1 left-1 sm:top-2 sm:left-2 z-10">
                        <div className="bg-purple-500 text-white p-1 rounded-full shadow-sm">
                          <Shield className="w-2 h-2 sm:w-3 sm:h-3" />
                        </div>
                      </div>
                    )}

                    {/* Status Indicators */}
                    {work.isOptimistic && (
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 z-10">
                        <div className="bg-blue-500 text-white p-1 rounded-full shadow-lg">
                          <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                        </div>
                      </div>
                    )}

                    {recentlyUpdated.has(work._id) && !work.isOptimistic && (
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 z-10">
                        <div className="bg-green-500 text-white p-1 rounded-full shadow-lg animate-bounce">
                          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        </div>
                      </div>
                    )}

                    {/* Enhanced Image Container */}
                    <div className="relative overflow-hidden rounded-lg sm:rounded-xl lg:rounded-2xl mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-br from-gray-50 to-gray-100">
                      <Image
                        src={work.imageUrl}
                        alt={work.prompt}
                        width={400}
                        height={300}
                        className="w-full h-32 xs:h-36 sm:h-40 lg:h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 475px) 100vw, (max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />

                      {/* Category Badge */}
                      <div className="absolute top-2 sm:top-3 lg:top-4 left-2 sm:left-3 lg:left-4">
                        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm border border-gray-100 max-w-[120px] sm:max-w-none truncate">
                          {getCategoryName(work.categoryId)}
                        </span>
                      </div>

                      {/* Enhanced Copy Button */}
                      <div className="absolute top-2 sm:top-3 lg:top-4 right-2 sm:right-3 lg:right-4 z-10">
                        <button
                          onClick={() => copyToClipboard(work.prompt, work._id)}
                          className={cn(
                            "p-1.5 sm:p-2 backdrop-blur-sm rounded-full shadow-sm border transition-all duration-200 hover:scale-105",
                            copiedId === work._id
                              ? "bg-green-100 border-green-200 text-green-600"
                              : "bg-white/95 border-gray-100 hover:bg-white text-gray-600"
                          )}
                          title="Copy prompt to clipboard"
                        >
                          {copiedId === work._id ? (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                          ) : (
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                        </button>
                      </div>

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Enhanced Content Section */}
                    <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                      {/* Responsive Prompt Text */}
                      <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 leading-tight sm:leading-normal group-hover:text-blue-600 transition-colors duration-300 line-clamp-2 sm:line-clamp-3">
                        {work.prompt}
                      </h3>
                      
                      {/* Date with update indicators */}
                      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-1 xs:gap-2">
                        <p className="text-xs sm:text-sm text-gray-500 font-medium">
                          <span className="hidden sm:inline">Created </span>
                          {new Date(work.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "2-digit",
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

                      {/* Enhanced Action Buttons */}
                      <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                        <UpdateDialog 
                          id={work._id.toString()} 
                          onUpdateSuccess={handleWorkUpdated}
                          onOptimisticSuccess={handleOptimisticSuccess}
                          onOptimisticError={handleOptimisticError}
                        />

                        <button
                          onClick={() => handleDeleteWork(work._id)}
                          className="p-2 sm:p-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg sm:rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center border border-red-100 hover:border-red-200"
                          title={isSuperAdmin ? "Delete work (SuperAdmin)" : "Delete work"}
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Subtle decoration */}
                    <div className={cn(
                      "absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br to-transparent rounded-br-xl sm:rounded-br-2xl lg:rounded-br-3xl pointer-events-none",
                      isSuperAdmin ? "from-purple-500/5" : "from-blue-500/5"
                    )}></div>
                  </div>
                ))}
              </div>

              {/* Enhanced Mobile-First Pagination */}
              {pages > 1 && (
                <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-8 sm:mt-12">
                  {/* Mobile Pagination Info */}
                  <div className="sm:hidden text-center">
                    <p className="text-sm text-gray-600">
                      Page <span className="font-semibold">{page}</span> of <span className="font-semibold">{pages}</span>
                    </p>
                  </div>

                  {/* Pagination Controls */}
                  <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-sm w-full sm:w-auto">
                    <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-2">
                      <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page <= 1 || loading}
                        className={cn(
                          "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-sm font-medium transition-all duration-200",
                          page <= 1 || loading
                            ? "text-gray-400 cursor-not-allowed opacity-50"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                        )}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="hidden xs:inline">Previous</span>
                        <span className="xs:hidden">Prev</span>
                      </button>

                      {/* Desktop Pagination Info */}
                      <div className="hidden sm:flex items-center gap-1 px-2 sm:px-4 py-2">
                        <span className="text-gray-600 font-medium text-sm sm:text-base">
                          Page {page} of {pages}
                        </span>
                        {(loading || isPolling) && <Loader className="w-4 h-4 animate-spin ml-2" />}
                      </div>

                      <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page >= pages || loading}
                        className={cn(
                          "flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-sm font-medium transition-all duration-200",
                          page >= pages || loading
                            ? "text-gray-400 cursor-not-allowed opacity-50"
                            : "text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer"
                        )}
                      >
                        <span className="hidden xs:inline">Next</span>
                        <span className="xs:inline">Next</span>
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
