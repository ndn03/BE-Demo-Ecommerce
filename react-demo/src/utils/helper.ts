import Ppt from '@assets/ppt.svg';
import Pdf from '@assets/pdf.svg';
import Docx from '@assets/docx.svg';
import Xls from '@assets/xls.svg';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

// Uploadcare endpoint for file access
const UPLOADCARE_ENDPOINT = 'https://ucarecdn.com';

import { MIME_TYPES } from './mime-type';

/* eslint-disable no-param-reassign */
export const removeAccents = (str: string) => {
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
};

export const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

export const convertToSlug = (text: string) => {
  const a = removeAccents(text);
  return a
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export function formatNumberWithDot(n?: number) {
  return n
    ? n.toString().replace(/\B(?!\.\d*)(?=(\d{3})+(?!\d))/g, '.')
    : 'N/A';
}

export function fnSortElObjByKey<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries({ ...obj }).sort(([keyA], [keyB]) => {
      if (keyA < keyB) return -1;
      if (keyA > keyB) return 1;
      return 0;
    }),
  ) as T;
}

export const fnDebounce = (function () {
  let timer: any = 0;
  return function (callback: any, ms: number) {
    clearTimeout(timer);
    timer = setTimeout(callback, ms);
  };
})();

export function generateRandomPassword(
  length = 12,
  includeNumbers = true,
  includeSymbols = false,
): string {
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numberChars = '0123456789';
  const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let password = '';
  password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
  password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));

  if (includeNumbers)
    password += numberChars.charAt(
      Math.floor(Math.random() * numberChars.length),
    );

  if (includeSymbols)
    password += symbolChars.charAt(
      Math.floor(Math.random() * symbolChars.length),
    );

  let chars = lowerChars + upperChars;
  if (includeNumbers) chars += numberChars;
  if (includeSymbols) chars += symbolChars;

  while (password.length < length) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  const passwordArr = password.split('');
  for (let i = passwordArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = passwordArr[i];
    passwordArr[i] = passwordArr[j];
    passwordArr[j] = temp;
  }

  return passwordArr.join('');
}

export function getFileTypeIconDocument(fileName: string) {
  const extension = fileName.split('.').pop();
  if (!extension) return undefined;
  if (['csv', 'xlsx', 'xls'].includes(extension)) return Xls;
  if (['doc', 'docx'].includes(extension)) return Docx;
  if (['ppt', 'pptx'].includes(extension)) return Ppt;
  if (['pdf'].includes(extension)) return Pdf;
  return undefined;
}

/**
 * Helper: Tạo URL xem tài liệu qua Microsoft Office Online Viewer
 */
function getMsOfficeViewerUrl(fileName: string): string {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
    `${UPLOADCARE_ENDPOINT}/${fileName}`,
  )}&wdAllowInteractivity=FALSE&wdDownloadButton=FALSE&wdInConfigurator=TRUE`;
}

/**
 * Helper: Tạo URL xem tài liệu qua Google Docs Viewer
 */
function getGoogleDocsViewerUrl(fileName: string): string {
  return `https://docs.google.com/gview?url=${encodeURIComponent(
    `${UPLOADCARE_ENDPOINT}/${fileName}`,
  )}&embedded=true`;
}

/**
 * Helper: Tạo URL xem tài liệu qua Google Docs Viewer
 */
export function getFilePreviewUrl(fileName: string): string | undefined {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (!extension) {
    return undefined;
  }

  const viewerMap: Record<string, (file: string) => string> = {
    // Microsoft Office Viewer cho các file văn phòng
    doc: (file) => getMsOfficeViewerUrl(file),
    docx: (file) => getMsOfficeViewerUrl(file),
    csv: (file) => getMsOfficeViewerUrl(file),
    xlsx: (file) => getMsOfficeViewerUrl(file),
    xls: (file) => getMsOfficeViewerUrl(file),
    ppt: (file) => getMsOfficeViewerUrl(file),
    pptx: (file) => getMsOfficeViewerUrl(file),

    pdf: (file) => `${UPLOADCARE_ENDPOINT}/${file}`,
  };

  return viewerMap[extension]
    ? viewerMap[extension](fileName)
    : getGoogleDocsViewerUrl(fileName);
}

/**
 * Helper: Kiểm tra xem file có phải là ảnh hay không
 * @param fileName Tên file
 * @returns true nếu file là ảnh, false nếu không phải
 * @example checkIsImageAttachment('image.png') => true
 */
export function checkIsImageAttachment(fileName: string) {
  const extension = fileName.split('.').pop();
  if (!extension) return undefined;
  if (['png', 'jpg', 'jpeg', 'gif'].includes(extension)) return true;
  return false;
}

export function getMimeTypeFromExtension(filename: string): string | null {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return null;
  return MIME_TYPES[extension] || null;
}

// Function to check if a file is an image based on its extension
export const isImageFile = (filename: string): boolean => {
  const mimeType = getMimeTypeFromExtension(filename);
  return mimeType ? mimeType.startsWith('image/') : false;
};

// Function to check if a file is a document based on its extension
export const isDocumentFile = (filename: string): boolean => {
  const mimeType = getMimeTypeFromExtension(filename);
  const ALLOWED_MIME_TYPES_FOR_DOCUMENT = [
    MIME_TYPES.pdf,
    MIME_TYPES.doc,
    MIME_TYPES.docx,
    MIME_TYPES.xls,
    MIME_TYPES.xlsx,
    MIME_TYPES.ppt,
    MIME_TYPES.pptx,
    MIME_TYPES.csv,
    MIME_TYPES.txt,
    MIME_TYPES.xml,
    MIME_TYPES.odt,
    MIME_TYPES.ods,
  ];
  return mimeType ? ALLOWED_MIME_TYPES_FOR_DOCUMENT.includes(mimeType) : false;
};
export const formatDateRelativeToToday = (inputDate: Date): string => {
  const date = dayjs(inputDate);
  const today = dayjs();

  if (date.isSame(today, 'day')) {
    return date.format('HH:mm');
  }
  if (date.isSame(today, 'year')) {
    return date.format('MM/DD HH:mm');
  }
  return date.format('DD/MM/YYYY HH:mm');
};
export const isOver24Hours = (inputDate: Date): boolean => {
  const now = dayjs();
  const date = dayjs(inputDate);
  return now.diff(date, 'hour') >= 24;
};

export function findNearestRange(
  ranges: [Date, Date][],
  date: Date = new Date(),
): [Date, Date] {
  // Ưu tiên 1: now nằm trong khoảng
  const inRange = ranges.find(([start, end]) =>
    dayjs(date).isBetween(start, end),
  );
  if (inRange) return inRange;

  // Ưu tiên 2: tìm khoảng sắp tới gần nhất
  const upcoming = ranges
    .filter(([start]) => dayjs(start).isAfter(date))
    .sort((a, b) => dayjs(a[0]).diff(b[0]));
  if (upcoming.length) return upcoming[0];

  // Ưu tiên 3: lấy khoảng cuối cùng
  return ranges[ranges.length - 1];
}
