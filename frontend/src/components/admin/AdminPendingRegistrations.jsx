import React, { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '../../api/userApi';
import { formatViDateTime } from '../../utils/dateTime';
import { Button } from '../ui/Button';

export default function AdminPendingRegistrations({ onCountChange }) {
  const [result, setResult] = useState({ content: [], totalElements: 0, totalPages: 0 });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadPending = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.getPendingRegistrations(page, 10);
      setResult(data);
      onCountChange?.(data.totalElements || 0);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải tài khoản chờ duyệt');
    } finally {
      setLoading(false);
    }
  }, [onCountChange, page]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const approve = async (account) => {
    if (!window.confirm(`Phê duyệt tài khoản ${account.fullName} (${account.email})?`)) return;
    setProcessingId(account.id);
    try {
      await userApi.approveRegistration(account.id);
      toast.success('Đã phê duyệt tài khoản');
      await loadPending();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể phê duyệt tài khoản');
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (account) => {
    const reason = window.prompt(`Lý do từ chối ${account.fullName} (có thể để trống):`, '');
    if (reason === null) return;
    setProcessingId(account.id);
    try {
      await userApi.rejectRegistration(account.id, reason.trim() || null);
      toast.success('Đã từ chối tài khoản');
      await loadPending();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể từ chối tài khoản');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="rounded-xl border bg-white px-4 py-12 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr><th className="px-5 py-4">Người đăng ký</th><th className="px-5 py-4">Thời điểm</th><th className="px-5 py-4 text-right">Xử lý</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.content.map(account => (
                <tr key={account.id}>
                  <td className="px-5 py-4"><div className="font-medium text-gray-900">{account.fullName}</div><div className="text-sm text-gray-500">{account.email}</div></td>
                  <td className="px-5 py-4 text-sm text-gray-600"><span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{formatViDateTime(account.registeredAt)}</span></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-2"><Button size="sm" disabled={processingId === account.id} onClick={() => approve(account)}><Check className="mr-1 h-4 w-4" />Duyệt</Button><Button size="sm" variant="danger" disabled={processingId === account.id} onClick={() => reject(account)}><X className="mr-1 h-4 w-4" />Từ chối</Button></div></td>
                </tr>
              ))}
              {result.content.length === 0 && <tr><td colSpan="3" className="px-5 py-12 text-center text-gray-500">Không có tài khoản chờ duyệt.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-100 md:hidden">
          {result.content.map(account => (
            <div key={account.id} className="p-4"><div className="font-medium text-gray-900">{account.fullName}</div><div className="text-sm text-gray-500">{account.email}</div><div className="mt-2 text-xs text-gray-400">{formatViDateTime(account.registeredAt)}</div><div className="mt-4 flex gap-2"><Button className="flex-1" size="sm" disabled={processingId === account.id} onClick={() => approve(account)}>Duyệt</Button><Button className="flex-1" size="sm" variant="danger" disabled={processingId === account.id} onClick={() => reject(account)}>Từ chối</Button></div></div>
          ))}
          {result.content.length === 0 && <div className="px-4 py-12 text-center text-gray-500">Không có tài khoản chờ duyệt.</div>}
        </div>
      </div>

      {result.totalPages > 1 && <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm"><span>{result.totalElements} tài khoản · Trang {page + 1}/{result.totalPages}</span><div className="flex gap-2"><Button size="sm" variant="secondary" disabled={page === 0} onClick={() => setPage(value => value - 1)}><ChevronLeft className="h-4 w-4" />Trước</Button><Button size="sm" variant="secondary" disabled={page + 1 >= result.totalPages} onClick={() => setPage(value => value + 1)}>Sau<ChevronRight className="h-4 w-4" /></Button></div></div>}
    </div>
  );
}
