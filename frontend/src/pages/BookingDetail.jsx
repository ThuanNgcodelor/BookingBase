import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, User, Clock, FileText, XCircle, Ban } from 'lucide-react';
import { bookingApi } from '../api/bookingApi';
import { approvalApi } from '../api/approvalApi';
import { authApi } from '../api/authApi';
import { Button } from '../components/ui/Button';
import { formatViDateTime } from '../utils/dateTime';
import toast from 'react-hot-toast';

function getRoleLabel(role) {
  if (role === 'ADMIN') return 'Quản trị hệ thống';
  if (role === 'MANAGER') return 'Quản lý';
  return 'Nhân viên';
}

function getActionLabel(status) {
  if (status === 'APPROVED') return 'Đã phê duyệt';
  if (status === 'REJECTED') return 'Đã từ chối';
  if (status === 'CANCELLED') return 'Đã hủy';
  return 'Đang chờ';
}

function getStatusClass(status) {
  if (status === 'APPROVED') return 'text-green-600';
  if (status === 'REJECTED') return 'text-red-600';
  if (status === 'CANCELLED') return 'text-gray-600';
  return 'text-amber-600';
}

function buildCarTitle(request) {
  if (request?.title) return request.title;
  if (request?.departure || request?.destination) {
    return `${request.departure || 'Điểm đi'} - ${request.destination || 'Điểm đến'}`;
  }
  return 'Chi tiết đặt xe';
}

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState(''); // 'ROOM' or 'CAR'
  const [note, setNote] = useState('');
  const [approvalSteps, setApprovalSteps] = useState([]);
  const [showAllApprovalSteps, setShowAllApprovalSteps] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const currentUser = authApi.getUser();
  const isApprover = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const canReject = currentUser?.role === 'ADMIN';
  const canCancel = currentUser?.role === 'ADMIN';

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const [rooms, cars] = await Promise.all([
          bookingApi.getRoomBookings(),
          bookingApi.getCarBookings()
        ]);

        const roomReq = (rooms || []).find(r => r.id === id || `REQ-00${r.id}` === id);
        let selectedRequest = roomReq;
        let selectedType = roomReq ? 'ROOM' : '';

        if (roomReq) {
          selectedRequest = roomReq;
          selectedType = 'ROOM';
        } else {
          const carReq = (cars || []).find(c => c.id === id || `REQ-00${c.id}` === id);
          if (carReq) {
            selectedRequest = carReq;
            selectedType = 'CAR';
          }
        }

        if (selectedRequest) {
          setRequest(selectedRequest);
          setType(selectedType);

          try {
            const steps = selectedType === 'ROOM'
              ? await approvalApi.getRoomApprovalSteps(selectedRequest.id)
              : await approvalApi.getCarApprovalSteps(selectedRequest.id);
            setApprovalSteps(steps || []);
          } catch (stepsError) {
            console.error("Không lấy được lịch sử duyệt:", stepsError);
            setApprovalSteps([]);
          }
        }
      } catch (e) {
        console.error("Lỗi lấy chi tiết:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleApprove = async () => {
    try {
      const payload = { reason: note.trim() || 'Đồng ý duyệt' };
      if (type === 'ROOM') {
        await approvalApi.approveRoom(request.id, payload);
      } else {
        await approvalApi.approveCar(request.id, payload);
      }
      toast.success('Đã phê duyệt thành công!');
      navigate('/admin/approvals');
    } catch (e) {
      toast.error('Lỗi khi phê duyệt: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleReject = async () => {
    try {
      const payload = { reason: note.trim() || null };
      if (type === 'ROOM') {
        await approvalApi.rejectRoom(request.id, payload);
      } else {
        await approvalApi.rejectCar(request.id, payload);
      }
      toast.success('Đã từ chối thành công!');
      navigate('/admin/approvals');
    } catch (e) {
      toast.error('Lỗi khi từ chối: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      if (type === 'ROOM') {
        await bookingApi.cancelRoomBooking(request.id);
      } else {
        await bookingApi.cancelCarBooking(request.id);
      }
      setRequest(current => ({
        ...current,
        status: 'CANCELLED',
        cancelReason: null,
        cancelledBy: currentUser,
      }));
      setShowCancelForm(false);
      toast.success('Đã hủy booking thành công!');
    } catch (e) {
      toast.error('Lỗi khi hủy booking: ' + (e.response?.data?.message || e.message));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;
  if (!request) return <div className="p-8 text-center text-red-500">Không tìm thấy yêu cầu!</div>;

  const resourceName = type === 'ROOM' ? request.room?.name : request.vehicle ? `${request.vehicle.vehicleType?.name} - ${request.vehicle.licensePlate}` : 'Chưa xếp xe';
  const displayTitle = type === 'ROOM'
    ? (request.title || resourceName || 'Chi tiết đặt phòng')
    : buildCarTitle(request);
  const latestApprovalStep = approvalSteps[0];
  const latestReason = latestApprovalStep?.reason;
  const approvers = approvalSteps.map(step => ({
    id: step.id,
    fullName: step.approver?.fullName || 'Không rõ người duyệt',
    avatarUrl: step.approver?.avatarUrl,
    role: step.approver?.role,
    department: {
      name: step.approver?.departmentName || step.approver?.jobPosition || getRoleLabel(step.approver?.role)
    },
    status: step.status
  }));
  const showAllApprovers = showAllApprovalSteps;
  const setShowAllApprovers = setShowAllApprovalSteps;

  return (
    <div className="flex flex-col min-h-full shrink-0 bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a56d6] text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-medium text-sm uppercase tracking-wide">
            {displayTitle}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-start w-full">
        {/* Cột trái (Thông tin chính) */}
        <div className="flex-1 w-full bg-white md:border-r border-gray-100 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 uppercase mb-2">
              {displayTitle}
            </h1>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Trạng thái:</span>
              <span className={`font-semibold ${getStatusClass(request.status)}`}>
                {getActionLabel(request.status)}
              </span>
            </div>

            <h3 className="mt-8 mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Thông tin</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Người tạo</p>
                  <p className="text-sm font-medium text-gray-900">{request.requester?.fullName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bắt đầu lúc</p>
                  <p className="text-sm font-medium text-gray-900">{formatViDateTime(request.startTime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-start-2">
                <Clock className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Kết thúc lúc</p>
                  <p className="text-sm font-medium text-gray-900">{formatViDateTime(request.endTime)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mô tả / Ghi chú</p>
                  <p className="text-sm text-gray-800 leading-relaxed">{request.note || 'Không có ghi chú'}</p>
                  {type === 'CAR' && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p><strong>Điểm đi:</strong> {request.departure}</p>
                      <p><strong>Điểm đến:</strong> {request.destination}</p>
                    </div>
                  )}
                  {type === 'ROOM' && (
                    <div className="mt-2 text-sm text-gray-700">
                      <p><strong>Số người tham gia:</strong> {request.attendeeCount}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Log / Feedback */}
          <div className="bg-gray-50 p-6 flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lịch sử xử lý</h3>

            {latestApprovalStep && (
              <div className={`rounded-lg border bg-white p-4 ${latestApprovalStep.status === 'REJECTED' ? 'border-red-100' : 'border-green-100'}`}>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {latestApprovalStep.status === 'REJECTED' ? (
                    <XCircle className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                  <span className={latestApprovalStep.status === 'REJECTED' ? 'text-red-700' : 'text-green-700'}>
                    {getActionLabel(latestApprovalStep.status)}
                  </span>
                  {latestApprovalStep?.approver?.fullName && (
                    <span className="font-normal text-gray-500">
                      bởi {latestApprovalStep.approver.fullName}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {latestReason || (latestApprovalStep.status === 'REJECTED' ? 'Chưa có lý do từ chối được ghi nhận.' : 'Không có ghi chú phê duyệt.')}
                </p>
                {latestApprovalStep?.actedAt && (
                  <p className="mt-2 text-xs text-gray-400">{formatViDateTime(latestApprovalStep.actedAt)}</p>
                )}
              </div>
            )}

            {request.status === 'CANCELLED' && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Ban className="h-4 w-4" />
                  Đã hủy booking
                  {request.cancelledBy?.fullName && <span className="font-normal text-gray-500">bởi {request.cancelledBy.fullName}</span>}
                </div>
                {request.cancelReason && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{request.cancelReason}</p>}
              </div>
            )}

            {request.status === 'PENDING' && isApprover && (
              <>
                <div className="mt-2 mb-4 flex items-center gap-2 border border-gray-200 bg-white rounded-full px-4 py-2 shadow-sm">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Nhập ghi chú (không bắt buộc)..."
                    className="flex-1 outline-none text-sm bg-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700 text-white">Phê duyệt</Button>
                  {canReject && (
                    <Button onClick={handleReject} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Từ chối</Button>
                  )}
                </div>
              </>
            )}

            {request.status === 'APPROVED' && canCancel && !showCancelForm && (
              <div className="mt-4">
                <Button variant="danger" onClick={() => setShowCancelForm(true)}>
                  <Ban className="mr-1.5 h-4 w-4" />Hủy booking
                </Button>
              </div>
            )}

            {request.status === 'APPROVED' && canCancel && showCancelForm && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="font-semibold text-red-800">Bạn có chắc muốn hủy booking này?</div>
                <p className="mt-1 text-sm text-red-700">Booking đang ở trạng thái đã phê duyệt. Sau khi hủy, lịch phòng/xe sẽ được giải phóng và người đặt sẽ nhận được thông báo.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="danger" disabled={cancelling} onClick={handleCancel}>{cancelling ? 'Đang hủy...' : 'Xác nhận hủy'}</Button>
                  <Button variant="secondary" disabled={cancelling} onClick={() => setShowCancelForm(false)}>Giữ booking</Button>
                </div>
              </div>
            )}

            {/* Chỗ này có thể mở rộng log step sau này */}
          </div>
        </div>

        {/* Cột phải (Tài nguyên) */}
        <div className="w-full md:w-80 bg-gray-50 flex flex-col shrink-0 border-t md:border-t-0 md:border-l border-gray-100 min-h-full">
          {/* Người Duyệt */}
          <div className="p-4 border-b border-gray-100 bg-[#fbfbfb]">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Người Duyệt</h3>
            <div className="space-y-3">
              {(showAllApprovers ? approvers : approvers.slice(0, 2)).map(approver => (
                <div key={approver.id} className="flex items-start justify-between bg-white p-3 border border-gray-100 rounded shadow-sm">
                  <div className="flex items-start gap-3">
                    {approver.avatarUrl ? (
                      <img src={approver.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${approver.role === 'ADMIN' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {approver.fullName?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{approver.fullName}</p>
                      <p className="text-[11px] text-gray-500 leading-tight">
                        {approver.department?.name || (approver.role === 'ADMIN' ? 'Quản trị hệ thống' : 'Quản lý')}
                      </p>
                    </div>
                  </div>
                  {approver.status === 'APPROVED' ? (
                    <div className="w-3 h-3 rounded-full bg-green-500 shrink-0 mt-2 border-2 border-white shadow-sm" title="Đã duyệt"></div>
                  ) : approver.status === 'REJECTED' ? (
                    <div className="w-3 h-3 rounded-full bg-red-500 shrink-0 mt-2 border-2 border-white shadow-sm" title="Đã từ chối"></div>
                  ) : (
                    <div className="w-3 h-3 rounded-full border-2 border-green-400 shrink-0 mt-2" title="Chờ duyệt"></div>
                  )}
                </div>
              ))}
              
              {approvers.length > 2 && (
                <button 
                  onClick={() => setShowAllApprovers(!showAllApprovers)}
                  className="w-full text-xs text-blue-600 font-medium py-1.5 hover:bg-blue-50 rounded transition-colors text-center mt-2 border border-dashed border-blue-200"
                >
                  {showAllApprovers ? 'Thu gọn' : `Xem thêm ${approvers.length - 2} lần xử lý`}
                </button>
              )}

              {approvalSteps.length === 0 && (
                <div className="bg-white p-3 border border-gray-100 rounded shadow-sm">
                  <p className="text-sm font-semibold text-gray-900">
                    {request.status === 'PENDING' ? 'Chưa có người duyệt' : 'Chưa có lịch sử duyệt'}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 leading-tight">
                    {request.status === 'PENDING'
                      ? 'Yêu cầu đang chờ ADMIN hoặc MANAGER xử lý.'
                      : 'Booking này có thể là dữ liệu cũ trước khi lưu lịch sử duyệt.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Thông tin Tài nguyên</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">Tên {type === 'ROOM' ? 'Phòng' : 'Xe'}</p>
                <p className="text-sm font-medium text-gray-900">{resourceName}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1 flex items-center gap-1">Người quản lý</p>
                <p className="text-sm text-gray-500">Chưa cấu hình</p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
