'use client'
import React, { useState } from 'react'
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { signIn, getSession } from "next-auth/react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const SignIn = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [credentials, setCredentials] = useState({username : "",password : ""});
     const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await signIn("credentials", {
            redirect: false,
            identifier: credentials.username,
            password: credentials.password,
            });

            if (response?.error) {
            toast.error(response.error);
            return;
            }

            // ✅ Fetch session to know the role
            const session = await getSession();
            console.log("Session : ",session)
            if (!session?.user) {
            toast.error("Failed to get session");
            return;
            }

            toast.success("Login successful");

            if (session.user.role === "superadmin") {
                router.replace("/superadmin");
            } else {
                router.replace("/dashboard");
            }
        } catch (error) {
            console.error("Error while submitting form", error);
            toast.error("Error while submitting form");
        } finally {
            setIsLoading(false);
        }

        console.log("Form submitted", credentials);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({...credentials, [e.target.name] : e.target.value});
    };

    return (
        <div className='flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4'>
            {/* Background Animation */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob dark:bg-purple-600"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob [animation-delay:2s] dark:bg-yellow-600"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob [animation-delay:4s] dark:bg-pink-600"></div>
            </div>

            <div className="relative z-10 backdrop-blur-lg bg-white/80 dark:bg-black/80 shadow-2xl mx-auto w-full max-w-md rounded-3xl p-8 border border-white/20 dark:border-gray-800/20 transform transition-all duration-500 hover:scale-105 hover:shadow-3xl animate-fade-in">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mb-4 mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse-soft">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-neutral-800 dark:text-neutral-200 mb-2 animate-slide-up">
                        Welcome Back
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 animate-slide-up [animation-delay:200ms]">
                        Sign in to your Image-Prompt account
                    </p>
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                    {/* Username Field */}
                    <div className={cn("flex w-full flex-col space-y-2", "animate-slide-up [animation-delay:300ms]")}>
                        <Label 
                            htmlFor="username" 
                            className="text-neutral-700 dark:text-neutral-300 font-medium transition-colors duration-200"
                        >
                            Username
                        </Label>
                        <div className="relative group">
                            <Input 
                                id="username" 
                                placeholder="Enter your username" 
                                type="text"
                                name='username'
                                onChange={handleInputChange}
                                className="pl-12 pr-4 py-3 bg-white/50 dark:bg-black/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-200 group-focus-within:text-blue-500">
                                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Password Field */}
                    <div className={cn("flex w-full flex-col space-y-2", "animate-slide-up [animation-delay:400ms]")}>
                        <Label 
                            htmlFor="password" 
                            className="text-neutral-700 dark:text-neutral-300 font-medium transition-colors duration-200"
                        >
                            Password
                        </Label>
                        <div className="relative group">
                            <Input 
                                id="password" 
                                placeholder="Enter your password" 
                                type="password"
                                name='password'
                                onChange={handleInputChange}
                                className="pl-12 pr-4 py-3 bg-white/50 dark:bg-black/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center justify-between animate-slide-up [animation-delay:500ms]">
                        <label className="flex items-center group cursor-pointer">
                            <input type="checkbox" className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-all duration-200" />
                            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors duration-200">Remember me</span>
                        </label>
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 transition-colors duration-200 hover:underline">
                            Forgot password?
                        </a>
                    </div>

                    {/* Submit Button */}
                    <button
                        className={cn(
                            "group relative block h-12 w-full rounded-xl font-semibold text-white shadow-lg transition-all duration-300 animate-slide-up [animation-delay:600ms]",
                            "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800",
                            "transform hover:scale-105 hover:shadow-2xl active:scale-95 hover:-translate-y-1",
                            "dark:from-blue-500 dark:via-purple-500 dark:to-blue-600 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-blue-700",
                            "disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0",
                            "focus:ring-4 focus:ring-blue-500/20 focus:outline-none"
                        )}
                        type="submit"
                        disabled={isLoading}
                    >
                        <span className="relative z-10 flex items-center justify-center">
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in
                                    <svg className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </>
                            )}
                        </span>
                        <BottomGradient />
                    </button>

                </form>
            </div>
        </div>
    )
}

const BottomGradient = () => {
    return (
        <>
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
        </>
    );
};

export default SignIn
