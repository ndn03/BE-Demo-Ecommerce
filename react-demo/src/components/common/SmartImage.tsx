/**
 * 🖼️ **Smart Image Component**
 *
 * Component for displaying images from Uploadcare with fallback and optimization
 */

import React, { useState } from 'react';
import { Avatar, Image as AntImage } from 'antd';
import { UserOutlined, PictureOutlined } from '@ant-design/icons';
import { ImageHelper } from '../../libs/upload';

interface SmartImageProps {
  /** Uploadcare file ID or URL */
  fileId?: string | null;
  /** Image size for optimization */
  size?: 'small' | 'medium' | 'large';
  /** Custom width */
  width?: number;
  /** Custom height */
  height?: number;
  /** Fallback type */
  fallbackType?: 'avatar' | 'product' | 'brand' | 'general';
  /** Whether to show as avatar */
  isAvatar?: boolean;
  /** Avatar size (when isAvatar=true) */
  avatarSize?: number;
  /** Preview functionality */
  preview?: boolean;
  /** Show loading placeholder */
  showPlaceholder?: boolean;
  /** Custom fallback image */
  fallbackSrc?: string;
  /** Custom transformations */
  transformations?: string;
  /** Quality (1-100) */
  quality?: number;
  /** Alt text */
  alt?: string;
  /** CSS style */
  style?: React.CSSProperties;
  /** CSS class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
}

const SmartImage: React.FC<SmartImageProps> = ({
  fileId,
  size = 'medium',
  width,
  height,
  fallbackType = 'general',
  isAvatar = false,
  avatarSize = 40,
  preview = true,
  showPlaceholder = true,
  fallbackSrc,
  transformations,
  quality = 85,
  alt = '',
  style,
  className,
  onClick,
}) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Build image URL based on props
  const getImageUrl = (): string => {
    if (!fileId || imageError) {
      return fallbackSrc || ImageHelper.getFallback(fallbackType);
    }

    // Custom transformations
    if (transformations) {
      return ImageHelper.getImageUrl(fileId, transformations);
    }

    // Avatar mode
    if (isAvatar) {
      return ImageHelper.getAvatar(fileId, avatarSize);
    }

    // Custom dimensions
    if (width && height) {
      const resizeTransform = `-/resize/${width}x${height}/-/quality/${quality}/-/format/auto/`;
      return ImageHelper.getImageUrl(fileId, resizeTransform);
    }

    // Custom width only
    if (width) {
      return ImageHelper.getThumbnail(fileId, width);
    }

    // Standard sizes
    return ImageHelper.getProductImage(fileId, size);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  // Avatar component
  if (isAvatar) {
    return (
      <Avatar
        size={avatarSize}
        src={!imageError ? getImageUrl() : undefined}
        icon={imageError ? <UserOutlined /> : undefined}
        style={style}
        className={className}
        onClick={onClick}
      />
    );
  }

  // Regular image component
  return (
    <AntImage
      src={getImageUrl()}
      alt={alt}
      style={style}
      className={className}
      preview={preview && !imageError}
      placeholder={
        showPlaceholder && loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: height || 200,
              backgroundColor: '#f5f5f5',
              color: '#999',
            }}
          >
            <PictureOutlined style={{ fontSize: 24 }} />
          </div>
        ) : undefined
      }
      onLoad={handleImageLoad}
      onError={handleImageError}
      width={width}
      height={height}
    />
  );
};

export default SmartImage;
