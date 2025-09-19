'use client'
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import Link from "next/link";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Admins = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // page size
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchAdmins = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/get-all-admins?limit=${limit}&page=${pageNum}`);
      const { data, pagination, message } = response.data;

      setAdmins(data);
      setTotalPages(pagination.totalPages);
      setPage(pagination.page);

      toast.success(message);
    } catch (error: any) {
      console.log("Error while fetching admins:", error);

      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Error while fetching admins");
      } else {
        toast.error("Error while fetching admins");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins(page);
  }, [page]);

  return (
    <div className='py-10 pb-20 md:p-20 w-full'>
      <div className='w-full px-5 mb-8'>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className='bg-gradient-to-r from-slate-800 via-blue-600 to-indigo-600 dark:from-slate-200 dark:via-blue-400 dark:to-indigo-400 bg-clip-text text-4xl md:text-6xl font-bold text-transparent mb-4'>
                Admin Management
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
                Manage your administrative team and monitor their activities
              </p>
            </div>
          </div>
        </div>
      <hr className='my-5'/>

      {/* Admins List */}
      <div className="space-y-3">
        {loading ? (
          <p>Loading admins...</p>
        ) : admins.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'>
            {admins.map((admin, index) => (
              <div key={admin._id || index} className="group relative p-4">
                <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white">
                  {/* Header with Avatar */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {admin.username?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-lg">
                        {admin.username || 'Admin User'}
                      </p>
                      <p className="text-sm text-gray-600">Administrator</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex space-x-3 justify-center items-center mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded-xl">
                      <p className="text-2xl font-bold text-blue-600">24</p>
                      <p className="text-xs text-gray-600">Tasks</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    {/* View Details → navigates to /admins/[id] */}
                    <Link href={`/admin-work/${admin._id}`} className="flex-1">
                      <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105">
                        View Details
                      </button>
                    </Link>
                    {/* <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 hover:scale-105">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button> */}
                  </div>

                  {/* Decorative Element */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-600/10 rounded-bl-2xl rounded-tr-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No admins found.</p>
        )}
      </div>

      {/* Pagination Component */}
      <div className="flex justify-center mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
              />
            </PaginationItem>

            {Array.from({ length: totalPages }, (_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={page === i + 1}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(i + 1);
                  }}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default Admins;
