'use client'
import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { CreateWorkModal } from '@/components/CreateWorkModal'
import { Copy, Loader } from 'lucide-react'
import UpdateDialog from '@/components/UpdateDialog'
import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

interface Work {
  _id: string;
  prompt: string;
  imageUrl: string;
  categoryId: string;
  createdAt: string;
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
        <div className="bg-gray-200 h-10 w-10 rounded-xl"></div>
      </div>
    </div>
  </div>
)

const AdminWorks = () => {
  const [works, setWorks] = useState<Work[]>([])
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [page, setPage] = useState(1)
  const [limit] = useState(100)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const totalPages = Math.ceil(count / limit) || 1

  const handleLogout = () => {
    signOut({ callbackUrl: "/sign-in" });
  };

  // 🔹 Enhanced Copy to clipboard functionality with fallback
  const copyToClipboard = async (text: string, workId: string) => {
    try {
      // Method 1: Try modern Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
        setCopiedId(workId)
        toast.success("Prompt copied to clipboard!")
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopiedId(null), 2000)
        return
      }
      
      // Method 2: Fallback to legacy execCommand method
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        setCopiedId(workId)
        toast.success("Prompt copied to clipboard!")
        setTimeout(() => setCopiedId(null), 2000)
      } else {
        throw new Error('execCommand failed')
      }
      
    } catch (err) {
      console.error("Failed to copy to clipboard:", err)
      toast.error("Failed to copy to clipboard")
    }
  }

  // 🔹 Fetch works - memoized with useCallback for better performance
  const fetchWorks = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {
      const res = await axios.get(`/api/get-admin-works?page=${pageNum}`)
      const { works, count, message } = res.data

      setWorks(works)
      setCount(count)
      setPage(pageNum)

      // Fetch categories for these works
      fetchCategories(works.map((w: Work) => w.categoryId))

      toast.success(message)
    } catch (err: any) {
      console.error("Error fetching works:", err)
      toast.error("Failed to fetch works")
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔹 Fetch category names by ID
  const fetchCategories = async (ids: string[]) => {
    const uniqueIds = [...new Set(ids.filter(Boolean))]
    const categoryMap: Record<string, string> = { ...categories }

    await Promise.all(
      uniqueIds.map(async (id) => {
        if (!categoryMap[id]) {
          try {
            const res = await axios.get(`/api/fetch-category-by-id/${id}`)
            if (res.data.success) {
              categoryMap[id] = res.data.data.name
            }
          } catch (err) {
            console.error(`Error fetching category ${id}:`, err)
          }
        }
      })
    )

    setCategories(categoryMap)
  }

  // 🔹 Handle work creation success - callback for CreateWorkModal
  const handleWorkCreated = useCallback(() => {
    // Refresh the current page to reflect the new work
    fetchWorks(page)
    toast.success("New work added to your collection!")
  }, [fetchWorks, page])

  // 🔹 Handle work update success - this will be called from UpdateDialog
  const handleWorkUpdated = useCallback(() => {
    // Refresh the current page to reflect changes
    fetchWorks(page)
    toast.success("Work updated successfully!")
  }, [fetchWorks, page])

  const handleDeleteWork = async (workid: string) => {
    setIsDeleting(true)
    try {
      // Call backend API
      const res = await axios.delete(`/api/delete-work/${workid}`)

      if (res.status === 202) {
        toast.success(res.data.message || "Work deletion queued")

        // Optionally: Optimistic UI update (remove from state immediately)
        setWorks((prev) => prev.filter((w) => w._id !== workid))
        setCount((prev) => prev - 1)
      } else {
        toast.error(res.data.message || "Failed to delete work")
      }
    } catch (err: any) {
      console.error("Delete work error:", err)
      toast.error("Something went wrong while deleting")
    } finally {
      setIsDeleting(false)
    }
  }

  useEffect(() => {
    fetchWorks(page)
  }, [page, fetchWorks])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      {/* Enhanced Fixed Create Button */}
      <div className="fixed top-6 right-6 z-50 flex justify-end gap-4 items-center">
        {/* Updated: Pass the callback to CreateWorkModal */}
        <CreateWorkModal onWorkCreated={handleWorkCreated} />
        <Button onClick={handleLogout} className='px-4 py-2 rounded-md text-white cursor-pointer dark:text-white text-center relative overflow-hidden'>
          Logout
        </Button>
      </div>

      {/* Header Section */}
      <div className="pt-20 pb-12 px-6 md:px-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-slate-200 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-transparent mb-6 leading-tight">
              Creative Works
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Manage and showcase your creative portfolio with elegance
            </p>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl px-8 py-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors duration-300">{count}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Total Works</div>
              </div>
            </div>
            <div className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 rounded-2xl px-8 py-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors duration-300">{totalPages}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 font-medium">Pages</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Works Grid */}
      <div className="px-6 md:px-20 pb-20">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <WorkSkeleton key={i} />
              ))}
            </div>
          ) : works.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {works.map((work, index) => (
                <div
                  key={work._id}
                  className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-500 hover:-translate-y-2"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Image Container */}
                  <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-gray-50 to-gray-100">
                    <Image
                      src={work.imageUrl}
                      alt={work.prompt}
                      width={400}
                      height={300}
                      className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Category Badge */}
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm border border-gray-100">
                        {categories[work.categoryId] || "Loading..."}
                      </span>
                    </div>

                    {/* Enhanced Copy Button with Better Visual Feedback */}
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
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
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
                    {/* Full Prompt - No truncation */}
                    <h3 className="text-lg font-bold text-gray-900 leading-7 group-hover:text-blue-600 transition-colors duration-300">
                      {work.prompt}
                    </h3>
                    
                    {/* Date */}
                    <p className="text-sm text-gray-500 font-medium">
                      Created {new Date(work.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      {/* Update Dialog - now with callback */}
                      <UpdateDialog id={work._id.toString()} onUpdateSuccess={handleWorkUpdated} />
                      
                      <button
                        onClick={() => handleDeleteWork(work._id)}
                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center border border-red-100 hover:border-red-200"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader className='w-4 h-4 animate-spin'/>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Subtle decoration */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-br-3xl pointer-events-none"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">No works found</h3>
              <p className="text-gray-600 mb-8 text-lg">Start creating your first masterpiece to see it here.</p>
              
              {/* Empty state create button */}
              <div className="inline-flex">
                <CreateWorkModal onWorkCreated={handleWorkCreated} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Pagination with Visible Previous/Next Buttons */}
      {totalPages > 1 && (
        <div className="flex justify-center pb-16">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-3 shadow-sm">
            <Pagination>
              <PaginationContent className="gap-2">
                {/* Enhanced Previous Button with visible text and icon */}
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                    aria-disabled={page <= 1}
                    tabIndex={page <= 1 ? -1 : undefined}
                    className={`rounded-xl transition-all duration-200 px-4 py-2 flex items-center gap-2 ${
                      page === 1 
                        ? 'pointer-events-none opacity-50 cursor-not-allowed' 
                        : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">Previous</span>
                  </PaginationPrevious>
                </PaginationItem>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                        className={`rounded-xl transition-all duration-200 min-w-[40px] h-[40px] flex items-center justify-center ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 border-transparent'
                            : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                        }`}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                {/* Enhanced Next Button with visible text and icon */}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) setPage(page + 1);
                    }}
                    aria-disabled={page >= totalPages}
                    tabIndex={page >= totalPages ? -1 : undefined}
                    className={`rounded-xl transition-all duration-200 px-4 py-2 flex items-center gap-2 ${
                      page === totalPages 
                        ? 'pointer-events-none opacity-50 cursor-not-allowed' 
                        : 'hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 cursor-pointer'
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminWorks
