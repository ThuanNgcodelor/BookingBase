import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Car, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { approvalApi } from '../../api/approvalApi';
import { formatViDateTime } from '../../utils/dateTime';
import { Button } from '../ui/Button';

const initialFilters = { keyword: '', type: 'ALL', status: 'ALL', from: '', to: '', direction: 'desc' };

function statusClasses(status) {
  if (status === 'CANCELLED') return 'bg-gray-100 text-gray-700 border-gray-300';
  return status === 'APPROVED'
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-red-50 text-red-700 border-red-200';
}

function statusLabel(status) {
  if (status === 'CANCELLED') return 'Đã hủy';
  return status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối';
}

function Avatar({ user }) {
  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full border border-gray-200 object-cover" referrerPolicy="no-referrer" />;
  }
  return (
    <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold border border-blue-200">
      {user?.fullName?.charAt(0) || 'U'}
    </div>
  );
}

export default function AdminApprovalHistory() {
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const params = { page, size: 20, direction: filters.direction };
        if (filters.keyword) params.keyword = filters.keyword;
        if (filters.type !== 'ALL') params.type = filters.type;
        if (filters.status !== 'ALL') params.status = filters.status;
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        const data = await approvalApi.getHistory(params);
        if (!controller.signal.aborted) setResult(data);
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setError(requestError.response?.data?.message || 'Không tải được lịch sử xử lý.');
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchHistory();
    return () => controller.abort();
  }, [filters, page]);

  const updateDraft = (field, value) => setDraftFilters(current => ({ ...current, [field]: value }));

  const applyFilters = (event) => {
    event.preventDefault();
    setPage(0);
    setFilters({ ...draftFilters, keyword: draftFilters.keyword.trim() });
  };

  const clearFilters = () => {
    setDraftFilters(initialFilters);
    setFilters(initialFilters);
    setPage(0);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={applyFilters} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className="relative xl:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={draftFilters.keyword}
              onChange={event => updateDraft('keyword', event.target.value)}
              placeholder="Tên, email, phòng, xe, người xử lý..."
              className="h-10 w-full rounded-lg border border-gray-200 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </label>
          <select value={draftFilters.type} onChange={event => updateDraft('type', event.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
            <option value="ALL">Tất cả loại</option>
            <option value="ROOM">Phòng họp</option>
            <option value="CAR">Xe</option>
          </select>
          <select value={draftFilters.status} onChange={event => updateDraft('status', event.target.value)} className="h-10 rounded-lg border border-gray-200 px-3 text-sm">
            <option value="ALL">Tất cả trạng thái</option>
            <option value="APPROVED">Đã duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <label className="relative">
            <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500">Từ ngày xử lý</span>
            <input type="date" aria-label="Từ ngày xử lý" value={draftFilters.from} onChange={event => updateDraft('from', event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" />
          </label>
          <label className="relative">
            <span className="absolute -top-2 left-2 bg-white px-1 text-[10px] text-gray-500">Đến ngày xử lý</span>
            <input type="date" aria-label="Đến ngày xử lý" value={draftFilters.to} onChange={event => updateDraft('to', event.target.value)} className="h-10 w-full rounded-lg border border-gray-200 px-3 text-sm" />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <select value={draftFilters.direction} onChange={event => updateDraft('direction', event.target.value)} className="h-9 rounded-lg border border-gray-200 px-3 text-sm">
            <option value="desc">Xử lý mới nhất</option>
            <option value="asc">Xử lý cũ nhất</option>
          </select>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={clearFilters}>Xóa lọc</Button>
            <Button type="submit"><Filter className="mr-1.5 h-4 w-4" />Áp dụng</Button>
          </div>
        </div>
      </form>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
            <tr><th className="px-5 py-4">Người đặt</th><th className="px-5 py-4">Tài nguyên</th><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4">Người xử lý</th><th className="px-5 py-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">Đang tải...</td></tr>
            ) : result.content.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/70">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar user={item.requester} /><div><div className="text-sm font-medium text-gray-900">{item.requester?.fullName}</div><div className="text-xs text-gray-500">{item.requester?.departmentName || item.requester?.email}</div></div></div></td>
                <td className="px-5 py-4"><div className="flex items-center gap-2 text-sm font-medium text-gray-900">{item.type === 'ROOM' ? <Building2 className="h-4 w-4 text-blue-500" /> : <Car className="h-4 w-4 text-green-500" />}{item.resourceName}</div><div className="mt-1 max-w-[240px] truncate text-xs text-gray-500">{item.purpose}</div></td>
                <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-600"><div>{formatViDateTime(item.startTime)}</div><div className="mt-1 text-gray-400">Xử lý: {formatViDateTime(item.actedAt)}</div></td>
                <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(item.status)}`}>{statusLabel(item.status)}</span>{item.reason && <div className="mt-1 max-w-[180px] truncate text-xs text-gray-500" title={item.reason}>{item.reason}</div>}</td>
                <td className="px-5 py-4 text-sm text-gray-700">{item.approver?.fullName || 'Không rõ'}</td>
                <td className="px-5 py-4 text-right"><Button size="sm" variant="secondary" onClick={() => navigate(`/admin/approvals/${item.bookingId}`)}>Chi tiết</Button></td>
              </tr>
            ))}
            {!loading && result.content.length === 0 && <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">Không có lịch sử phù hợp.</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {loading ? <div className="rounded-xl border bg-white px-4 py-10 text-center text-gray-500">Đang tải...</div> : result.content.map(item => (
          <button key={item.id} type="button" onClick={() => navigate(`/admin/approvals/${item.bookingId}`)} className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm">
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Avatar user={item.requester} /><div className="min-w-0"><div className="truncate text-sm font-medium text-gray-900">{item.requester?.fullName}</div><div className="truncate text-xs text-gray-500">{item.requester?.departmentName || item.requester?.email}</div></div></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${statusClasses(item.status)}`}>{statusLabel(item.status)}</span></div>
            <div className="mt-3 rounded-lg bg-gray-50 p-3"><div className="flex items-center gap-2 text-sm font-medium">{item.type === 'ROOM' ? <Building2 className="h-4 w-4 text-blue-500" /> : <Car className="h-4 w-4 text-green-500" />}{item.resourceName}</div><div className="mt-1 text-xs text-gray-500">{item.purpose}</div></div>
            <div className="mt-3 text-xs text-gray-500">{formatViDateTime(item.startTime)} · xử lý bởi {item.approver?.fullName || 'Không rõ'}</div>
            {item.reason && <div className="mt-2 text-xs text-gray-600">Lý do: {item.reason}</div>}
          </button>
        ))}
        {!loading && result.content.length === 0 && <div className="rounded-xl border bg-white px-4 py-10 text-center text-gray-500">Không có lịch sử phù hợp.</div>}
      </div>

      {result.totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
          <span className="text-gray-500">{result.totalElements} kết quả · Trang {page + 1}/{result.totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={page === 0 || loading} onClick={() => setPage(current => current - 1)}><ChevronLeft className="h-4 w-4" />Trước</Button>
            <Button size="sm" variant="secondary" disabled={page + 1 >= result.totalPages || loading} onClick={() => setPage(current => current + 1)}>Sau<ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}
