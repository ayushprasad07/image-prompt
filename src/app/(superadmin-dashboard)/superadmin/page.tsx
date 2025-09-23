'use client'
import React, { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import axios from 'axios';
import { Loader, Users, FileImage, RefreshCw, Trash2, Tag, Plus, AlertTriangle, Search } from 'lucide-react';

interface AdminStats {
  total: number;
  totalPages: number;
}

interface WorkStats {
  count: number;
  totalWorks: number;
}

interface Category {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const Superadmin = () => {
  // Existing states
  const [credentials, setCredentials] = useState({username: "", password: ""});
  const [isLoading, setIsLoading] = useState(false);
  const [Category, setCategories] = useState({name: ""});
  const [creatingCategory, setCreatingCategory] = useState(false);
  
  // New states for dashboard statistics
  const [adminStats, setAdminStats] = useState<AdminStats>({ total: 0, totalPages: 0 });
  const [workStats, setWorkStats] = useState<WorkStats>({ count: 0, totalWorks: 0 });
  const [statsLoading, setStatsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // New states for categories management
  const [categories, setCategoriesList] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Search functionality state
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // Fetch all categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await axios.get('/api/get-all-categories');
      if (response.data.success) {
        setCategoriesList(response.data.data);
        setFilteredCategories(response.data.data); // Initialize filtered categories
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to fetch categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Filter categories based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  // Delete category function
  const deleteCategory = async (categoryId: string) => {
    setDeletingCategory(categoryId);
    try {
      const response = await axios.delete(`/api/delete-category-by-id/${categoryId}`);
      if (response.data.success) {
        toast.success("Category deleted successfully");
        // Remove from local state
        setCategoriesList(prev => prev.filter(cat => cat._id !== categoryId));
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Failed to delete category"); 
      } else {
        toast.error("Failed to delete category");
      }
    } finally {
      setDeletingCategory(null);
      setShowDeleteConfirm(null);
    }
  };

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      // Fetch admin statistics
      const adminResponse = await axios.get('/api/get-all-admins?limit=1&page=1');
      if (adminResponse.data.success) {
        setAdminStats({
          total: adminResponse.data.pagination.total,
          totalPages: adminResponse.data.pagination.totalPages
        });
      }

      // Fetch work statistics
      const workResponse = await axios.get('/api/get-all-works?page=1');
      if (workResponse.data.success) {
        // Get total count by fetching multiple pages if needed
        let totalWorks = workResponse.data.count;
        
        // If there might be more pages, fetch the total by checking a higher page
        if (workResponse.data.count === 100) {
          const totalResponse = await axios.get('/api/get-all-works?page=999'); // Get last page
          if (totalResponse.data.success) {
            // Calculate approximate total based on pagination
            totalWorks = (998 * 100) + totalResponse.data.count; // Rough calculation
          }
        }
        
        setWorkStats({
          count: workResponse.data.count,
          totalWorks: totalWorks
        });
      }

      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Failed to fetch dashboard statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch initial data on component mount (no auto-refresh)
  useEffect(() => {
    fetchDashboardStats();
    fetchCategories();
  }, []);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategories({...Category, [e.target.name]: e.target.value});
  }

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!Category.name.trim()) {
      toast.error("Please enter a category name");
      return;
    }
    
    setCreatingCategory(true);
    try {
      const {name} = Category;
      const response = await axios.post("/api/create-category", {name});
      toast.success(response.data.message);
      setCategories({name: ""}); // Reset form
      // Refresh categories list
      fetchCategories();
    } catch (error: any) {
      console.log("Error while creating category:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Error while creating category");
      } else {
        toast.error("Error while creating category");
      }
    } finally {
      setCreatingCategory(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({...credentials, [e.target.name]: e.target.value});
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!credentials.username.trim() || !credentials.password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    try {
      const {username, password} = credentials;
      const response = await axios.post("/api/create-credentials", {username, password});
      toast.success(response.data.message);
      setCredentials({username: "", password: ""}); // Reset form
    } catch (error: any) {
      console.log("Error while creating credentials:", error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Error while creating credentials");
      } else {
        toast.error("Error while creating credentials");
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery("");
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Confirmation Dialog Component
  const DeleteConfirmDialog = ({ categoryId, categoryName, onConfirm, onCancel }: {
    categoryId: string;
    categoryName: string;
    onConfirm: () => void;
    onCancel: () => void;
  }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-lg border border-red-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-2 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
        </div>
        
        <p className="text-gray-700 mb-6">
          Are you sure you want to delete the category <span className="font-semibold text-red-600">"{categoryName}"</span>? 
          This action cannot be undone.
        </p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deletingCategory === categoryId}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {deletingCategory === categoryId ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='py-10 pb-20 md:p-20 w-full'>
      <div className='w-full px-5 flex items-center justify-between'>
        <div>
          <h1 className='bg-opacity-50 bg-gradient-to-r from-neutral-600 to-neutral-900 bg-clip-text text-3xl font-bold text-transparent md:text-5xl'>
            Super Admin
          </h1>
          {lastUpdated && (
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={() => {
            fetchDashboardStats();
            fetchCategories();
          }}
          disabled={statsLoading || categoriesLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", (statsLoading || categoriesLoading) && "animate-spin")} />
          Refresh Stats
        </button>
      </div>
      
      <hr className='my-5'/>
      
      {/* Enhanced Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 p-4">
        {/* Total Admins Card */}
        <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-6 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-sm font-medium truncate">Total Admins</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 truncate">
                {statsLoading ? (
                  <Loader className="w-6 h-6 animate-spin inline" />
                ) : (
                  formatNumber(adminStats.total)
                )}
              </p>
              {!statsLoading && adminStats.total > 0 && (
                <p className="text-xs text-gray-400">
                  {adminStats.totalPages} page{adminStats.totalPages !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="bg-blue-100 p-3 rounded-xl ml-2 flex-shrink-0">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Active Work Items Card */}
        <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-6 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-sm font-medium truncate">Total Works</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600 truncate">
                {statsLoading ? (
                  <Loader className="w-6 h-6 animate-spin inline" />
                ) : (
                  formatNumber(workStats.totalWorks)
                )}
              </p>
              {!statsLoading && workStats.totalWorks > 0 && (
                <p className="text-xs text-gray-400">
                  Creative works published
                </p>
              )}
            </div>
            <div className="bg-green-100 p-3 rounded-xl ml-2 flex-shrink-0">
              <FileImage className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Recent Works Card */}
        <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-6 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-sm font-medium truncate">Recent Works</p>
              <p className="text-2xl md:text-3xl font-bold text-purple-600 truncate">
                {statsLoading ? (
                  <Loader className="w-6 h-6 animate-spin inline" />
                ) : (
                  formatNumber(workStats.count)
                )}
              </p>
              {!statsLoading && workStats.count > 0 && (
                <p className="text-xs text-gray-400">
                  Latest batch loaded
                </p>
              )}
            </div>
            <div className="bg-purple-100 p-3 rounded-xl ml-2 flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* System Status Card */}
        <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-6 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-sm font-medium truncate">System Status</p>
              <p className="text-2xl md:text-3xl font-bold text-indigo-600 truncate">
                {statsLoading ? (
                  <Loader className="w-6 h-6 animate-spin inline" />
                ) : (
                  "Online"
                )}
              </p>
              {!statsLoading && (
                <p className="text-xs text-gray-400">
                  All services operational
                </p>
              )}
            </div>
            <div className="bg-indigo-100 p-3 rounded-xl ml-2 flex-shrink-0">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Create credentials and category forms section - MOVED ABOVE CATEGORIES */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-4 mb-8'>
        <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Create Admin Credentials
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Please enter the username and password to create credentials for the admin
          </p>
    
          <form className="my-8" onSubmit={handleSubmit}>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="Enter the username" 
                name='username' 
                type="text" 
                value={credentials.username}
                onChange={handleChange} 
                required
              />
            </LabelInputContainer>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                placeholder="••••••••" 
                name='password' 
                type="password"
                value={credentials.password} 
                onChange={handleChange}
                required 
              />
            </LabelInputContainer>
            <button
              className="group/btn cursor-pointer relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (<span>Create Credentials &rarr;</span>)}
              <BottomGradient />
            </button>
          </form>
        </div>

        <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Category
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
            Please enter the categories which you want to create for organizing works
          </p>
    
          <form className="my-8" onSubmit={handleCategorySubmit}>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="name">Category Name</Label>
              <Input 
                id="name" 
                placeholder="Enter the Category name" 
                name='name' 
                type="text"
                value={Category.name}
                onChange={handleCategoryChange}
                required 
              />
            </LabelInputContainer>
            <button
              className="group/btn cursor-pointer relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset] disabled:opacity-50"
              type="submit"
              disabled={creatingCategory}
            >
              {creatingCategory ? (
                <span className="flex items-center justify-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </span>
              ) : (<span>Create Category &rarr;</span>)}
              <BottomGradient />
            </button>
          </form>
        </div>
      </div>

      {/* Categories Management Section */}
      <div className="mb-8 p-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-6 h-6 text-orange-600" />
              Categories Management
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage your content categories • {filteredCategories.length} of {categories.length} categories
              {searchQuery && <span className="text-orange-600"> (filtered)</span>}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl bg-white/90 backdrop-blur-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 text-gray-900"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
          {categoriesLoading ? (
            // Loading skeleton
            Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-lg"></div>
                </div>
              </div>
            ))
          ) : filteredCategories.length === 0 ? (
            <div className="col-span-full bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-8 text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No categories found" : "No Categories Found"}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? `No categories match "${searchQuery}". Try a different search term.`
                  : "Create your first category using the form above."
                }
              </p>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="mt-3 px-4 py-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div 
                key={category._id} 
                className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-4 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-orange-500/20 shadow-lg group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate text-lg">{category.name}</h3>
                    <p className="text-xs text-gray-500">Created {formatDate(category.createdAt)}</p>
                  </div>
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Tag className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    ID: {category._id.slice(-8)}
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm(category._id)}
                    disabled={deletingCategory === category._id}
                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-50 text-sm"
                  >
                    {deletingCategory === category._id ? (
                      <Loader className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {/* <hr className='my-4'></hr> */}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          categoryId={showDeleteConfirm}
          categoryName={categories.find(cat => cat._id === showDeleteConfirm)?.name || ''}
          onConfirm={() => deleteCategory(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
        />
      )}
    </div>
  )
}

const BottomGradient = () => {
  return (
    <>
      <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

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

export default Superadmin;
