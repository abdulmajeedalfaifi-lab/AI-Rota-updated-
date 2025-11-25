
import { Doctor, Shift, ShiftStatus, ShiftType, Translation, UserRole, Notification, Credential, WalletTransaction, LeaveRequest, PaymentMethod } from './types';

// Helper to generate dynamic dates relative to today
const getRelativeDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export const MOCK_DOCTORS: Doctor[] = [
  { id: 'u1', name: 'Dr. Sarah Ahmed', specialty: 'Emergency Medicine', level: 'Specialist', city: 'Riyadh', avatarUrl: 'https://picsum.photos/100/100' },
  { id: 'd2', name: 'Dr. John Doe', specialty: 'Cardiology', level: 'Consultant', city: 'Jeddah', avatarUrl: 'https://picsum.photos/101/101' },
  { id: 'd3', name: 'Dr. Maria Garcia', specialty: 'Pediatrics', level: 'Resident', city: 'Riyadh', avatarUrl: 'https://picsum.photos/102/102' },
];

export const MOCK_SHIFTS: Shift[] = [
  {
    id: 's1',
    centerName: 'Central City Hospital',
    date: getRelativeDate(0), // Today
    dueDate: getRelativeDate(-2),
    type: ShiftType.MORNING,
    startTime: '08:00',
    endTime: '16:00',
    status: ShiftStatus.ASSIGNED,
    specialtyRequired: 'Emergency Medicine',
    assignedDoctorId: 'u1',
    location: 'Riyadh',
    handoverNotes: 'Patient in bed 3 requires cardiac monitoring follow-up.'
  },
  {
    id: 's2',
    centerName: 'Al Amal Clinic',
    date: getRelativeDate(1), // Tomorrow
    dueDate: getRelativeDate(0), // Due Today
    type: ShiftType.NIGHT,
    startTime: '22:00',
    endTime: '08:00',
    status: ShiftStatus.OPEN,
    specialtyRequired: 'General Practice',
    rate: 150,
    location: 'Jeddah'
  },
  {
    id: 's3',
    centerName: 'North Wing Emergency',
    date: getRelativeDate(2),
    dueDate: getRelativeDate(1),
    type: ShiftType.EVENING,
    startTime: '16:00',
    endTime: '24:00',
    status: ShiftStatus.ASSIGNED,
    specialtyRequired: 'Emergency Medicine',
    assignedDoctorId: 'u1',
    location: 'Riyadh'
  },
  {
    id: 's4',
    centerName: 'Royal Care Center',
    date: getRelativeDate(3),
    dueDate: getRelativeDate(2),
    type: ShiftType.MORNING,
    startTime: '08:00',
    endTime: '16:00',
    status: ShiftStatus.OPEN,
    specialtyRequired: 'Pediatrics',
    rate: 200,
    location: 'Riyadh'
  },
  {
    id: 's5',
    centerName: 'King Fahad Medical City',
    date: getRelativeDate(5),
    dueDate: getRelativeDate(3),
    type: ShiftType.MORNING,
    startTime: '09:00',
    endTime: '17:00',
    status: ShiftStatus.OPEN,
    specialtyRequired: 'Cardiology',
    rate: 250,
    location: 'Riyadh'
  }
];

export const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'lr1',
    doctorId: 'u1',
    doctorName: 'Dr. Sarah Ahmed',
    startDate: getRelativeDate(10),
    endDate: getRelativeDate(15),
    reason: 'Annual Family Vacation',
    status: 'Pending',
    type: 'Annual Leave'
  }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    title: 'Conflict Detected',
    message: 'Dr. Sarah Ahmed has overlapping shifts today.',
    type: 'warning',
    timestamp: '10 min ago',
    isRead: false,
    actionLink: '/schedule'
  },
  {
    id: 'n2',
    title: 'New Application',
    message: 'Dr. John Doe applied for the Night Shift at Al Amal Clinic.',
    type: 'success',
    timestamp: '1 hour ago',
    isRead: false,
    actionLink: '/marketplace'
  },
  {
    id: 'n3',
    title: 'Shift Due Date Approaching',
    message: 'The shift at Royal Care Center is due to be filled soon.',
    type: 'info',
    timestamp: '2 hours ago',
    isRead: true,
    actionLink: '/marketplace'
  },
  {
    id: 'n4',
    title: 'Wallet Credit',
    message: 'Payment of $1,200 for previous shifts has been processed.',
    type: 'success',
    timestamp: '1 day ago',
    isRead: true,
    actionLink: '/wallet'
  }
];

export const MOCK_CREDENTIALS: Credential[] = [
  { id: 'c1', name: 'Medical License', provider: 'Saudi Commission for Health Specialties', expiryDate: '2025-12-31', status: 'Valid' },
  { id: 'c2', name: 'ACLS Certification', provider: 'American Heart Association', expiryDate: getRelativeDate(30), status: 'Expiring Soon' },
  { id: 'c3', name: 'Malpractice Insurance', provider: 'Tawuniya', expiryDate: '2025-06-30', status: 'Valid' },
];

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 't1', date: getRelativeDate(-2), description: 'Shift Payment - Central City Hospital', amount: 450, type: 'credit', status: 'Completed', reference: 'PAY-8821' },
  { id: 't2', date: getRelativeDate(-5), description: 'Shift Payment - Al Amal Clinic', amount: 300, type: 'credit', status: 'Completed', reference: 'PAY-8810' },
  { id: 't3', date: getRelativeDate(-10), description: 'Withdrawal to Apple Pay', amount: -1500, type: 'debit', status: 'Completed', reference: 'WTH-9921' },
];

export const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'pm1', type: 'apple_pay', isDefault: true },
  { id: 'pm2', type: 'card', brand: 'mastercard', last4: '4242', expiry: '12/25', isDefault: false },
  { id: 'pm3', type: 'google_pay', isDefault: false },
];

export const TRANSLATIONS: Translation = {
  // Navigation
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم', es: 'Tablero', fr: 'Tableau de bord' },
  schedule: { en: 'Schedule', ar: 'الجدول', es: 'Horario', fr: 'Planning' },
  marketplace: { en: 'Marketplace', ar: 'سوق المناوبات', es: 'Mercado', fr: 'Marché' },
  doctors: { en: 'Doctors', ar: 'الأطباء', es: 'Médicos', fr: 'Médecins' },
  wallet: { en: 'Wallet', ar: 'المحفظة', es: 'Billetera', fr: 'Portefeuille' },
  profile: { en: 'My Profile', ar: 'ملفي الشخصي', es: 'Mi Perfil', fr: 'Mon Profil' },
  
  // Dashboard
  welcome: { en: 'Welcome back', ar: 'مرحباً بعودتك', es: 'Bienvenido', fr: 'Bienvenue' },
  welcomeSub: { en: "Here is what's happening in your rota today.", ar: 'إليك ما يحدث في جدولك اليوم.', es: 'Aquí está lo que sucede en su rotación hoy.', fr: 'Voici ce qui se passe dans votre planning aujourd\'hui.' },
  aiAssistant: { en: 'AI Assistant', ar: 'المساعد الذكي', es: 'Asistente IA', fr: 'Assistant IA' },
  openShifts: { en: 'Open Shifts', ar: 'المناوبات المتاحة', es: 'Turnos abiertos', fr: 'Gardes ouvertes' },
  totalShifts: { en: 'Total Shifts', ar: 'إجمالي المناوبات', es: 'Turnos totales', fr: 'Total des gardes' },
  assigned: { en: 'Assigned', ar: 'تم تعيينها', es: 'Asignado', fr: 'Assigné' },
  openSpots: { en: 'Open Spots', ar: 'أماكن شاغرة', es: 'Plazas abiertas', fr: 'Places disponibles' },
  urgentTasks: { en: 'Urgent Open Shifts (Due Soon)', ar: 'مناوبات عاجلة (تنتهي قريباً)', es: 'Turnos urgentes', fr: 'Gardes urgentes' },
  actionRequired: { en: 'Action Required', ar: 'إجراء مطلوب', es: 'Acción requerida', fr: 'Action requise' },
  approvals: { en: 'Approvals', ar: 'الموافقات', es: 'Aprobaciones', fr: 'Approbations' },
  
  // Actions
  apply: { en: 'Apply', ar: 'تقديم', es: 'Aplicar', fr: 'Postuler' },
  analyze: { en: 'Analyze Rota', ar: 'تحليل الجدول', es: 'Analizar Rota', fr: 'Analyser' },
  generate: { en: 'Auto-Generate', ar: 'توليد تلقائي', es: 'Generar Auto', fr: 'Générer' },
  import: { en: 'Import Rota', ar: 'استيراد جدول', es: 'Importar Rota', fr: 'Importer Rota' },
  postShift: { en: 'Post Shift', ar: 'نشر مناوبة', es: 'Publicar turno', fr: 'Publier une garde' },
  findDoctor: { en: 'Find Doctor', ar: 'بحث عن طبيب', es: 'Buscar médico', fr: 'Trouver un médecin' },
  requestTimeOff: { en: 'Request Time Off', ar: 'طلب إجازة', es: 'Solicitar tiempo libre', fr: 'Demander un congé' },
  export: { en: 'Export', ar: 'تصدير', es: 'Exportar', fr: 'Exporter' },
  
  // Wallet & Payments
  availableBalance: { en: 'Available Balance', ar: 'الرصيد المتاح', es: 'Saldo disponible', fr: 'Solde disponible' },
  pendingClearance: { en: 'Pending Clearance', ar: 'قيد الانتظار', es: 'Pendiente de liquidación', fr: 'En attente' },
  withdrawFunds: { en: 'Withdraw Funds', ar: 'سحب الأموال', es: 'Retirar fondos', fr: 'Retirer des fonds' },
  transactionHistory: { en: 'Transaction History', ar: 'سجل المعاملات', es: 'Historial de transacciones', fr: 'Historique des transactions' },
  paymentMethods: { en: 'Payment Methods', ar: 'طرق الدفع', es: 'Métodos de pago', fr: 'Moyens de paiement' },
  addMethod: { en: 'Add Method', ar: 'إضافة طريقة', es: 'Agregar método', fr: 'Ajouter' },
  applePay: { en: 'Apple Pay', ar: 'Apple Pay', es: 'Apple Pay', fr: 'Apple Pay' },
  googlePay: { en: 'Google Pay', ar: 'Google Pay', es: 'Google Pay', fr: 'Google Pay' },
  creditCard: { en: 'Credit/Debit Card', ar: 'بطاقة ائتمان/خصم', es: 'Tarjeta de crédito/débito', fr: 'Carte de crédit/débit' },
  
  // Forms & Modals
  centerName: { en: 'Center Name', ar: 'اسم المركز', es: 'Nombre del centro', fr: 'Nom du centre' },
  date: { en: 'Date', ar: 'التاريخ', es: 'Fecha', fr: 'Date' },
  time: { en: 'Time', ar: 'الوقت', es: 'Hora', fr: 'Heure' },
  specialty: { en: 'Specialty', ar: 'التخصص', es: 'Especialidad', fr: 'Spécialité' },
  rate: { en: 'Hourly Rate', ar: 'سعر الساعة', es: 'Tarifa por hora', fr: 'Taux horaire' },
  dueDate: { en: 'Due Date', ar: 'تاريخ الاستحقاق', es: 'Fecha de vencimiento', fr: 'Date d\'échéance' },
  submitTimesheet: { en: 'Submit Timesheet', ar: 'إرسال الجدول الزمني', es: 'Enviar hoja de horas', fr: 'Soumettre la feuille de temps' },
  handoverNotes: { en: 'Handover Notes', ar: 'ملاحظات التسليم', es: 'Notas de entrega', fr: 'Notes de transmission' },
  requestSwap: { en: 'Request Swap', ar: 'طلب تبديل', es: 'Solicitar cambio', fr: 'Demander un échange' },
  editShift: { en: 'Edit Shift', ar: 'تعديل المناوبة', es: 'Editar turno', fr: 'Modifier la garde' },
  deleteShift: { en: 'Delete Shift', ar: 'حذف المناوبة', es: 'Eliminar turno', fr: 'Supprimer la garde' },
  createPublish: { en: 'Create & Publish', ar: 'إنشاء ونشر', es: 'Crear y Publicar', fr: 'Créer et Publier' },
  uploadImage: { en: 'Upload Rota Image', ar: 'رفع صورة الجدول', es: 'Subir imagen', fr: 'Télécharger image' },
  analyzingImage: { en: 'Scanning document...', ar: 'جاري فحص المستند...', es: 'Escaneando documento...', fr: 'Analyse du document...' },
  
  // Profile
  credentials: { en: 'Professional Credentials', ar: 'الشهادات المهنية', es: 'Credenciales profesionales', fr: 'Titres professionnels' },
  uploadNew: { en: 'Upload New', ar: 'رفع جديد', es: 'Subir nuevo', fr: 'Télécharger' },
  switchRole: { en: 'Switch Role', ar: 'تبديل الدور', es: 'Cambiar rol', fr: 'Changer de rôle' },
  resetDemo: { en: 'Reset Demo Data', ar: 'إعادة ضبط البيانات', es: 'Restablecer datos', fr: 'Réinitialiser' },
  
  // General
  notifications: { en: 'Notifications', ar: 'الإشعارات', es: 'Notificaciones', fr: 'Notifications' },
  markRead: { en: 'Mark all as read', ar: 'تحديد الكل كمقروء', es: 'Marcar todo leído', fr: 'Tout marquer comme lu' },
};

export const CURRENT_USER = {
  id: 'u1',
  name: 'Dr. Sarah Ahmed',
  role: UserRole.ROTA_MANAGER,
  avatar: 'https://picsum.photos/200/200'
};