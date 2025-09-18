'use client'
import React, { useState } from 'react'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import axios from 'axios';
import { Loader } from 'lucide-react';


const Superadmin = () => {
  const [credentials, setCredentials] = useState({username : "",password : ""});
  const[isLoading, setIsLoading] = useState(false);
  const [Category, setCategories] = useState({name : ""});
  const [creatingCategory, setCreatingCategory] = useState(false);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategories({...Category, [e.target.name] : e.target.value});
  }

  const handleCategorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreatingCategory(true);
    try {
      console.log(Category);
      const {name} = Category;
      const response = await axios.post("/api/create-category", {name});
      console.log("Response : ",response);
      toast.success(response.data.message);
    } catch (error: any) {
      console.log("Error while creating category:", error);

      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Error while creating category");
      } else {
        toast.error("Error while creating category");
      }
    }finally{
      setCreatingCategory(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials({...credentials, [e.target.name] : e.target.value});
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log(credentials);
      const {username, password} = credentials;
      const response = await axios.post("/api/create-credentials", {username, password});
      console.log("Response : ",response);
      toast.success(response.data.message);
    } catch (error: any) {
      console.log("Error while creating category:", error);

      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Error while creating category");
      } else {
        toast.error("Error while creating category");
      }
    }finally{
      setIsLoading(false);
    }
  }

  return (
    <div className='py-10 pb-20 md:p-20 w-full'>
      <div className='w-full px-5'>
        <h1 className='bg-opacity-50 bg-gradient-to-r from-neutral-600 to-neutral-900 bg-clip-text text-3xl font-bold text-transparent md:text-5xl'>Super Admin</h1>
      </div>

      <hr className='my-5'/>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-8 sm:mb-12 p-4">
        {/* Total Admins Card */}
        <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Total Admins</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 truncate">20,000</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg sm:rounded-xl ml-2 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Work Items Card */}
        <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 hover:bg-white transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-gray-600 text-xs sm:text-sm font-medium truncate">Active Work Items</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 truncate">99,999</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg sm:rounded-xl ml-2 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Create credentials form section */}
      <div className='p-2 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-4 mb-8 sm:mb-12 p-4 '>
        <div className="mb-8 shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Create Credentials
          </h2>
          <p>Please enter the username and password to create credentials for the admin</p>
    
          <form className="my-8" onSubmit={handleSubmit}>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="username">Username</Label>
              <Input id="username" placeholder="Enter the username" name='username' type="text" onChange={handleChange} />
            </LabelInputContainer>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="password">Password</Label>
              <Input id="password" placeholder="••••••••" name='password' type="password" onChange={handleChange} />
            </LabelInputContainer>
            <button
              className="group/btn cursor-pointer relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
              type="submit"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </span>
              ) : (<span>Create Creadentials &rarr;</span>)}
              <BottomGradient />
            </button>
          </form>
        </div>
        <div className="mb-8 shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
            Create Category
          </h2>
          <p>Please enter the Categories which you want to create</p>
    
          <form className="my-8" onSubmit={handleCategorySubmit}>
            <LabelInputContainer className="mb-4">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter the Category" name='name' type="text" onChange={handleCategoryChange} />
            </LabelInputContainer>
            <button
              className="group/btn cursor-pointer relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]"
              type="submit"
            >
              {creatingCategory ? (
                <span className="flex items-center justify-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Please wait
                </span>
              ) : (<span>Create Creadentials &rarr;</span>)}
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

export default Superadmin
