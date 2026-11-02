import i18n from '@/translations';
import messages from './translations.json';
i18n.addResourceBundle(
  'vi',
  'operations',
  {
    ...messages.vi,
    'status.PENDING': 'Chờ xác nhận',
    'status.PAID': 'Đã thu tiền',
    'status.EXPIRED': 'Hết hạn',
    'status.CANCELLED': 'Đã hủy',
    'status.overdue': 'Quá hạn giữ chỗ',
    loading: 'Đang tải',
    retry: 'Thử lại',
    denied: 'Bạn không có quyền thực hiện thao tác này.',
    notFound: 'Không tìm thấy dữ liệu.',
    mock: 'UI mock · dữ liệu thử trong bộ nhớ',
  },
  true,
  true
);
i18n.addResourceBundle(
  'en',
  'operations',
  {
    ...messages.en,
    'status.PENDING': 'Awaiting confirmation',
    'status.PAID': 'Paid',
    'status.EXPIRED': 'Expired',
    'status.CANCELLED': 'Cancelled',
    'status.overdue': 'Hold expired',
    loading: 'Loading',
    retry: 'Try again',
    denied: 'You do not have permission for this action.',
    notFound: 'Data not found.',
    mock: 'UI mock · test data in memory',
  },
  true,
  true
);
