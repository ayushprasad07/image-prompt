'use client'
import React, { useState, useEffect } from 'react'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import axios from 'axios';
import { Loader, Users, FileImage, RefreshCw } from 'lucide-react';

interface AdminStats {
  total: number;
  totalPages: number;
}

interface WorkStats {
  count: number;
  totalWorks: number;
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

  // Fetch stats on component mount and set up auto-refresh
  useEffect(() => {
    fetchDashboardStats();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    
    return () => clearInterval(interval);
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

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
          onClick={fetchDashboardStats}
          disabled={statsLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", statsLoading && "animate-spin")} />
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

      {/* Create credentials and category forms section */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-4'>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
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
