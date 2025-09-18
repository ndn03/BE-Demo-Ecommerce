export const ALLOWED_MIME_TYPES_FOR_IMAGE = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/jpg',
  'image/webp',
  'image/tiff',
  'image/svg+xml',
];

export const ALLOWED_MIME_TYPES_FOR_VIDEO = [
  'video/mp4',
  'video/quicktime',
  'video/x-ms-wmv',
  'video/x-msvideo',
  'video/x-matroska',
  'video/x-flv',
  'video/webm',
  'video/mp2t',
];

export const ALLOWED_MIME_TYPES_FOR_DOCUMENT = [
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/xml',
  'text/xml',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
];

export const ALLOWED_MIME_TYPES_FOR_AUDIO = [
  'audio/mpeg',
  'audio/flac',
  'audio/wav',
  'audio/x-ms-wma',
  'audio/aac',
  'audio/mp4',
];

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES_FOR_IMAGE,
  ...ALLOWED_MIME_TYPES_FOR_VIDEO,
  ...ALLOWED_MIME_TYPES_FOR_DOCUMENT,
  ...ALLOWED_MIME_TYPES_FOR_AUDIO,
];

export const ALLOWED_MIME_TYPES_FOR_IMPORT_DATA = [
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
