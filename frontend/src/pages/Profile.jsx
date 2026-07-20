import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { profileRequestApi } from '../api/profileRequestApi';
import PushNotificationSettings from '../components/PushNotificationSettings';
import { formatViDateTime } from '../utils/dateTime';

const POSITION_OPTIONS = [
  'Nhân viên',
  'Chuyên viên',
  'Tổ trưởng',
  'Phó phòng',
  'Trưởng phòng',
  'Phó giám đốc',
  'Tổng giám đốc',
];

export default function Profile() {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [user, setUser] = useState(authApi.getUser() || {});
  const [departments, setDepartments] = useState([]);
  const [latestRequest, setLatestRequest] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    avatarUrl: '',
    departmentId: '',
    position: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [me, departmentList, request] = await Promise.all([
          userApi.getMe(),
          userApi.getDepartments(),
          profileRequestApi.getCurrent().catch(() => null),
        ]);

        if (!active) return;

        setUser(me || {});
        setDepartments(departmentList || []);
        setLatestRequest(request || null);
        authApi.updateUser(me || {});

        setForm({
          fullName: me?.fullName || '',
          avatarUrl: me?.avatarUrl || '',
          departmentId: me?.departmentId || '',
          position: me?.position || 'Nhân viên',
        });
      } catch (error) {
        console.error(error);
        toast.error('Không thể tải thông tin tài khoản');
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const departmentName = useMemo(() => {
    return departments.find((item) => item.id === form.departmentId)?.name || user.departmentName || '';
  }, [departments, form.departmentId, user.departmentName]);

  const hasPendingRequest = latestRequest?.status === 'PENDING';
  const avatarSrc = form.avatarUrl || user.avatarUrl || '';

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Ảnh không được lớn hơn 3MB');
      return;
    }

    try {
      const resized = await resizeImageToDataUrl(file, 512, 0.9);
      setForm((prev) => ({ ...prev, avatarUrl: resized }));
      setImageError(false);
    } catch (error) {
      console.error(error);
      toast.error('Không thể xử lý ảnh. Vui lòng thử file khác.');
    } finally {
      event.target.value = '';
    }
  };

  const handleAvatarSave = async () => {
    if (!form.avatarUrl || form.avatarUrl === user.avatarUrl) {
      toast.error('Vui lòng chọn một ảnh đại diện mới');
      return;
    }

    setAvatarSaving(true);
    try {
      const updatedUser = await userApi.updateAvatar(form.avatarUrl);
      setUser(updatedUser);
      setForm((prev) => ({ ...prev, avatarUrl: updatedUser.avatarUrl || '' }));
      authApi.updateUser(updatedUser);
      toast.success('Đã cập nhật ảnh đại diện');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Cập nhật ảnh đại diện thất bại');
    } finally {
      setAvatarSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setPasswordSaving(true);
    try {
      await userApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Đổi mật khẩu thành công');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Đổi mật khẩu thất bại');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (hasPendingRequest) {
      toast.error('Bạn đang có một yêu cầu chờ duyệt');
      return;
    }

    if (!form.fullName.trim()) {
      toast.error('Họ và tên không được để trống');
      return;
    }

    if (!form.departmentId) {
      toast.error('Vui lòng chọn phòng ban');
      return;
    }

    if (!form.position) {
      toast.error('Vui lòng chọn chức vụ');
      return;
    }

    setSubmitting(true);
    try {
      const submitted = await profileRequestApi.submit({
        fullName: form.fullName.trim(),
        departmentId: form.departmentId,
        position: form.position,
      });

      setLatestRequest(submitted);
      toast.success('Đã gửi yêu cầu cập nhật hồ sơ. Vui lòng chờ admin phê duyệt.');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Gửi yêu cầu thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
        Đang tải thông tin hồ sơ...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-5 sm:mb-8">
        <h1 className="text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">Thiết lập tài khoản</h1>
        <p className="mt-1 text-sm text-gray-500 sm:text-base">Quản lý thông tin cá nhân và trạng thái yêu cầu cập nhật của bạn.</p>
      </div>

      {latestRequest && (
        <div
          className={`mb-5 rounded-lg border px-3 py-3 text-sm sm:px-4 ${
            latestRequest.status === 'PENDING'
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : latestRequest.status === 'APPROVED'
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <div className="font-medium">
            Yêu cầu gần nhất: {latestRequest.status === 'PENDING' ? 'đang chờ duyệt' : latestRequest.status === 'APPROVED' ? 'đã được duyệt' : 'đã bị từ chối'}
          </div>
          <div className="mt-1 text-xs leading-5">
            {latestRequest.requestedAt ? `Gửi lúc ${formatViDateTime(latestRequest.requestedAt)}.` : ''}
            {latestRequest.reviewReason ? ` Lý do: ${latestRequest.reviewReason}` : ''}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="w-full lg:w-1/3">
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="h-20 bg-gradient-to-r from-blue-600 to-sky-500 sm:h-28" />
            <div className="px-4 pb-5 text-center -mt-10 sm:px-6 sm:pb-6 sm:-mt-12">
              <button
                type="button"
                onClick={handleAvatarPick}
                className="relative mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-md sm:h-28 sm:w-28"
              >
                {avatarSrc && !imageError ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-100 text-2xl font-semibold text-gray-600 sm:text-3xl">
                    {(form.fullName || user.fullName || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1 text-[10px] font-medium text-white">
                  Nhấn để đổi ảnh
                </span>
              </button>

              <div className="mt-3 sm:mt-4">
                <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">{form.fullName || user.fullName || 'Người dùng'}</h2>
                <p className="mt-1 text-sm text-gray-500">{departmentName || 'Chưa có phòng ban'}</p>
                <p className="mt-1 text-sm text-gray-500">{form.position || user.position || 'Nhân viên'}</p>
              </div>

              <div className="mt-4 text-left">
                <div className="rounded-lg bg-gray-50 px-3 py-3 text-sm text-gray-600 sm:px-4">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Email</div>
                  <div className="mt-1 break-all text-gray-900">{user.email}</div>
                </div>
              </div>

              <Button
                type="button"
                className="mt-4 w-full"
                onClick={handleAvatarSave}
                disabled={avatarSaving || !form.avatarUrl || form.avatarUrl === user.avatarUrl}
              >
                {avatarSaving ? 'Đang lưu ảnh...' : 'Lưu ảnh đại diện'}
              </Button>
              <p className="mt-2 text-xs text-gray-500">Ảnh đại diện được cập nhật ngay, không cần admin phê duyệt.</p>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 space-y-5 sm:space-y-6">
          <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <h3 className="mb-4 text-base font-semibold text-gray-900 sm:mb-6 sm:text-lg">Thông tin cơ bản</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Họ và tên</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Địa chỉ Email</label>
                <input
                  type="email"
                  value={user.email || ''}
                  readOnly
                  className="w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500 outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Phòng ban công tác</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm((prev) => ({ ...prev, departmentId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Chức vụ</label>
                <select
                  value={form.position}
                  onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chọn chức vụ</option>
                  {POSITION_OPTIONS.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <div className="mt-6 flex items-center justify-end gap-3 sm:mt-8">
              <Button type="submit" disabled={submitting || hasPendingRequest}>
                {submitting ? 'Đang gửi...' : hasPendingRequest ? 'Đang chờ duyệt' : 'Gửi yêu cầu cập nhật'}
              </Button>
            </div>
          </form>

          <form onSubmit={handlePasswordSubmit} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <h3 className="text-base font-semibold text-gray-900 sm:text-lg">Đổi mật khẩu</h3>
            <p className="mt-1 text-sm text-gray-500">Nhập mật khẩu hiện tại để xác nhận thay đổi.</p>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Mật khẩu mới</label>
                <input
                  type="password"
                  minLength={6}
                  maxLength={100}
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  minLength={6}
                  maxLength={100}
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? 'Đang đổi mật khẩu...' : 'Đổi mật khẩu'}
              </Button>
            </div>
          </form>

          <PushNotificationSettings />
        </div>
      </div>
    </div>
  );
}

async function resizeImageToDataUrl(file, maxSize = 512, quality = 0.9) {
  const imageUrl = await readFileAsDataUrl(file);
  const image = await loadImage(imageUrl);

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context not available');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', quality);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = src;
  });
}
