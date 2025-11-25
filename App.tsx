
import React, { useState, useRef, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, ShoppingBag, Users, Sparkles, LogOut, Bell, Menu, X, Globe, Clock, Check, AlertTriangle, Info, AlertCircle, Filter, XCircle, ChevronLeft, ChevronRight, Wallet, FileText, RefreshCw, Shield, FileCheck, DollarSign, Upload, Star, Plus, Search, UserCheck, Briefcase, ThumbsUp, ThumbsDown, Trash2, Edit2, Download, Moon, Sun, Plane, RefreshCcw, CreditCard, Smartphone, ArrowRight, MapPin, CalendarX, ClipboardList, CheckCircle } from 'lucide-react';
import { useLanguage } from './context/LanguageContext';
import { CURRENT_USER, MOCK_SHIFTS, MOCK_DOCTORS, MOCK_NOTIFICATIONS, MOCK_CREDENTIALS, MOCK_TRANSACTIONS, MOCK_LEAVE_REQUESTS, MOCK_PAYMENT_METHODS } from './constants';
import { LanguageCode, Notification, Shift, ShiftStatus, Credential, WalletTransaction, ShiftType, Doctor, UserRole, LeaveRequest, PaymentMethod } from './types';
import DashboardStats from './components/DashboardStats';
import AIModal from './components/AIModal';
import { suggestMarketplaceMatches } from './services/geminiService';
import { processWithdrawal } from './services/stripeService';

// --- Toast Component & System ---
interface ToastProps {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const colors = {
    success: 'bg-emerald-500 border-emerald-600 text-white',
    error: 'bg-red-500 border-red-600 text-white',
    info: 'bg-blue-500 border-blue-600 text-white',
    warning: 'bg-amber-500 border-amber-600 text-white',
  };

  const icons = {
    success: <Check size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />,
    warning: <AlertTriangle size={18} />
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border ${colors[type]} animate-slide-in-right mb-3 min-w-[300px] backdrop-blur-md bg-opacity-95`}>
      <div className="bg-white/20 p-1 rounded-full">{icons[type]}</div>
      <p className="text-sm font-medium flex-1">{message}</p>
      <button onClick={() => onClose(id)} className="hover:bg-white/20 p-1 rounded-full transition"><X size={14} /></button>
    </div>
  );
};

const ToastContainer = ({ toasts, removeToast }: { toasts: any[], removeToast: (id: number) => void }) => (
  <div className="fixed top-6 right-6 z-[100] flex flex-col items-end pointer-events-none">
    <div className="pointer-events-auto">
      {toasts.map(t => <Toast key={t.id} {...t} onClose={removeToast} />)}
    </div>
  </div>
);

// --- Components ---

const NotificationDropdown = ({ notifications, onMarkAllRead }: { notifications: Notification[], onMarkAllRead: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
     if (notification.actionLink) {
        navigate(notification.actionLink);
        setIsOpen(false);
     }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full relative transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"></span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-3 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-scale ${isRTL ? 'left-0' : 'right-0'}`}>
          <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200">{t('notifications')}</h3>
            <button onClick={onMarkAllRead} className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline font-medium">{t('markRead')}</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
               <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                  <Bell size={32} className="mb-2 opacity-20" />
                  No notifications
               </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${!notification.isRead ? 'bg-indigo-50/40 dark:bg-indigo-900/20' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 ${
                      notification.type === 'warning' ? 'text-amber-500' : 
                      notification.type === 'success' ? 'text-emerald-500' : 'text-blue-500'
                    }`}>
                      {notification.type === 'warning' ? <AlertTriangle size={16} /> : 
                       notification.type === 'success' ? <Check size={16} /> : <Info size={16} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{notification.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{notification.message}</p>
                      <span className="text-[10px] text-gray-400 mt-2 block">{notification.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Page Components ---

interface FindDoctorModalProps {
  shift: Shift | null;
  doctors: Doctor[];
  onClose: () => void;
  onAssign: (doctorId: string, doctorName: string) => void;
}

const FindDoctorModal = ({ shift, doctors, onClose, onAssign }: FindDoctorModalProps) => {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    if (shift) {
      setLoading(true);
      suggestMarketplaceMatches(shift, doctors).then(jsonText => {
        try {
           const parsed = JSON.parse(jsonText);
           setRecommendations(parsed.recommendations || []);
        } catch (e) {
           console.error("Failed to parse AI recommendations", e);
           // Fallback mock
           setRecommendations([
             { name: "Dr. Sarah Ahmed", reason: "Matches specialty and location.", id: "d1" },
             { name: "Dr. John Doe", reason: "High rating and available.", id: "d2" }
           ]);
        }
        setLoading(false);
      });
    }
  }, [shift, doctors]);

  if (!shift) return null;

  return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-scale">
          <div className="bg-indigo-600 p-4 flex justify-between items-center text-white bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-opacity-10">
             <div className="flex items-center gap-2">
               <Sparkles size={18} />
               <h3 className="font-bold">AI Recommendations</h3>
             </div>
             <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20}/></button>
          </div>
          <div className="p-6">
             <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Best matches for <strong>{shift.specialtyRequired}</strong> at <strong>{shift.centerName}</strong>:
             </p>
             
             {loading ? (
                <div className="flex flex-col items-center justify-center py-8 text-indigo-600">
                   <RefreshCw className="animate-spin mb-2" />
                   <span className="text-xs font-medium animate-pulse">Finding best matches...</span>
                </div>
             ) : (
                <div className="space-y-3">
                   {recommendations.map((rec, i) => {
                      const doctor = doctors.find(d => d.name === rec.name);
                      const doctorId = doctor?.id || rec.id || 'd1';

                      return (
                        <div key={i} className="border dark:border-gray-700 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition flex justify-between items-center group">
                           <div>
                              <div className="font-bold text-gray-800 dark:text-gray-200">{rec.name}</div>
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1"><Sparkles size={10}/> {rec.reason}</div>
                           </div>
                           <button 
                              onClick={() => onAssign(doctorId, rec.name)}
                              className="bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 p-2 rounded-full hover:bg-indigo-600 hover:text-white transition shadow-sm"
                              title="Assign Doctor"
                           >
                              <UserCheck size={18} />
                           </button>
                        </div>
                      );
                   })}
                </div>
             )}
          </div>
       </div>
     </div>
  );
};

// --- New Component: Leave Request Modal ---
const LeaveRequestModal = ({ onClose, onSubmit }: { onClose: () => void, onSubmit: (leave: Partial<LeaveRequest>) => void }) => {
   const { t } = useLanguage();
   const [formData, setFormData] = useState({
     startDate: '',
     endDate: '',
     type: 'Annual Leave',
     reason: ''
   });

   const handleSubmit = () => {
      onSubmit(formData as any);
      onClose();
   };

   return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-scale">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b dark:border-gray-700 flex justify-between items-center">
             <h3 className="font-bold text-gray-800 dark:text-white">{t('requestTimeOff')}</h3>
             <button onClick={onClose}><X size={20} className="dark:text-gray-400"/></button>
          </div>
          <div className="p-6 space-y-4">
             <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Leave Type</label>
                <select 
                   className="w-full border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                   value={formData.type}
                   onChange={e => setFormData({...formData, type: e.target.value})}
                >
                   <option>Annual Leave</option>
                   <option>Sick Leave</option>
                   <option>Conference / Training</option>
                   <option>Emergency</option>
                </select>
             </div>
             <div className="grid grid-cols-2 gap-2">
               <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Start Date</label>
                  <input type="date" className="w-full border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded p-2 text-sm" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">End Date</label>
                  <input type="date" className="w-full border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded p-2 text-sm" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
               </div>
             </div>
             <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Reason (Optional)</label>
                <textarea 
                   className="w-full border dark:border-gray-700 dark:bg-gray-700 dark:text-white rounded p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                   rows={3}
                   value={formData.reason}
                   onChange={e => setFormData({...formData, reason: e.target.value})}
                />
             </div>
             <button onClick={handleSubmit} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none transform active:scale-95">Submit Request</button>
          </div>
       </div>
    </div>
   );
};

// --- Updated Approvals Widget (Handling Leave) ---
const ApprovalsWidget = ({ shifts, leaveRequests, onApprove, onReject, onApproveLeave, onRejectLeave }: { 
  shifts: Shift[], 
  leaveRequests: LeaveRequest[],
  onApprove: (shift: Shift) => void, 
  onReject: (shift: Shift) => void,
  onApproveLeave: (leave: LeaveRequest) => void,
  onRejectLeave: (leave: LeaveRequest) => void
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'shifts' | 'leave'>('shifts');

  const pendingShifts = shifts.filter(s => 
    s.status === ShiftStatus.PENDING_APPROVAL || 
    s.status === ShiftStatus.TIMESHEET_SUBMITTED || 
    s.status === ShiftStatus.PENDING_SWAP
  );

  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');

  const totalAction = pendingShifts.length + pendingLeaves.length;

  if (totalAction === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8 animate-fade-in">
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
          <FileCheck size={20} />
          {t('approvals')} ({totalAction})
        </h3>
        <div className="flex gap-2">
           <button 
              onClick={() => setActiveTab('shifts')}
              className={`text-xs px-3 py-1 rounded-full transition ${activeTab === 'shifts' ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
           >
              Shifts ({pendingShifts.length})
           </button>
           <button 
              onClick={() => setActiveTab('leave')}
              className={`text-xs px-3 py-1 rounded-full transition ${activeTab === 'leave' ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
           >
              Time Off ({pendingLeaves.length})
           </button>
        </div>
      </div>
      
      <div className="divide-y dark:divide-gray-700 max-h-80 overflow-y-auto">
        {activeTab === 'shifts' && pendingShifts.map(shift => (
          <div key={shift.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  shift.status === ShiftStatus.TIMESHEET_SUBMITTED ? 'bg-purple-100 text-purple-700' :
                  shift.status === ShiftStatus.PENDING_APPROVAL ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {shift.status === ShiftStatus.TIMESHEET_SUBMITTED ? 'Timesheet' : 
                   shift.status === ShiftStatus.PENDING_APPROVAL ? 'Application' : 'Swap Request'}
                </span>
                <span className="text-xs text-gray-400">{shift.date}</span>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">{shift.centerName}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {shift.status === ShiftStatus.TIMESHEET_SUBMITTED 
                  ? `Verified: ${shift.timesheet?.actualStartTime} - ${shift.timesheet?.actualEndTime}`
                  : `${shift.specialtyRequired} • ${shift.startTime} - ${shift.endTime}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onReject(shift)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:bg-red-900/30 rounded-full transition"><ThumbsDown size={18} /></button>
              <button onClick={() => onApprove(shift)} className="p-2 text-green-600 hover:text-white hover:bg-green-600 bg-green-50 dark:bg-green-900/20 rounded-full transition shadow-sm"><Check size={18} /></button>
            </div>
          </div>
        ))}

        {activeTab === 'leave' && pendingLeaves.map(leave => (
           <div key={leave.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                       {leave.type}
                    </span>
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{leave.doctorName}</span>
                 </div>
                 <h4 className="font-semibold text-gray-800 dark:text-gray-200">{leave.startDate} to {leave.endDate}</h4>
                 <p className="text-xs text-gray-500 dark:text-gray-400 italic">"{leave.reason}"</p>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={() => onRejectLeave(leave)} className="p-2 text-gray-400 hover:text-red-500 dark:hover:bg-red-900/30 rounded-full transition"><X size={18} /></button>
                 <button onClick={() => onApproveLeave(leave)} className="p-2 text-green-600 hover:text-white hover:bg-green-600 bg-green-50 dark:bg-green-900/20 rounded-full transition shadow-sm"><Check size={18} /></button>
              </div>
           </div>
        ))}
      </div>
    </div>
  );
};

interface DashboardProps {
  shifts: Shift[];
  leaveRequests: LeaveRequest[];
  onOpenAI: () => void;
  onFindDoctor: (shift: Shift) => void;
  onApprove: (shift: Shift) => void;
  onReject: (shift: Shift) => void;
  onApproveLeave: (leave: LeaveRequest) => void;
  onRejectLeave: (leave: LeaveRequest) => void;
  userRole: UserRole;
}

const Dashboard = ({ shifts, leaveRequests, onOpenAI, onFindDoctor, onApprove, onReject, onApproveLeave, onRejectLeave, userRole }: DashboardProps) => {
  const { t } = useLanguage();
  const urgentShifts = shifts.filter(s => s.status === ShiftStatus.OPEN && s.dueDate).slice(0, 3);
  const isManager = userRole === UserRole.ROTA_MANAGER || userRole === UserRole.CENTER_ADMIN;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('welcome')}</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('welcomeSub')}</p>
        </div>
        {isManager && (
          <button 
            onClick={onOpenAI}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:scale-105 flex items-center gap-2"
          >
              <Sparkles size={16} />
              <span>{t('aiAssistant')}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300">
             <div className="text-blue-100 text-sm font-medium mb-1">{t('totalShifts')}</div>
             <div className="text-4xl font-bold">{shifts.length}</div>
             <div className="text-xs text-blue-100 mt-2 opacity-80">Active in current period</div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300">
             <div className="text-emerald-100 text-sm font-medium mb-1">{t('assigned')}</div>
             <div className="text-4xl font-bold">{shifts.filter(s => s.status === ShiftStatus.ASSIGNED || s.status === ShiftStatus.COMPLETED || s.status === ShiftStatus.TIMESHEET_SUBMITTED || s.status === ShiftStatus.PAID).length}</div>
             <div className="text-xs text-emerald-100 mt-2 opacity-80">Coverage confirmed</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-6 text-white shadow-xl transform hover:scale-[1.02] transition-all duration-300">
             <div className="text-amber-100 text-sm font-medium mb-1">{t('openSpots')}</div>
             <div className="text-4xl font-bold">{shifts.filter(s => s.status === ShiftStatus.OPEN).length}</div>
             <div className="text-xs text-amber-100 mt-2 opacity-80">Urgent coverage needed</div>
          </div>
      </div>

      {isManager && <ApprovalsWidget 
         shifts={shifts} 
         leaveRequests={leaveRequests}
         onApprove={onApprove} 
         onReject={onReject} 
         onApproveLeave={onApproveLeave}
         onRejectLeave={onRejectLeave}
      />}

      <DashboardStats shifts={shifts} />

      {/* Urgent Tasks */}
      {isManager && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
            <h3 className="font-bold text-gray-800 dark:text-gray-200">{t('urgentTasks')}</h3>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium animate-pulse">{t('actionRequired')}</span>
          </div>
          <div className="divide-y dark:divide-gray-700">
            {urgentShifts.length > 0 ? urgentShifts.map(shift => (
              <div key={shift.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                <div className="flex items-center gap-4">
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-red-500 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 transition">{shift.centerName}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{shift.specialtyRequired} • {shift.date}</p>
                    {shift.dueDate && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
                        <AlertCircle size={10} />
                        <span>Due by: {shift.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => onFindDoctor(shift)}
                  className="text-sm border border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition flex items-center gap-1 font-medium"
                >
                  <Search size={14} />
                  {t('findDoctor')}
                </button>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center">
                 <CheckCircle size={32} className="text-green-500 mb-2 opacity-50" />
                 Great job! No urgent tasks pending.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface CreateShiftModalProps {
  onClose: () => void;
  onCreate: (shift: Shift) => void;
}

const CreateShiftModal = ({ onClose, onCreate }: CreateShiftModalProps) => {
  const { t } = useLanguage();
  // Dynamic Default Date: Tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Shift>>({
    centerName: 'Central City Hospital',
    date: tomorrowStr,
    type: ShiftType.MORNING,
    startTime: '08:00',
    endTime: '16:00',
    specialtyRequired: 'Emergency Medicine',
    rate: 100,
    dueDate: tomorrowStr,
    location: 'Riyadh'
  });

  const handleSubmit = () => {
    const newShift: Shift = {
      id: `s-${Date.now()}`,
      status: ShiftStatus.OPEN,
      ...formData as Shift
    };
    onCreate(newShift);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-scale">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b dark:border-gray-700 flex justify-between items-center">
             <h3 className="font-bold text-gray-800 dark:text-white">{t('postShift')}</h3>
             <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
          </div>
          <div className="p-6 space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">{t('centerName')}</label>
                  <input 
                    type="text" 
                    className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.centerName}
                    onChange={e => setFormData({...formData, centerName: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">{t('date')}</label>
                  <input 
                    type="date" 
                    className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
               </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Start Time</label>
                  <input 
                    type="time" 
                    className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.startTime}
                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                  />
               </div>
               <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">End Time</label>
                  <input 
                    type="time" 
                    className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                  />
               </div>
             </div>

             <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">{t('specialty')}</label>
                <select 
                  className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.specialtyRequired}
                  onChange={e => setFormData({...formData, specialtyRequired: e.target.value})}
                >
                   <option>Emergency Medicine</option>
                   <option>ICU</option>
                   <option>Pediatrics</option>
                   <option>Internal Medicine</option>
                   <option>General Practice</option>
                </select>
             </div>

             <div className="flex items-center gap-4">
                <div className="flex-1">
                   <label className="text-xs font-bold text-gray-500 block mb-1">{t('rate')}</label>
                   <input 
                      type="number" 
                      className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                      value={formData.rate}
                      onChange={e => setFormData({...formData, rate: parseInt(e.target.value)})}
                   />
                </div>
                <div className="flex-1">
                   <label className="text-xs font-bold text-gray-500 block mb-1">{t('dueDate')}</label>
                   <input 
                     type="date" 
                     className="w-full border rounded-lg p-2.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" 
                     value={formData.dueDate}
                     onChange={e => setFormData({...formData, dueDate: e.target.value})}
                   />
                </div>
             </div>

             <div className="pt-4">
                <button 
                  onClick={handleSubmit}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none transform active:scale-95"
                >
                  {t('createPublish')}
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

interface MarketplaceProps {
  shifts: Shift[];
  onCreateShift: (shift: Shift) => void;
  onApply: (shift: Shift) => void;
  userRole: UserRole;
}

const Marketplace = ({ shifts, onCreateShift, onApply, userRole }: MarketplaceProps) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'open'>('open');
  const [sortBy, setSortBy] = useState<'date' | 'rate' | 'dueDate'>('date');
  const [filterDueDate, setFilterDueDate] = useState<string>('');
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  
  const isManager = userRole === UserRole.ROTA_MANAGER || userRole === UserRole.CENTER_ADMIN;

  const filteredShifts = shifts
    .filter(s => filter === 'all' || s.status === ShiftStatus.OPEN)
    .filter(s => {
      if (!filterDueDate) return true;
      if (!s.dueDate) return false;
      return s.dueDate <= filterDueDate;
    })
    .sort((a, b) => {
      if (sortBy === 'rate') return (b.rate || 0) - (a.rate || 0);
      if (sortBy === 'dueDate') {
         if (!a.dueDate) return 1;
         if (!b.dueDate) return -1;
         return a.dueDate.localeCompare(b.dueDate);
      }
      return a.date.localeCompare(b.date);
    });

  return (
    <div className="p-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('marketplace')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Find and cover shifts in your area.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 shadow-sm">
             <span className="text-xs text-gray-500 dark:text-gray-300 mr-2 whitespace-nowrap">Due Before:</span>
             <input 
               type="date" 
               className="text-sm outline-none text-gray-700 dark:text-white bg-transparent"
               value={filterDueDate}
               onChange={(e) => setFilterDueDate(e.target.value)}
             />
             {filterDueDate && (
               <button onClick={() => setFilterDueDate('')} className="ml-2 text-gray-400 hover:text-red-500">
                 <XCircle size={14} />
               </button>
             )}
          </div>

          <select 
            className="bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="date">Sort by Date</option>
            <option value="rate">Highest Rate</option>
            <option value="dueDate">Due Date (Soonest)</option>
          </select>
          {isManager && (
            <button 
               onClick={() => setCreateModalOpen(true)}
               className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm shadow hover:bg-indigo-700 transition flex items-center gap-2"
            >
              <Plus size={16} /> {t('postShift')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredShifts.map(shift => (
          <div key={shift.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col transform hover:-translate-y-1">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white group-hover:text-indigo-600 transition">{shift.centerName}</h3>
                  <div className="flex items-center gap-1 mt-1">
                     <div className="flex text-yellow-400">
                        {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i <= (shift.hospitalRating || 4) ? "currentColor" : "none"} />)}
                     </div>
                     <span className="text-xs text-gray-400">(4.8)</span>
                  </div>
                </div>
                {shift.rate && (
                  <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-bold px-3 py-1 rounded-full text-sm">
                    ${shift.rate}/hr
                  </div>
                )}
              </div>
              
              <div className="space-y-3 mb-5">
                 <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    <Users size={16} className="mr-2" />
                    {shift.specialtyRequired}
                  </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                  <Calendar size={16} className="mr-2 text-indigo-500" />
                  {shift.date}
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm">
                  <Clock size={16} className="mr-2 text-indigo-500" />
                  {shift.startTime} - {shift.endTime} ({shift.type})
                </div>
                {shift.dueDate && (
                  <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm font-medium bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded">
                     <AlertCircle size={16} className="mr-2" />
                     Due by: {shift.dueDate}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
               <button 
                onClick={() => onApply(shift)}
                className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 font-semibold py-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition flex justify-center items-center gap-2"
               >
                {t('apply')}
               </button>
            </div>
          </div>
        ))}
        {filteredShifts.length === 0 && (
           <div className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex flex-col items-center justify-center">
              <ClipboardList size={48} className="text-gray-300 mb-4" />
              <p className="font-semibold text-gray-500">No shifts available</p>
              <p className="text-sm text-gray-400 mt-1">Try changing your filters or check back later.</p>
           </div>
        )}
      </div>
      {isCreateModalOpen && (
        <CreateShiftModal 
          onClose={() => setCreateModalOpen(false)} 
          onCreate={onCreateShift}
        />
      )}
    </div>
  );
};

// --- New Feature: Wallet Page ---

const PaymentModal = ({ onClose, onWithdraw, methods }: { onClose: () => void, onWithdraw: (method: PaymentMethod) => void, methods: PaymentMethod[] }) => {
   const { t } = useLanguage();
   const [selectedMethodId, setSelectedMethodId] = useState(methods.find(m => m.isDefault)?.id || methods[0]?.id);
   const [amount, setAmount] = useState('');

   const handleConfirm = () => {
      const method = methods.find(m => m.id === selectedMethodId);
      if (method) onWithdraw(method);
      onClose();
   };

   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-scale">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b dark:border-gray-700 flex justify-between items-center">
             <h3 className="font-bold text-gray-800 dark:text-white">{t('withdrawFunds')}</h3>
             <button onClick={onClose}><X size={20} className="dark:text-gray-400"/></button>
          </div>
          <div className="p-6 space-y-6">
             <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Amount to Withdraw</label>
                <div className="relative">
                   <span className="absolute left-3 top-3 text-gray-500 font-bold text-lg">$</span>
                   <input 
                     type="number" 
                     className="w-full border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl pl-7 pr-3 py-3 font-bold text-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                     placeholder="0.00"
                     value={amount}
                     onChange={e => setAmount(e.target.value)}
                   />
                </div>
             </div>

             <div>
                <label className="text-xs font-bold text-gray-500 mb-2 block">Select Payout Method</label>
                <div className="space-y-2">
                   {methods.map(method => (
                      <div 
                         key={method.id} 
                         onClick={() => setSelectedMethodId(method.id)}
                         className={`border rounded-xl p-4 flex items-center justify-between cursor-pointer transition ${selectedMethodId === method.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                      >
                         <div className="flex items-center gap-3">
                            {method.type === 'apple_pay' && <div className="bg-black text-white p-1.5 rounded-md"><Smartphone size={16} /></div>}
                            {method.type === 'google_pay' && <div className="bg-blue-500 text-white p-1.5 rounded-md"><Smartphone size={16} /></div>}
                            {method.type === 'card' && <div className="bg-gray-200 text-gray-700 p-1.5 rounded-md"><CreditCard size={16} /></div>}
                            
                            <div>
                               <p className="text-sm font-bold text-gray-800 dark:text-white">
                                  {method.type === 'apple_pay' ? 'Apple Pay' : method.type === 'google_pay' ? 'Google Pay' : `${method.brand?.toUpperCase()} •••• ${method.last4}`}
                               </p>
                               {method.type === 'card' && <p className="text-xs text-gray-500">Exp: {method.expiry}</p>}
                            </div>
                         </div>
                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedMethodId === method.id ? 'border-indigo-600' : 'border-gray-300'}`}>
                            {selectedMethodId === method.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                         </div>
                      </div>
                   ))}
                </div>
             </div>

             <button onClick={handleConfirm} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition flex justify-center items-center gap-2 transform active:scale-95">
                Confirm Withdrawal <ArrowRight size={18} />
             </button>
             <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
                <Shield size={12} /> Secure processing by Stripe
             </p>
          </div>
       </div>
     </div>
   );
};

const WalletPage = ({ transactions, balance, shifts, paymentMethods, onAddPaymentMethod, onWithdraw }: { 
   transactions: WalletTransaction[], 
   balance: number, 
   shifts: Shift[], 
   paymentMethods: PaymentMethod[],
   onAddPaymentMethod: (pm: PaymentMethod) => void,
   onWithdraw: (amount: number, method: PaymentMethod) => void
}) => {
  const { t } = useLanguage();
  const [isWithdrawOpen, setWithdrawOpen] = useState(false);
  
  // Calculate Pending Balance dynamically from submitted timesheets
  const pendingAmount = shifts
    .filter(s => s.status === ShiftStatus.TIMESHEET_SUBMITTED)
    .reduce((acc, s) => acc + (s.rate ? s.rate * 8 : 800), 0);

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('wallet')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-xl"></div>
           <div>
              <p className="text-gray-400 text-sm mb-1 font-medium tracking-wide">{t('availableBalance')}</p>
              <h2 className="text-4xl font-bold mb-6 tracking-tight">${balance.toFixed(2)}</h2>
           </div>
           <button 
               onClick={() => setWithdrawOpen(true)}
               className="w-full bg-white/20 hover:bg-white/30 text-white py-3 rounded-xl font-medium transition backdrop-blur-sm flex items-center justify-center gap-2 border border-white/10"
            >
              <DollarSign size={16} /> {t('withdrawFunds')}
           </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
           <div className="flex items-start justify-between">
              <div>
                 <p className="text-gray-500 dark:text-gray-400 text-sm mb-1 font-medium">{t('pendingClearance')}</p>
                 <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">${pendingAmount.toFixed(2)}</h2>
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-500">
                 <Clock size={20} />
              </div>
           </div>
           <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700">
              <p className="text-xs text-gray-400">Funds are held in escrow until shift completion + 24hrs.</p>
           </div>
        </div>
        
        {/* Payment Methods Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">{t('paymentMethods')}</p>
              <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline flex items-center gap-1"><Plus size={12}/> {t('addMethod')}</button>
           </div>
           <div className="space-y-3 flex-1 overflow-y-auto max-h-32 pr-1 custom-scrollbar">
              {paymentMethods.map(pm => (
                 <div key={pm.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer">
                    {pm.type === 'apple_pay' && <div className="w-10 h-7 bg-black text-white rounded flex items-center justify-center shadow-sm"><Smartphone size={14} /></div>}
                    {pm.type === 'google_pay' && <div className="w-10 h-7 bg-blue-500 text-white rounded flex items-center justify-center shadow-sm"><Smartphone size={14} /></div>}
                    {pm.type === 'card' && <div className="w-10 h-7 bg-gray-200 text-gray-600 rounded flex items-center justify-center shadow-sm"><CreditCard size={14} /></div>}
                    <div>
                       <p className="text-sm font-semibold text-gray-800 dark:text-white">
                          {pm.type === 'apple_pay' ? 'Apple Pay' : pm.type === 'google_pay' ? 'Google Pay' : `•••• ${pm.last4}`}
                       </p>
                    </div>
                    {pm.isDefault && <span className="ml-auto text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-0.5 rounded-full font-medium">Default</span>}
                 </div>
              ))}
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
         <div className="p-5 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <FileText size={18} className="text-indigo-500"/> {t('transactionHistory')}
         </div>
         <div className="divide-y dark:divide-gray-700">
            {transactions.length === 0 ? (
               <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                  <Search size={32} className="mb-2 opacity-20"/>
                  No recent transactions found.
               </div>
            ) : (
               transactions.map(tx => (
                 <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                    <div className="flex items-center gap-4">
                       <div className={`p-3 rounded-xl ${tx.type === 'credit' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'}`}>
                          {tx.type === 'credit' ? <DollarSign size={20} /> : <LogOut size={20} className="rotate-45" />}
                       </div>
                       <div>
                          <p className="font-semibold text-gray-800 dark:text-white group-hover:text-indigo-600 transition">{tx.description}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{tx.date} • Ref: <span className="font-mono text-gray-400">{tx.reference}</span></p>
                       </div>
                    </div>
                    <div className={`font-bold text-lg ${tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-white'}`}>
                       {tx.type === 'credit' ? '+' : ''}{tx.amount}
                    </div>
                 </div>
               ))
            )}
         </div>
      </div>
      
      {isWithdrawOpen && (
         <PaymentModal 
            methods={paymentMethods} 
            onClose={() => setWithdrawOpen(false)} 
            onWithdraw={(method) => onWithdraw(500, method)} 
         />
      )}
    </div>
  );
};

// --- Added Missing Components: Schedule, Doctors, ProfilePage ---

const Schedule = ({ 
  shifts, 
  leaveRequests, 
  onUpdateShift, 
  onRequestSwap, 
  onDeleteShift, 
  onRequestLeave, 
  onExport, 
  onSubmitTimesheet, 
  userRole, 
  userId,
  onSelectShift 
}: {
  shifts: Shift[],
  leaveRequests: LeaveRequest[],
  onUpdateShift: (shift: Shift) => void,
  onRequestSwap: (shift: Shift) => void,
  onDeleteShift: (id: string) => void,
  onRequestLeave: () => void,
  onExport: () => void,
  onSubmitTimesheet: (shift: Shift) => void,
  userRole: UserRole,
  userId: string,
  onSelectShift: (shift: Shift | null) => void
}) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date()); 

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const blanks = Array(firstDay).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const allCalendarCells = [...blanks, ...days];

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const getShiftsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    return shifts.filter(s => s.date === dateStr);
  };

  const isLeaveDay = (day: number) => {
     if (!day) return null;
     const year = currentDate.getFullYear();
     const month = String(currentDate.getMonth() + 1).padStart(2, '0');
     const dayStr = String(day).padStart(2, '0');
     const dateStr = `${year}-${month}-${dayStr}`;
     
     // Filter leave for current user only unless manager
     const myLeaves = leaveRequests.filter(l => 
        (l.doctorId === userId || userRole === UserRole.ROTA_MANAGER) && 
        l.status === 'Approved'
     );

     return myLeaves.find(l => dateStr >= l.startDate && dateStr <= l.endDate);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-6 animate-fade-in h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('schedule')}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <Globe size={12} />
            Timezone: Automatic (Local Time)
          </p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={onRequestLeave} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-gray-700 dark:text-white shadow-sm">
              <Plane size={16} /> {t('requestTimeOff')}
           </button>
           <button onClick={onExport} className="flex items-center gap-2 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition text-gray-700 dark:text-white shadow-sm">
              <Download size={16} /> {t('export')}
           </button>
           <div className="flex items-center gap-4 bg-white dark:bg-gray-800 p-1 rounded-full shadow-sm border border-gray-100 dark:border-gray-600">
             <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition">
               <ChevronLeft size={20} />
             </button>
             <span className="font-semibold text-gray-800 dark:text-white min-w-[140px] text-center">
               {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
             </span>
             <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 transition">
               <ChevronRight size={20} />
             </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          {weekDays.map(day => (
            <div key={day} className="py-4 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
           {allCalendarCells.map((day, index) => {
              if (!day) return <div key={`blank-${index}`} className="bg-gray-50/30 dark:bg-gray-900/30 border-b border-r border-gray-100 dark:border-gray-700 min-h-[120px]" />;
              
              const dayShifts = getShiftsForDay(day as number);
              const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day as number);
              const isToday = new Date().toDateString() === dateObj.toDateString();
              const leave = isLeaveDay(day as number);
              
              // Simple conflict detection logic for visual indicator
              const myShifts = dayShifts.filter(s => s.assignedDoctorId === userId);
              const hasConflict = myShifts.length > 1;

              return (
                <div key={index} className={`border-b border-r border-gray-100 dark:border-gray-700 p-2 min-h-[120px] transition hover:bg-gray-50 dark:hover:bg-gray-700/30 flex flex-col ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/20' : ''}`}>
                   <div className="flex justify-between items-center mb-2">
                      <div className={`text-xs w-6 h-6 flex items-center justify-center rounded-full font-medium ${isToday ? 'bg-indigo-600 text-white font-bold shadow' : 'text-gray-500 dark:text-gray-400'}`}>
                         {day}
                      </div>
                      {hasConflict && (
                         <div title="Conflict: Multiple shifts" className="text-red-500 animate-pulse">
                            <AlertTriangle size={14} />
                         </div>
                      )}
                   </div>
                   
                   {leave ? (
                      <div className="flex-1 flex flex-col justify-center items-center bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-900/30 rounded-lg p-1 animate-fade-scale">
                         <Plane size={16} className="text-pink-400 mb-1" />
                         <span className="text-[10px] text-pink-600 dark:text-pink-300 font-bold text-center leading-tight">On Leave</span>
                         <span className="text-[9px] text-pink-400 text-center hidden md:block mt-0.5">{leave.type}</span>
                      </div>
                   ) : (
                      <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-1">
                          {dayShifts.map(shift => (
                            <div 
                              key={shift.id} 
                              onClick={() => onSelectShift(shift)}
                              className={`text-[10px] p-1.5 rounded-md border truncate cursor-pointer shadow-sm transition hover:shadow hover:scale-[1.02]
                              ${shift.status === ShiftStatus.OPEN 
                                ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200' 
                                : 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-200'}
                            `}>
                              <div className="font-bold flex justify-between items-center">
                                <span>{shift.startTime.slice(0,5)}</span>
                                {shift.status === ShiftStatus.OPEN && <span className="text-[8px] bg-amber-200 dark:bg-amber-800/60 px-1 rounded-[3px]">OPEN</span>}
                              </div>
                              <div className="truncate font-medium mt-0.5">{shift.centerName}</div>
                            </div>
                          ))}
                      </div>
                   )}
                </div>
              )
           })}
        </div>
      </div>
    </div>
  );
};

const Doctors = () => {
  const { t } = useLanguage();
  return (
    <div className="p-6 animate-fade-in">
       <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('doctors')}</h1>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_DOCTORS.map(doctor => (
             <div key={doctor.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center text-center hover:shadow-xl transition-all duration-300 group transform hover:-translate-y-1">
                <div className="relative mb-4">
                   <img src={doctor.avatarUrl} alt={doctor.name} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-md group-hover:scale-105 transition" />
                   <div className="absolute bottom-1 right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800"></div>
                </div>
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{doctor.name}</h3>
                <p className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-1">{doctor.specialty}</p>
                <p className="text-gray-500 dark:text-gray-400 text-xs mb-6 flex items-center gap-1 justify-center"><MapPin size={12}/> {doctor.city}</p>
                <div className="flex gap-3 w-full mt-auto">
                   <button className="flex-1 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition">Profile</button>
                   <button className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition shadow-md shadow-indigo-200 dark:shadow-none">Message</button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};

const ProfilePage = ({ user, onSwitchRole, credentials, onAddCredential }: {
  user: any, 
  onSwitchRole: () => void,
  credentials: Credential[],
  onAddCredential: (c: Credential) => void
}) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
       const newCred: Credential = {
          id: `c-${Date.now()}`,
          name: e.target.files[0].name.split('.')[0],
          provider: 'Uploaded Document',
          expiryDate: '2026-01-01',
          status: 'Valid',
          fileUrl: '#'
       };
       onAddCredential(newCred);
    }
  };

  const handleReset = () => {
    localStorage.removeItem('aiRota_user');
    localStorage.removeItem('aiRota_shifts');
    localStorage.removeItem('aiRota_transactions');
    localStorage.removeItem('aiRota_balance');
    localStorage.removeItem('aiRota_paymentMethods');
    window.location.reload();
  };

  return (
    <div className="p-6 animate-fade-in max-w-4xl mx-auto">
       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
             <div className="absolute inset-0 bg-black opacity-10"></div>
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
          </div>
          <div className="px-8 pb-8 relative">
             <div className="absolute -top-14 left-8">
                <img src={user.avatar} alt="Profile" className="w-28 h-28 rounded-full border-4 border-white dark:border-gray-800 shadow-lg" />
             </div>
             <div className="ml-32 pt-4 flex justify-between items-start">
                <div>
                   <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h1>
                   <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                      <Briefcase size={16} />
                      {user.role === UserRole.ROTA_MANAGER ? 'Medical Rota Manager' : 'Emergency Medicine Specialist'}
                   </p>
                </div>
                <button 
                  onClick={onSwitchRole}
                  className="px-5 py-2.5 bg-white border border-gray-200 dark:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-white rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition shadow-sm flex items-center gap-2"
                >
                   <RefreshCcw size={16} /> {t('switchRole')}
                </button>
             </div>
          </div>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-xl text-gray-800 dark:text-white flex items-center gap-2">
                <Shield size={22} className="text-indigo-500" />
                {t('credentials')}
             </h3>
             <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition">
                <Upload size={16} /> {t('uploadNew')}
             </button>
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          </div>
          
          <div className="space-y-4">
             {credentials.map(cred => (
                <div key={cred.id} className="flex items-center justify-between p-5 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group cursor-default">
                   <div className="flex items-center gap-5">
                      <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition">
                         <FileCheck size={24} />
                      </div>
                      <div>
                         <h4 className="font-bold text-gray-800 dark:text-white text-lg">{cred.name}</h4>
                         <p className="text-sm text-gray-500 dark:text-gray-400">{cred.provider}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-1 ${
                         cred.status === 'Valid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                         cred.status === 'Expiring Soon' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                         {cred.status}
                      </span>
                      <p className="text-xs text-gray-400">Exp: {cred.expiryDate}</p>
                   </div>
                </div>
             ))}
          </div>

          <div className="mt-10 pt-8 border-t dark:border-gray-700">
             <button 
                onClick={handleReset}
                className="w-full bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 py-3 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 border border-transparent hover:border-red-200"
             >
                <RefreshCcw size={18} />
                {t('resetDemo')}
             </button>
             <p className="text-xs text-center text-gray-400 mt-3">This will clear all shifts, transactions, and role changes.</p>
          </div>
       </div>
    </div>
  );
};

const ShiftDetailsModal = ({ shift, onClose, onUpdate, onRequestSwap, onDelete, onSubmitTimesheet, userRole, userId }: {
  shift: Shift,
  onClose: () => void,
  onUpdate: (shift: Shift) => void,
  onRequestSwap: (shift: Shift) => void,
  onDelete: (id: string) => void,
  onSubmitTimesheet: (shift: Shift) => void,
  userRole: UserRole,
  userId: string
}) => {
  const { t } = useLanguage();
  const isAssignedToMe = shift.assignedDoctorId === userId;
  const isManager = userRole === UserRole.ROTA_MANAGER || userRole === UserRole.CENTER_ADMIN;
  
  // Basic timesheet form state
  const [timesheetData, setTimesheetData] = useState({
      actualStartTime: shift.startTime,
      actualEndTime: shift.endTime,
      breakDuration: 30,
      notes: ''
  });
  const [showTimesheet, setShowTimesheet] = useState(false);

  const handleSubmitTS = () => {
      const updatedShift: Shift = {
          ...shift,
          status: ShiftStatus.TIMESHEET_SUBMITTED,
          timesheet: {
              actualStartTime: timesheetData.actualStartTime,
              actualEndTime: timesheetData.actualEndTime,
              breakDurationMinutes: timesheetData.breakDuration,
              notes: timesheetData.notes,
              submittedAt: new Date().toISOString()
          }
      };
      onSubmitTimesheet(updatedShift);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
       <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-scale flex flex-col max-h-[90vh]">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex justify-between items-start">
             <div>
                <h2 className="text-xl font-bold">{shift.centerName}</h2>
                <div className="flex items-center gap-2 text-indigo-100 text-sm mt-1">
                   <Calendar size={14}/> {shift.date}
                   <span className="w-1 h-1 bg-white rounded-full opacity-50"></span>
                   <Clock size={14}/> {shift.startTime} - {shift.endTime}
                </div>
             </div>
             <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20}/></button>
          </div>
          
          <div className="p-6 overflow-y-auto custom-scrollbar">
             <div className="flex items-center gap-3 mb-6">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                   shift.status === ShiftStatus.OPEN ? 'bg-amber-100 text-amber-700' :
                   shift.status === ShiftStatus.ASSIGNED ? 'bg-indigo-100 text-indigo-700' :
                   shift.status === ShiftStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                   'bg-gray-100 text-gray-700'
                }`}>
                   {shift.status.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{shift.specialtyRequired}</span>
                {shift.rate && <span className="ml-auto font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">${shift.rate}/hr</span>}
             </div>

             <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex gap-3">
                   <MapPin className="text-gray-400 mt-0.5" size={16} />
                   <div>
                      <p className="font-semibold text-gray-800 dark:text-white">Location</p>
                      <p>{shift.location}</p>
                   </div>
                </div>
                {shift.handoverNotes && (
                   <div className="flex gap-3">
                      <FileText className="text-gray-400 mt-0.5" size={16} />
                      <div>
                         <p className="font-semibold text-gray-800 dark:text-white">{t('handoverNotes')}</p>
                         <p className="italic bg-gray-50 dark:bg-gray-900/50 p-2 rounded border border-gray-100 dark:border-gray-700 mt-1">{shift.handoverNotes}</p>
                      </div>
                   </div>
                )}
             </div>

             {/* Timesheet Section */}
             {showTimesheet ? (
                <div className="mt-6 pt-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 -mx-6 px-6 pb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Clock size={16}/> Submit Timesheet</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">Start</label>
                            <input type="time" className="w-full border rounded p-2 text-sm dark:bg-gray-700 dark:text-white" value={timesheetData.actualStartTime} onChange={e => setTimesheetData({...timesheetData, actualStartTime: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 block mb-1">End</label>
                            <input type="time" className="w-full border rounded p-2 text-sm dark:bg-gray-700 dark:text-white" value={timesheetData.actualEndTime} onChange={e => setTimesheetData({...timesheetData, actualEndTime: e.target.value})} />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Break (mins)</label>
                        <input type="number" className="w-full border rounded p-2 text-sm dark:bg-gray-700 dark:text-white" value={timesheetData.breakDuration} onChange={e => setTimesheetData({...timesheetData, breakDuration: parseInt(e.target.value)})} />
                    </div>
                     <div className="mb-4">
                        <label className="text-xs font-bold text-gray-500 block mb-1">Notes</label>
                        <textarea className="w-full border rounded p-2 text-sm dark:bg-gray-700 dark:text-white" rows={2} value={timesheetData.notes} onChange={e => setTimesheetData({...timesheetData, notes: e.target.value})}></textarea>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowTimesheet(false)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
                        <button onClick={handleSubmitTS} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Submit</button>
                    </div>
                </div>
             ) : (
                <div className="mt-8 flex flex-col gap-3">
                    {/* Actions for Assigned Doctor */}
                    {isAssignedToMe && shift.status === ShiftStatus.ASSIGNED && (
                        <>
                           <button 
                              onClick={() => setShowTimesheet(true)}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition flex justify-center items-center gap-2"
                           >
                              <CheckCircle size={18} /> {t('submitTimesheet')}
                           </button>
                           <button 
                              onClick={() => onRequestSwap(shift)}
                              className="w-full py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition flex justify-center items-center gap-2"
                           >
                              <RefreshCw size={18} /> {t('requestSwap')}
                           </button>
                        </>
                    )}

                    {/* Actions for Manager */}
                    {isManager && (
                        <button 
                           onClick={() => { onDelete(shift.id); onClose(); }}
                           className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 rounded-xl font-bold transition flex justify-center items-center gap-2"
                        >
                           <Trash2 size={18} /> {t('deleteShift')}
                        </button>
                    )}
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

// --- Layout & Main App ---

const SidebarItem = ({ icon: Icon, label, to }: { icon: any, label: string, to: string }) => {
  const { isRTL } = useLanguage();
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
          isActive 
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
            : 'text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-gray-800/50 hover:text-indigo-600 dark:hover:text-white'
        }`
      }
    >
      <Icon size={20} className={`${isRTL ? 'ml-1' : ''} transition-transform group-hover:scale-110 duration-300`} />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
};

const AppLayout = () => {
  const { isRTL, setLanguage, language, t } = useLanguage();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAiModalOpen, setAiModalOpen] = useState(false);
  const [isLeaveModalOpen, setLeaveModalOpen] = useState(false);
  
  // --- GLOBAL STATE ---
  const [currentUser, setCurrentUser] = useState(() => {
     const saved = localStorage.getItem('aiRota_user');
     return saved ? JSON.parse(saved) : CURRENT_USER;
  });
  const [shifts, setShifts] = useState<Shift[]>(() => {
     const saved = localStorage.getItem('aiRota_shifts');
     return saved ? JSON.parse(saved) : MOCK_SHIFTS;
  });
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_LEAVE_REQUESTS);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
     const saved = localStorage.getItem('aiRota_transactions');
     return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS;
  });
  const [balance, setBalance] = useState<number>(() => {
     const saved = localStorage.getItem('aiRota_balance');
     return saved ? parseFloat(saved) : 1850;
  });
  const [credentials, setCredentials] = useState<Credential[]>(MOCK_CREDENTIALS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
     const saved = localStorage.getItem('aiRota_paymentMethods');
     return saved ? JSON.parse(saved) : MOCK_PAYMENT_METHODS;
  });
  
  // Toast State
  const [toasts, setToasts] = useState<any[]>([]);

  // Hoisted State for Shift Modal
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ doctors: Doctor[], shifts: Shift[] } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dark Mode Persistence
  const [darkMode, setDarkMode] = useState(() => {
     const saved = localStorage.getItem('aiRota_theme');
     return saved === 'dark';
  });

  // Persist state
  useEffect(() => { localStorage.setItem('aiRota_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('aiRota_shifts', JSON.stringify(shifts)); }, [shifts]);
  useEffect(() => { localStorage.setItem('aiRota_transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('aiRota_balance', balance.toString()); }, [balance]);
  useEffect(() => { localStorage.setItem('aiRota_paymentMethods', JSON.stringify(paymentMethods)); }, [paymentMethods]);

  // Dark Mode Toggle Logic
  useEffect(() => {
     if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('aiRota_theme', 'dark');
     } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('aiRota_theme', 'light');
     }
  }, [darkMode]);

  const [findDoctorShift, setFindDoctorShift] = useState<Shift | null>(null);
  const location = useLocation();
  const isManager = currentUser.role === UserRole.ROTA_MANAGER;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    
    const matchedDoctors = MOCK_DOCTORS.filter(d => 
      d.name.toLowerCase().includes(lowerQuery) || 
      d.specialty.toLowerCase().includes(lowerQuery) ||
      d.city.toLowerCase().includes(lowerQuery)
    );

    const matchedShifts = shifts.filter(s => 
      s.centerName.toLowerCase().includes(lowerQuery) ||
      s.specialtyRequired.toLowerCase().includes(lowerQuery) ||
      s.location.toLowerCase().includes(lowerQuery)
    );

    setSearchResults({ doctors: matchedDoctors, shifts: matchedShifts });
  }, [searchQuery, shifts]);

  // Close search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- HELPERS ---
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addNotification = (title: string, message: string, type: 'info'|'success'|'warning', link?: string) => {
    const newNotif: Notification = {
       id: `n-${Date.now()}`,
       title,
       message,
       type,
       timestamp: 'Just now',
       isRead: false,
       actionLink: link
    };
    setNotifications(prev => [newNotif, ...prev]);
    
    // Also trigger a toast for better feedback
    const toastType = type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'info';
    addToast(title, toastType);
  };

  // --- HANDLERS ---
  const handleSwitchRole = () => {
     const newRole = currentUser.role === UserRole.ROTA_MANAGER ? UserRole.DOCTOR : UserRole.ROTA_MANAGER;
     setCurrentUser(prev => ({ ...prev, role: newRole }));
     addNotification('Role Switched', `You are now viewing as a ${newRole === UserRole.ROTA_MANAGER ? 'Manager' : 'Doctor'}`, 'info', '/');
  };

  const handleCreateShift = (newShift: Shift) => {
    setShifts(prev => [...prev, newShift]);
    addNotification('Shift Created', `Successfully posted shift at ${newShift.centerName}`, 'success', '/marketplace');
  };

  const handleUpdateShift = (updatedShift: Shift) => {
    setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s));
  };
  
  const handleDeleteShift = (shiftId: string) => {
     setShifts(prev => prev.filter(s => s.id !== shiftId));
     addNotification('Shift Deleted', 'Shift removed from schedule', 'info', '/schedule');
  };

  const handleApplyForShift = (shift: Shift) => {
    handleUpdateShift({
      ...shift,
      status: ShiftStatus.PENDING_APPROVAL
    });
    addNotification('Application Sent', `You applied for ${shift.centerName}`, 'success', '/dashboard');
  };

  const handleAddBulkShifts = (newShifts: Shift[]) => {
    setShifts(prev => [...prev, ...newShifts]);
    addNotification('Schedule Generated', `${newShifts.length} shifts added from AI Generator.`, 'success', '/schedule');
  };
  
  const handleRequestSwap = (shift: Shift) => {
     handleUpdateShift({
       ...shift,
       status: ShiftStatus.PENDING_SWAP
     });
     addNotification('Swap Requested', `Swap request sent for shift on ${shift.date}`, 'warning', '/dashboard');
  };

  const handleAssignDoctor = (doctorId: string, doctorName: string) => {
    if (!findDoctorShift) return;
    handleUpdateShift({
      ...findDoctorShift,
      assignedDoctorId: doctorId,
      status: ShiftStatus.ASSIGNED
    });
    addNotification('Doctor Assigned', `${doctorName} assigned to ${findDoctorShift.specialtyRequired} shift.`, 'success', '/schedule');
    setFindDoctorShift(null);
  };
  
  const handleAddCredential = (cred: Credential) => {
     setCredentials(prev => [...prev, cred]);
     addNotification('Credential Uploaded', `${cred.name} added to your passport.`, 'success', '/profile');
  };

  // Leave Request Logic
  const handleRequestLeave = (data: Partial<LeaveRequest>) => {
     const newLeave: LeaveRequest = {
        id: `lr-${Date.now()}`,
        doctorId: currentUser.id,
        doctorName: currentUser.name,
        startDate: data.startDate!,
        endDate: data.endDate!,
        reason: data.reason || '',
        status: 'Pending',
        type: data.type as any || 'Annual Leave'
     };
     setLeaveRequests(prev => [...prev, newLeave]);
     addNotification('Leave Requested', `Time off request submitted for ${data.startDate}`, 'info', '/dashboard');
  };

  const handleApproveLeave = (leave: LeaveRequest) => {
     setLeaveRequests(prev => prev.map(l => l.id === leave.id ? { ...l, status: 'Approved' } : l));
     addNotification('Leave Approved', `${leave.doctorName} is off from ${leave.startDate}`, 'success', '/schedule');
  };

  const handleRejectLeave = (leave: LeaveRequest) => {
     setLeaveRequests(prev => prev.map(l => l.id === leave.id ? { ...l, status: 'Rejected' } : l));
     addNotification('Leave Rejected', `Request for ${leave.startDate} rejected.`, 'warning');
  };

  const handleExport = () => {
     const headers = "ID,Center,Date,Type,Start,End,Status,Doctor\n";
     const rows = shifts.map(s => `${s.id},${s.centerName},${s.date},${s.type},${s.startTime},${s.endTime},${s.status},${s.assignedDoctorId || 'Unassigned'}`).join("\n");
     const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
     const encodedUri = encodeURI(csvContent);
     window.open(encodedUri);
     addNotification('Export Complete', 'Schedule downloaded as CSV', 'success');
  };

  const handleSubmitTimesheet = (shift: Shift) => {
    handleUpdateShift(shift);
    addNotification('Timesheet Submitted', `Timesheet submitted for ${shift.centerName}. Pending approval.`, 'info', '/');
  };

  const handleApproveRequest = (shift: Shift) => {
    let updatedShift = { ...shift };
    let message = '';

    if (shift.status === ShiftStatus.PENDING_APPROVAL) {
       updatedShift.status = ShiftStatus.ASSIGNED;
       message = `Application approved for ${shift.centerName}`;
    } else if (shift.status === ShiftStatus.TIMESHEET_SUBMITTED) {
       updatedShift.status = ShiftStatus.PAID;
       const amount = shift.rate ? shift.rate * 8 : 800; 
       
       // Process Payment
       const newTx: WalletTransaction = {
          id: `tx-${Date.now()}`,
          amount: amount,
          date: new Date().toISOString().split('T')[0],
          description: `Shift Payment - ${shift.centerName}`,
          reference: `PAY-${Math.floor(Math.random() * 10000)}`,
          status: 'Completed',
          type: 'credit'
       };
       setTransactions(prev => [newTx, ...prev]);
       setBalance(prev => prev + amount);
       message = `Timesheet approved and payment processed.`;
    } else if (shift.status === ShiftStatus.PENDING_SWAP) {
       updatedShift.status = ShiftStatus.OPEN; 
       updatedShift.assignedDoctorId = undefined;
       message = 'Swap approved. Shift returned to marketplace.';
    }

    handleUpdateShift(updatedShift);
    addNotification('Request Approved', message, 'success', '/schedule');
  };

  const handleRejectRequest = (shift: Shift) => {
     let updatedShift = { ...shift };
     if (shift.status === ShiftStatus.PENDING_APPROVAL) updatedShift.status = ShiftStatus.OPEN;
     if (shift.status === ShiftStatus.TIMESHEET_SUBMITTED) updatedShift.status = ShiftStatus.ASSIGNED;
     if (shift.status === ShiftStatus.PENDING_SWAP) updatedShift.status = ShiftStatus.ASSIGNED; 
     
     handleUpdateShift(updatedShift);
     addNotification('Request Rejected', `Request for ${shift.centerName} was rejected.`, 'warning');
  };

  // Payment Handlers
  const handleAddPaymentMethod = (method: PaymentMethod) => {
     setPaymentMethods(prev => [...prev, method]);
     addNotification('Payment Method Added', `Successfully added ${method.type.replace('_', ' ')}.`, 'success', '/wallet');
  };

  const handleWithdraw = (amount: number, method: PaymentMethod) => {
     processWithdrawal(amount, method).then(result => {
        if (result.success) {
           const newTx: WalletTransaction = {
             id: result.transactionId || `txn-${Date.now()}`,
             amount: -amount,
             date: new Date().toISOString().split('T')[0],
             description: `Withdrawal to ${method.type === 'card' ? 'Card' : 'Digital Wallet'}`,
             reference: `WTH-${Math.floor(Math.random() * 10000)}`,
             status: 'Completed',
             type: 'debit'
           };
           setTransactions(prev => [newTx, ...prev]);
           setBalance(prev => prev - amount);
           addNotification('Funds Withdrawn', result.message, 'success', '/wallet');
        } else {
           addNotification('Withdrawal Failed', 'Could not process transaction.', 'warning');
        }
     });
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Glassmorphism applied */}
      <aside className={`
        fixed lg:sticky top-0 h-screen w-72 bg-white/95 dark:bg-gray-800/95 border-r border-gray-100 dark:border-gray-700 shadow-2xl lg:shadow-none z-50 transition-transform duration-300 ease-in-out flex flex-col backdrop-blur-xl
        ${isRTL ? 'right-0 border-l border-r-0' : 'left-0'}
        ${sidebarOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
        lg:translate-x-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-2xl tracking-tight">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none">
              <Sparkles size={18} />
            </div>
            <span>AI Rota</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 transition">
            <X size={24} />
          </button>
        </div>

        <nav className="px-4 space-y-1 mt-2 flex-1 overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-3 mt-2">Main Menu</div>
          <SidebarItem icon={LayoutDashboard} label={t('dashboard')} to="/" />
          <SidebarItem icon={Calendar} label={t('schedule')} to="/schedule" />
          <SidebarItem icon={ShoppingBag} label={t('marketplace')} to="/marketplace" />
          <SidebarItem icon={Users} label={t('doctors')} to="/doctors" />
          
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-3 mt-8">Personal</div>
          <SidebarItem icon={Wallet} label={t('wallet')} to="/wallet" />
          <SidebarItem icon={FileCheck} label={t('profile')} to="/profile" />
        </nav>

        {isManager && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <button 
              onClick={() => setAiModalOpen(true)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2 font-medium group"
            >
              <Sparkles size={18} className="group-hover:animate-pulse" />
              {t('aiAssistant')}
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header - Glassmorphism applied */}
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg h-16 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm transition-all duration-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:bg-gray-100 p-2 rounded-lg transition">
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white hidden md:block tracking-tight">
              {location.pathname === '/' ? t('dashboard') : 
               location.pathname.substring(1).charAt(0).toUpperCase() + location.pathname.slice(2)}
            </h2>
          </div>

          {/* GLOBAL SEARCH BAR */}
          <div className="flex-1 max-w-xl mx-4 relative hidden md:block" ref={searchRef}>
             <div className="relative group">
                <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input 
                   type="text"
                   placeholder="Search shifts, doctors, specialties..."
                   className="w-full bg-gray-100/50 dark:bg-gray-700/50 border border-transparent focus:border-indigo-300 dark:focus:border-indigo-600 text-gray-700 dark:text-white rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 transition-all"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             {searchResults && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 max-h-96 overflow-y-auto z-50 animate-fade-scale custom-scrollbar">
                   {searchResults.doctors.length === 0 && searchResults.shifts.length === 0 ? (
                      <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                         <Search size={24} className="mx-auto mb-2 opacity-30" />
                         No results found.
                      </div>
                   ) : (
                      <>
                         {searchResults.doctors.length > 0 && (
                            <div className="p-2">
                               <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-2">Doctors</h4>
                               {searchResults.doctors.map(doc => (
                                  <button 
                                     key={doc.id} 
                                     onClick={() => { navigate('/doctors'); setSearchResults(null); setSearchQuery(''); }}
                                     className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition group"
                                  >
                                     <img src={doc.avatarUrl} className="w-8 h-8 rounded-full object-cover" alt={doc.name} />
                                     <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{doc.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{doc.specialty}</p>
                                     </div>
                                  </button>
                               ))}
                            </div>
                         )}
                         {searchResults.shifts.length > 0 && (
                            <div className="p-2 border-t dark:border-gray-700">
                               <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-2">Shifts</h4>
                               {searchResults.shifts.map(shift => (
                                  <button 
                                     key={shift.id} 
                                     onClick={() => { setSelectedShift(shift); setSearchResults(null); setSearchQuery(''); }}
                                     className="w-full text-left flex items-center gap-3 p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition group"
                                  >
                                     <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 p-2 rounded-lg">
                                        <Calendar size={16} />
                                     </div>
                                     <div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{shift.centerName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{shift.date} • {shift.specialtyRequired}</p>
                                     </div>
                                  </button>
                               ))}
                            </div>
                         )}
                      </>
                   )}
                </div>
             )}
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button 
               onClick={() => setDarkMode(!darkMode)}
               className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-full transition"
            >
               {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button 
               onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
               className="flex items-center gap-2 text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium transition"
            >
              <Globe size={18} />
              <span className="hidden md:inline">{language === 'en' ? 'Arabic' : 'English'}</span>
            </button>
            
            <NotificationDropdown notifications={notifications} onMarkAllRead={() => setNotifications(prev => prev.map(n => ({...n, isRead: true})))} />

            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 hidden md:block"></div>
            
            <div className="flex items-center gap-3">
               <img src={currentUser.avatar} alt="User" className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 object-cover" />
               <div className="hidden md:block">
                 <p className="text-sm font-bold text-gray-700 dark:text-white leading-none">{currentUser.name}</p>
                 <div className="flex items-center gap-1 mt-1">
                    <span className={`w-2 h-2 rounded-full ${isManager ? 'bg-indigo-500' : 'bg-green-500'}`}></span>
                    <p className="text-xs text-gray-400">{currentUser.role === UserRole.ROTA_MANAGER ? 'Manager View' : 'Doctor View'}</p>
                 </div>
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 custom-scrollbar">
          <Routes>
            <Route path="/" element={
               <Dashboard 
                  shifts={shifts} 
                  leaveRequests={leaveRequests}
                  onOpenAI={() => setAiModalOpen(true)} 
                  onFindDoctor={(shift) => setFindDoctorShift(shift)}
                  onApprove={handleApproveRequest}
                  onReject={handleRejectRequest}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                  userRole={currentUser.role}
               />} 
            />
            <Route path="/schedule" element={
              <Schedule 
                 shifts={shifts} 
                 leaveRequests={leaveRequests}
                 onUpdateShift={handleUpdateShift} 
                 onRequestSwap={handleRequestSwap}
                 onDeleteShift={handleDeleteShift}
                 onRequestLeave={() => setLeaveModalOpen(true)}
                 onExport={handleExport}
                 onSubmitTimesheet={handleSubmitTimesheet}
                 userRole={currentUser.role}
                 userId={currentUser.id}
                 onSelectShift={setSelectedShift}
              />
            } />
            <Route path="/marketplace" element={
              <Marketplace 
                shifts={shifts} 
                onCreateShift={handleCreateShift} 
                onApply={handleApplyForShift}
                userRole={currentUser.role}
              />
            } />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/wallet" element={
               <WalletPage 
                  transactions={transactions} 
                  balance={balance} 
                  shifts={shifts}
                  paymentMethods={paymentMethods}
                  onAddPaymentMethod={handleAddPaymentMethod}
                  onWithdraw={handleWithdraw}
               />
            } />
            <Route path="/profile" element={
               <ProfilePage 
                  user={currentUser} 
                  onSwitchRole={handleSwitchRole} 
                  credentials={credentials}
                  onAddCredential={handleAddCredential}
               />
            } />
          </Routes>
        </div>
      </main>

      <AIModal 
        isOpen={isAiModalOpen} 
        onClose={() => setAiModalOpen(false)} 
        shifts={shifts}
        doctors={MOCK_DOCTORS}
        onApplySchedule={handleAddBulkShifts}
      />
      
      <FindDoctorModal 
         shift={findDoctorShift}
         doctors={MOCK_DOCTORS}
         onClose={() => setFindDoctorShift(null)}
         onAssign={handleAssignDoctor}
      />

      {isLeaveModalOpen && (
         <LeaveRequestModal 
            onClose={() => setLeaveModalOpen(false)}
            onSubmit={handleRequestLeave}
         />
      )}

      {/* Global Shift Details Modal */}
      {selectedShift && (
        <ShiftDetailsModal 
           shift={selectedShift} 
           onClose={() => setSelectedShift(null)} 
           onUpdate={handleUpdateShift}
           onRequestSwap={handleRequestSwap}
           onDelete={handleDeleteShift}
           onSubmitTimesheet={handleSubmitTimesheet}
           userRole={currentUser.role}
           userId={currentUser.id}
        />
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
};

export default App;
