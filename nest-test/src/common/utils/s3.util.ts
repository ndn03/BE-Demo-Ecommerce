export const S3_CHAT_PREFIX = 'chat';
export const S3_CHAT_TMP_PREFIX = 'chat-tmp';

export const formatChatFolder = (userId: string | number) =>
  `${userId.toString()}/${S3_CHAT_PREFIX}`;

export const formatChatTmpFolder = (userId: string | number) =>
  `${S3_CHAT_TMP_PREFIX}/${userId.toString()}`;
