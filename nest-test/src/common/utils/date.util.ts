import * as dayjs from 'dayjs';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

interface ISchedule {
  start: Date;
  end: Date;
}

interface IDayWithIndex {
  dayNumber: number;
  date: Date;
}

/**
 * Returns the earliest start date from an array of schedules.
 *
 * @param dates - An array of schedules, each containing a start and end date.
 * @returns The earliest start date, or null if the array is empty.
 */
export function getEarliestStartDate(dates: ISchedule[]): Date | null {
  if (dates.length === 0) {
    return null;
  }
  dates.sort((a, b) => (dayjs(a.start).isBefore(dayjs(b.start)) ? -1 : 1));
  return dayjs(dates[0].start).toDate();
}

/**
 * Generates an array of days with their corresponding index from an array of schedules.
 *
 * @param schedules - An array of schedules, each containing a start and end date.
 * @returns An array of objects, each containing a day number and a date.
 */
export function generateDaysWithIndex(schedules: ISchedule[]): IDayWithIndex[] {
  const allDays: IDayWithIndex[] = [];
  let dayCounter = 1;

  if (schedules?.length <= 0) return [];

  schedules.forEach((schedule) => {
    const startDate = dayjs(schedule.start);
    const endDate = dayjs(schedule.end);
    let currentDate = startDate;

    while (currentDate.isSameOrBefore(endDate)) {
      allDays.push({
        dayNumber: dayCounter,
        date: currentDate.toDate(),
      });
      currentDate = currentDate.add(1, 'day');
      dayCounter++;
    }
  });

  allDays.sort((a, b) => (dayjs(a.date).isBefore(b.date) ? -1 : 1));

  return allDays;
}

/**
 * Counts the number of leave days that fall within a given schedule range.
 *
 * @param schedules - An object containing a start and end date representing the schedule range.
 * @param leaveDays - An array of dates representing the leave days.
 * @returns The number of leave days that fall within the schedule range.
 */
export function countLeaveDaysInRange(
  schedules: ISchedule,
  leaveDays: Date[],
): number {
  if (leaveDays?.length < 0) return 0;

  const count = leaveDays.filter((day) => {
    return (
      dayjs(day).isSameOrAfter(schedules.start) &&
      dayjs(day).isSameOrBefore(schedules.end)
    );
  }).length;

  return count;
}
