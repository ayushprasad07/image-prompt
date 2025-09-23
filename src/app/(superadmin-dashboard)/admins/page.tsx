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
import { Crown, Loader, User, Shield, CheckCircle, AlertCircle } from 'lucide-react';

const Admins = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // page size
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [upgradingAdmin, setUpgradingAdmin] = useState<string | null>(null);

  const fetchAdmins = async (pageNum: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/get-all-admins?limit=${limit}&page=${pageNum}`);
      const { data, pagination, message } = response.data;

      // Debug log to check the data structure
      console.log('Fetched admins:', data);
      console.log('Admin roles:', data.map((admin: any) => ({ id: admin._id, role: admin.role })));

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

  const markAsSuperadmin = async (adminId: string, adminName: string) => {
    setUpgradingAdmin(adminId);
    try {
      const response = await axios.patch(`/api/mark-as-superadmin/${adminId}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        
        // Debug log to check the response
        console.log('Mark as superadmin response:', response.data);
        
        // Update the local state to reflect the change
        setAdmins(prevAdmins => {
          const updatedAdmins = prevAdmins.map(admin =>
            admin._id === adminId
              ? { ...admin, role: 'superadmin' }
              : admin
          );
          
          // Debug log to check updated state
          console.log('Updated admins after role change:', updatedAdmins);
          console.log('Updated admin roles:', updatedAdmins.map(admin => ({ id: admin._id, role: admin.role })));
          
          return updatedAdmins;
        });
      }
    } catch (error: any) {
      console.error("Error upgrading admin:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Failed to upgrade admin");
      } else {
        toast.error("Failed to upgrade admin");
      }
    } finally {
      setUpgradingAdmin(null);
    }
  };

  useEffect(() => {
    fetchAdmins(page);
  }, [page]);

  // Enhanced role checking with debugging
  const normalizeRole = (role: string) => {
    return role?.toLowerCase().trim() || 'admin';
  };

  const isSuperAdmin = (role: string) => {
    const normalized = normalizeRole(role);
    console.log('Checking role:', role, 'normalized:', normalized, 'is superadmin:', normalized === 'superadmin');
    return normalized === 'superadmin';
  };

  const getRoleBadge = (role: string) => {
    if (isSuperAdmin(role)) {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 rounded-full text-xs font-semibold border border-yellow-200">
          <Crown className="w-3 h-3" />
          Super Admin
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold border border-blue-200">
        <Shield className="w-3 h-3" />
        Admin
      </div>
    );
  };

  const getAvatarColor = (role: string) => {
    if (isSuperAdmin(role)) {
      return 'bg-gradient-to-br from-yellow-500 to-orange-600';
    }
    return 'bg-gradient-to-br from-blue-500 to-purple-600';
  };

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
          
          {/* Stats Section */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-4 text-center shadow-lg">
              <p className="text-2xl font-bold text-blue-600">
                {admins.filter(admin => !isSuperAdmin(admin.role)).length}
              </p>
              <p className="text-sm text-gray-600">Regular Admins</p>
            </div>
            <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-4 text-center shadow-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {admins.filter(admin => isSuperAdmin(admin.role)).length}
              </p>
              <p className="text-sm text-gray-600">Super Admins</p>
            </div>
          </div>
        </div>
      </div>
      <hr className='my-5'/>

      {/* Admins List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading admins...</p>
            </div>
          </div>
        ) : admins.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6'>
            {admins.map((admin, index) => {
              // Debug log for each admin
              console.log(`Rendering admin ${admin.username}:`, {
                id: admin._id,
                role: admin.role,
                isSuperAdmin: isSuperAdmin(admin.role)
              });

              return (
                <div key={admin._id || index} className="group relative p-4">
                  <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:bg-white">
                    
                    {/* Status Indicator */}
                    <div className="absolute top-4 right-4">
                      {getRoleBadge(admin.role)}
                    </div>

                    {/* Header with Avatar */}
                    <div className="flex items-center space-x-3 mb-4 mt-6">
                      <div className={`w-12 h-12 ${getAvatarColor(admin.role)} rounded-full flex items-center justify-center text-white font-bold text-lg relative`}>
                        {admin.username?.charAt(0).toUpperCase() || 'A'}
                        {isSuperAdmin(admin.role) && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                            <Crown className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-lg">
                          {admin.username || 'Admin User'}
                        </p>
                        <p className="text-sm text-gray-600 capitalize">
                          {isSuperAdmin(admin.role) ? 'Super Administrator' : 'Administrator'}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {/* View Details Button - Only show for regular admins, hide for superadmins */}
                      {!isSuperAdmin(admin.role) && (
                        <Link href={`/admin-work/${admin._id}`} className="block">
                          <button className="w-full bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2">
                            <User className="w-4 h-4" />
                            View Details
                          </button>
                        </Link>
                      )}

                      {/* Mark as Superadmin Button */}
                      {!isSuperAdmin(admin.role) ? (
                        <button
                          onClick={() => markAsSuperadmin(admin._id, admin.username)}
                          disabled={upgradingAdmin === admin._id}
                          className="w-full bg-gradient-to-r from-yellow-100 to-orange-100 hover:from-yellow-200 hover:to-orange-200 text-yellow-700 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {upgradingAdmin === admin._id ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Upgrading...
                            </>
                          ) : (
                            <>
                              <Crown className="w-4 h-4" />
                              Mark as Super Admin
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="w-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-4 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                          <CheckCircle className="w-4 h-4" />
                          Already Super Admin
                        </div>
                      )}
                    </div>

                    {/* Decorative Element */}
                    <div className={`absolute top-0 right-0 w-20 h-20 ${
                      isSuperAdmin(admin.role)
                        ? 'bg-gradient-to-br from-yellow-500/10 to-orange-600/10' 
                        : 'bg-gradient-to-br from-blue-500/10 to-purple-600/10'
                    } rounded-bl-2xl rounded-tr-2xl`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No admins found</h3>
            <p className="text-gray-600">There are no administrators to display at the moment.</p>
          </div>
        )}
      </div>

      {/* Pagination Component */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
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

              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 7) {
                  pageNumber = i + 1;
                } else if (page <= 4) {
                  pageNumber = i + 1;
                } else if (page >= totalPages - 3) {
                  pageNumber = totalPages - 6 + i;
                } else {
                  pageNumber = page - 3 + i;
                }

                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      href="#"
                      isActive={page === pageNumber}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNumber);
                      }}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

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
      )}
    </div>
  );
};

export default Admins;
