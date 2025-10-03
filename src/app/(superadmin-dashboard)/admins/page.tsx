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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Crown, Loader, User, Shield, AlertCircle, Trash2, UserCog } from 'lucide-react';

const Admins = () => {
  const [admins, setAdmins] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [deletingAdmin, setDeletingAdmin] = useState<string | null>(null);
  const [promotingAdmin, setPromotingAdmin] = useState<string | null>(null);
  
  // Modal states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<{ id: string; name: string } | null>(null);

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

  const openDeleteDialog = (adminId: string, adminName: string) => {
    setSelectedAdmin({ id: adminId, name: adminName });
    setDeleteDialogOpen(true);
  };

  const openPromoteDialog = (adminId: string, adminName: string) => {
    setSelectedAdmin({ id: adminId, name: adminName });
    setPromoteDialogOpen(true);
  };

  const handleDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    const originalAdmins = admins;
    setAdmins(prevAdmins => prevAdmins.filter(admin => admin._id !== selectedAdmin.id));
    setDeletingAdmin(selectedAdmin.id);
    setDeleteDialogOpen(false);

    try {
      const response = await axios.delete(`/api/delete-admin/${selectedAdmin.id}`);
      
      if (response.data.success) {
        toast.success(response.data.message || "Admin deleted successfully");
        
        if (admins.length === 1 && page > 1) {
          setPage(page - 1);
        } else {
          fetchAdmins(page);
        }
      }
    } catch (error: any) {
      console.error("Error deleting admin:", error);
      setAdmins(originalAdmins);
      
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Failed to delete admin");
      } else {
        toast.error("Failed to delete admin");
      }
    } finally {
      setDeletingAdmin(null);
      setSelectedAdmin(null);
    }
  };

  const handlePromoteToSuperAdmin = async () => {
    if (!selectedAdmin) return;

    setPromotingAdmin(selectedAdmin.id);
    setPromoteDialogOpen(false);

    try {
      const response = await axios.patch(`/api/mark-as-superadmin/${selectedAdmin.id}`);
      
      if (response.data.success) {
        toast.success(response.data.message || "Admin promoted to superadmin successfully");
        fetchAdmins(page);
      }
    } catch (error: any) {
      console.error("Error promoting admin:", error);
      
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "Failed to promote admin");
      } else {
        toast.error("Failed to promote admin");
      }
    } finally {
      setPromotingAdmin(null);
      setSelectedAdmin(null);
    }
  };

  useEffect(() => {
    fetchAdmins(page);
  }, [page]);

  const normalizeRole = (role: string) => {
    return role?.toLowerCase().trim() || 'admin';
  };

  const isSuperAdmin = (role: string) => {
    const normalized = normalizeRole(role);
    return normalized === 'superadmin';
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
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="bg-white/90 backdrop-blur-lg border border-gray-200 rounded-xl p-4 text-center shadow-lg">
              <p className="text-2xl font-bold text-blue-600">
                {admins.filter(admin => !isSuperAdmin(admin.role)).length}
              </p>
              <p className="text-sm text-gray-600">Regular Admins</p>
            </div>
            <div className="bg-white/90 backdrop-blur-lg border border-yellow-200 rounded-xl p-4 text-center shadow-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {admins.filter(admin => isSuperAdmin(admin.role)).length}
              </p>
              <p className="text-sm text-gray-600">Super Admins</p>
            </div>
          </div>
        </div>
      </div>
      <hr className='my-5'/>

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
              const isSuper = isSuperAdmin(admin.role);

              return (
                <div key={admin._id || index} className="group relative">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                    
                    {/* Conditional Rendering Based on Role */}
                    {isSuper ? (
                      // Super Admin Card
                      <>
                        {/* Super Admin Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-full text-yellow-700 text-sm font-semibold w-fit mb-6">
                          <Crown className="w-4 h-4" />
                          Super Admin
                        </div>

                        {/* Avatar and Name Section */}
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="relative w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {admin.username?.charAt(0).toUpperCase() || 'A'}
                            <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-white">
                              <Crown className="w-3.5 h-3.5 text-yellow-800" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-xl mb-0.5">
                              {admin.username || 'Admin User'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Super Administrator
                            </p>
                          </div>
                        </div>

                        {/* Protected Account Button */}
                        <div className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4" />
                          Protected Account
                        </div>
                      </>
                    ) : (
                      // Regular Admin Card
                      <>
                        {/* Admin Badge and Delete Icon */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-semibold">
                            <Shield className="w-4 h-4" />
                            Admin
                          </div>
                          
                          <button
                            onClick={() => openDeleteDialog(admin._id, admin.username)}
                            disabled={deletingAdmin === admin._id}
                            className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed border border-red-200"
                            title="Delete Admin"
                          >
                            {deletingAdmin === admin._id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>

                        {/* Avatar and Name Section */}
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {admin.username?.charAt(0).toUpperCase() || 'A'}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-900 text-xl mb-0.5">
                              {admin.username || 'Admin User'}
                            </p>
                            <p className="text-sm text-gray-600">
                              Administrator
                            </p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Link href={`/admin-work/${admin._id}`} className="block">
                            <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-blue-200">
                              <User className="w-4 h-4" />
                              View Details
                            </button>
                          </Link>

                          <button
                            onClick={() => openPromoteDialog(admin._id, admin.username)}
                            disabled={promotingAdmin === admin._id}
                            className="w-full bg-gradient-to-r from-yellow-50 to-orange-50 hover:from-yellow-100 hover:to-orange-100 text-yellow-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-yellow-200"
                          >
                            {promotingAdmin === admin._id ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Promoting...
                              </>
                            ) : (
                              <>
                                <UserCog className="w-4 h-4" />
                                Make Superadmin
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
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
                  aria-disabled={page <= 1}
                  tabIndex={page <= 1 ? -1 : undefined}
                  className={page === 1 ? 'pointer-events-none opacity-50' : ''}
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
                  aria-disabled={page >= totalPages}
                  tabIndex={page >= totalPages ? -1 : undefined}
                  className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete admin <span className="font-semibold text-gray-900">"{selectedAdmin?.name}"</span>?
              <br /><br />
              This will also delete all works created by this admin. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote to Superadmin Confirmation Dialog */}
      <AlertDialog open={promoteDialogOpen} onOpenChange={setPromoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote to Super Admin</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to promote <span className="font-semibold text-gray-900">"{selectedAdmin?.name}"</span> to Super Admin?
              <br /><br />
              This will grant them full administrative privileges including the ability to manage other admins.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePromoteToSuperAdmin}
              className="bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-600"
            >
              Promote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admins;
