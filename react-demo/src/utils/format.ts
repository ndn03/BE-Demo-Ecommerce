import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

/**
 * Hàm format khoảng thời gian giữa 2 ngày (Tiếng Việt)
 * @param {string} start - Ngày bắt đầu (YYYY-MM-DD hoặc ISO string)
 * @param {string} end - Ngày kết thúc
 * @returns {Object} { dateRange, diffDescription }
 */
export const formatDateRangeWithDuration = (start: string, end: string) => {
  const formatDate = (date: string) =>
    `${dayjs(date).format('DD/MM/YYYY')} (${dayjs(date).format('dd')})`;

  const startDay = dayjs(start);
  const endDay = dayjs(end);

  if (startDay.isSame(endDay, 'day')) {
    return {
      dateRange: `${formatDate(start)} – ${formatDate(end)}`,
      diffDescription: '1 ngày',
    };
  }

  const diffDuration = dayjs.duration(endDay.diff(startDay));

  const years = Math.floor(diffDuration.asYears());
  const remainingMonthsAfterYears = diffDuration
    .subtract(years, 'years')
    .months();
  const remainingDaysAfterMonths = diffDuration
    .subtract(years, 'years')
    .subtract(remainingMonthsAfterYears, 'months')
    .days();

  const weeks = Math.floor(remainingDaysAfterMonths / 7);
  const remainingDays = remainingDaysAfterMonths % 7;

  const durationParts: string[] = [];
  if (years > 0) durationParts.push(`${years} năm`);
  if (remainingMonthsAfterYears > 0)
    durationParts.push(`${remainingMonthsAfterYears} tháng`);
  if (weeks > 0) durationParts.push(`${weeks} tuần`);
  if (remainingDays > 0) durationParts.push(`${remainingDays} ngày`);

  const diffDescription = durationParts.join(' ');

  return {
    dateRange: `${formatDate(start)} – ${formatDate(end)}`,
    diffDescription,
  };
};
