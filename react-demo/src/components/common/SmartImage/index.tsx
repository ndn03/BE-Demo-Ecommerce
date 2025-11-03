import React from 'react';
import { Avatar, Image } from 'antd';
import { UserOutlined, FileImageOutlined } from '@ant-design/icons';
import { getUploadCareFileUrl } from '@libs/upload';

interface SmartImageProps {
  fileId?: string;
  isAvatar?: boolean;
  avatarSize?: number;
  fallbackType?: 'avatar' | 'image';
  alt?: string;
  transformations?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SmartImage: React.FC<SmartImageProps> = ({
  fileId,
  isAvatar = false,
  avatarSize = 64,
  fallbackType = 'image',
  alt = '',
  transformations,
  className,
  style,
}) => {
  const imageUrl = fileId
    ? getUploadCareFileUrl(fileId, transformations)
    : undefined;

  if (isAvatar) {
    return (
      <Avatar
        size={avatarSize}
        src={imageUrl}
        icon={
          fallbackType === 'avatar' ? <UserOutlined /> : <FileImageOutlined />
        }
        alt={alt}
        className={className}
        style={style}
      />
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN..."
      preview={{
        mask: false,
      }}
    />
  );
};

export default SmartImage;
