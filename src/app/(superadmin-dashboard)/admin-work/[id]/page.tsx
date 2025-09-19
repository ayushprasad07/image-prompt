'use client';

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import { toast } from "sonner";
import { Copy, Loader } from "lucide-react";
import UpdateDialog from "@/components/UpdateDialog"; // ✅ adjust import if path differs

const AdminWorksPage = () => {
  const { id } = useParams();
  const router = useRouter();

  const [works, setWorks] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const fetchWorks = async (pageNum: number) => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await axios.get(`/api/get-work-by-admin/${id}?page=${pageNum}`);
      const { data, pagination, success } = response.data;

      if (success) {
        setWorks(data);
        setPages(pagination.pages);
        setPage(pagination.page);
      }
    } catch (error: any) {
      console.error("Error fetching works:", error);
      toast.error("Failed to fetch works");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const copyToClipboard = (text: string, workId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(workId);
    toast.success("Prompt copied!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteWork = async (workId: string) => {
    try {
      setIsDeleting(true);
      const res = await axios.delete(`/api/delete-work/${workId}`);
      toast.success(res.data.message);
      setWorks((prev) => prev.filter((w) => w._id !== workId));
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete work");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWorkUpdated = () => {
    fetchWorks(page);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pages) return;
    fetchWorks(newPage);
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-600">Loading works...</div>;
  }

  return (
    <div className="py-10 md:px-20 w-full">
      <button
        onClick={() => router.back()}
        className="mb-5 text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-6">Admin Works</h1>

      {works.length === 0 ? (
        <p className="text-center text-gray-500">No works found for this admin.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {works.map((work, index) => (
              <div
                key={work._id}
                className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image */}
                <div className="relative overflow-hidden rounded-2xl mb-6 bg-gradient-to-br from-gray-50 to-gray-100">
                  <Image
                    src={work.imageUrl}
                    alt={work.prompt}
                    width={400}
                    height={300}
                    className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Category */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm border border-gray-100">
                      {work.categoryId?.name || "Uncategorized"}
                    </span>
                  </div>

                  {/* Copy Button */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => copyToClipboard(work.prompt, work._id)}
                      className="p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm border border-gray-100 hover:bg-white transition-all duration-200 hover:scale-105"
                      title="Copy prompt to clipboard"
                    >
                      {copiedId === work._id ? (
                        <svg
                          className="w-4 h-4 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 leading-7 group-hover:text-blue-600 transition-colors duration-300">
                    {work.prompt}
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">
                    Created{" "}
                    {new Date(work.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  <div className="flex gap-3 pt-2">
                    {/* Update */}
                    <UpdateDialog id={work._id.toString()} onUpdateSuccess={handleWorkUpdated} />

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteWork(work._id)}
                      className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center border border-red-100 hover:border-red-200"
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-10">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page <= 1}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-600 font-medium">
              Page {page} of {pages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= pages}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminWorksPage;
