/**
 * 📅 **Custom DatePicker Locale**
 *
 * Vietnamese locale configuration for Ant Design DatePicker
 */

export const CUSTOMIZE_DATE_PICKER_LOCALE = {
  lang: {
    locale: 'vi_VN',
    placeholder: 'Chọn ngày',
    rangePlaceholder: ['Ngày bắt đầu', 'Ngày kết thúc'],
    today: 'Hôm nay',
    now: 'Bây giờ',
    backToToday: 'Trở lại hôm nay',
    ok: 'OK',
    clear: 'Xóa',
    month: 'Tháng',
    year: 'Năm',
    timeSelect: 'Chọn thời gian',
    dateSelect: 'Chọn ngày',
    monthSelect: 'Chọn tháng',
    yearSelect: 'Chọn năm',
    decadeSelect: 'Chọn thập kỷ',
    yearFormat: 'YYYY',
    dateFormat: 'DD/MM/YYYY',
    dayFormat: 'DD',
    dateTimeFormat: 'DD/MM/YYYY HH:mm:ss',
    monthFormat: 'MM/YYYY',
    monthBeforeYear: true,
    previousMonth: 'Tháng trước (PageUp)',
    nextMonth: 'Tháng sau (PageDown)',
    previousYear: 'Năm trước (Control + left)',
    nextYear: 'Năm sau (Control + right)',
    previousDecade: 'Thập kỷ trước',
    nextDecade: 'Thập kỷ sau',
    previousCentury: 'Thế kỷ trước',
    nextCentury: 'Thế kỷ sau',
    shortWeekDays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    shortMonths: [
      'Th1',
      'Th2',
      'Th3',
      'Th4',
      'Th5',
      'Th6',
      'Th7',
      'Th8',
      'Th9',
      'Th10',
      'Th11',
      'Th12',
    ],
    // Required week property for Ant Design PickerLocale
    week: {
      dow: 1, // Monday is the first day of the week
      doy: 4, // The week that contains Jan 4th is the first week of the year
    },
  },
  timePickerLocale: {
    placeholder: 'Chọn thời gian',
    rangePlaceholder: ['Thời gian bắt đầu', 'Thời gian kết thúc'],
  },
};
