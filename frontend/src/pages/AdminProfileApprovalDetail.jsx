import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';
import { profileRequestApi } from '../api/profileRequestApi';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';
import { formatViDateTime } from '../utils/dateTime';

export default function AdminProfileApprovalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('');
  const currentUser = authApi.getUser();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await profileRequestApi.getPending();
        setRequests(Array.isArray(data) ? data : data?.content || []);
      } catch (error) {
        console.error(error);
        toast.error('Không thể tải chi tiết yêu cầu hồ sơ');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const request = useMemo(
    () => requests.find((item) => item.id === id) || null,
    [id, requests]
  );

  const handleApprove = async () => {
    if (!request) return;
    try {
      await profileRequestApi.approve(request.id, currentUser.id);
      toast.success('Đã phê duyệt yêu cầu hồ sơ');
      navigate('/admin/profile-approvals');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Phê duyệt thất bại');
    }
  };

  const handleReject = async () => {
    if (!request) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await profileRequestApi.reject(request.id, currentUser.id, rejectReason.trim());
      toast.success('Đã từ chối yêu cầu hồ sơ');
      navigate('/admin/profile-approvals');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Từ chối thất bại');
    }
  };

  const renderAvatar = (avatarUrl, name, sizeClass = 'h-12 w-12') => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={name}
          referrerPolicy="no-referrer"
          className={`${sizeClass} rounded-full object-cover border border-gray-200`}
        />
      );
    }
    return (
      <div className={`flex ${sizeClass} items-center justify-center rounded-full border border-gray-200 bg-blue-100 text-sm font-semibold text-blue-700`}>
        {(name || 'U').charAt(0).toUpperCase()}
      </div>
    );
  };

  const renderField = (label, currentValue, requestedValue) => (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-gray-400">Hiện tại</div>
          <div className="mt-1 break-words text-sm text-gray-700">{currentValue || 'Trống'}</div>
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-blue-500">Đề nghị</div>
          <div className="mt-1 break-words text-sm text-gray-900">{requestedValue || 'Trống'}</div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
        Đang tải...
      </div>
    );
  }

  if (!request) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
        Không tìm thấy yêu cầu này hoặc yêu cầu đã được xử lý.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full shrink-0 bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-[#1a56d6] text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/profile-approvals')} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm uppercase tracking-wide">
            {request.requester?.fullName || request.currentFullName}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start w-full">
        <div className="flex-1 w-full bg-white md:border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 uppercase mb-2">
              {request.requester?.fullName || request.currentFullName}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Trạng thái:</span>
              <span className="font-semibold text-amber-600">PENDING</span>
            </div>

            <h3 className="mt-8 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Thông tin</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {renderAvatar(request.requester?.avatarUrl, request.requester?.fullName || request.currentFullName)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Người tạo</p>
                  <p className="text-sm font-medium text-gray-900">{request.requester?.fullName || request.currentFullName}</p>
                  <p className="text-xs text-gray-500 mt-1">{request.requester?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0 mt-0.5"></div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Gửi lúc</p>
                  <p className="text-sm font-medium text-gray-900">{formatViDateTime(request.requestedAt)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="w-5 h-5 rounded-full bg-gray-200 shrink-0 mt-0.5"></div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mô tả yêu cầu</p>
                  <p className="text-sm text-gray-800 leading-relaxed">Yêu cầu cập nhật hồ sơ cá nhân của nhân viên.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Xử lý yêu cầu</h3>

            <div className="space-y-4">
              {renderField('Họ và tên', request.currentFullName, request.requestedFullName)}
              {renderField(
                'Phòng ban',
                request.currentDepartmentName,
                request.requestedDepartment?.name || request.requestedDepartmentName
              )}
              {renderField('Chức vụ', request.currentPosition, request.requestedPosition)}

              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Ảnh đại diện hiện tại</div>
                <div className="mt-3 flex items-center gap-3">
                  {renderAvatar(request.requester?.avatarUrl, request.requester?.fullName || request.currentFullName)}
                  <p className="text-xs leading-5 text-gray-500">Ảnh đại diện được người dùng cập nhật trực tiếp và không thuộc nội dung cần phê duyệt.</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-100 bg-white p-3">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                  Lý do từ chối
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Nhập lý do nếu cần từ chối..."
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">
                  Phê duyệt
                </Button>
                <Button onClick={handleReject} variant="secondary" className="text-red-600 border-red-200 hover:bg-red-50">
                  Từ chối
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 bg-gray-50 flex flex-col shrink-0 border-t md:border-t-0 md:border-l border-gray-100 min-h-full">
          <div className="p-4 border-b border-gray-100 bg-[#fbfbfb]">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Người duyệt</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between bg-white p-3 border border-gray-100 rounded shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    {renderAvatar(currentUser?.avatarUrl, currentUser?.fullName || 'Admin', 'h-8 w-8')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{currentUser?.fullName}</p>
                    <p className="text-[11px] text-gray-500 leading-tight">Quản trị hệ thống</p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-green-500 shrink-0 mt-2 border-2 border-white shadow-sm" title="Sẵn sàng xử lý"></div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Thông tin hồ sơ</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-gray-500 mb-1">Phòng ban hiện tại</p>
                <p className="text-sm font-medium text-gray-900">{request.currentDepartmentName || 'Trống'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1">Chức vụ hiện tại</p>
                <p className="text-sm font-medium text-gray-900">{request.currentPosition || 'Trống'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
