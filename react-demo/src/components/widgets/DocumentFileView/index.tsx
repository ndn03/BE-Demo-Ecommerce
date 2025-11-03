import { LoadingOutlined } from '@ant-design/icons';
import { getFilePreviewUrl } from '@src/utils/helper';
import { Col, Row, Spin } from 'antd';
import React, { useEffect, useMemo, useRef } from 'react';

type FileStyle = React.CSSProperties;

function DocumentFileView({
  fileKey,
  filename,
  fileStyle,
}: {
  fileKey: string;
  filename?: string;
  fileStyle?: FileStyle;
}) {
  const [isLoader, setIsLoader] = React.useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileKeyRef = useRef(fileKey);

  const url = useMemo(() => getFilePreviewUrl(fileKey), [fileKey]);

  useEffect(() => {
    if (fileKeyRef.current !== fileKey) {
      setIsLoader(false);
      fileKeyRef.current = fileKey;
    }
  }, [fileKey]);

  useEffect(() => {
    const currentUrl = window.location.href;
    const checkAndResetUrl = () => {
      if (window.location.href !== currentUrl)
        window.history.replaceState(null, '', currentUrl);
    };
    window.addEventListener('popstate', checkAndResetUrl);
    const intervalId = setInterval(checkAndResetUrl, 300);
    return () => {
      window.removeEventListener('popstate', checkAndResetUrl);
      clearInterval(intervalId);
    };
  }, []);

  if (!url)
    return <div className="error-container">Không thể tạo URL của file.</div>;

  return (
    <Row gutter={[24, 24]}>
      {!isLoader && (
        <Col span={24}>
          <Spin indicator={<LoadingOutlined spin />} />
        </Col>
      )}
      <Col span={24}>
        <iframe
          ref={iframeRef}
          src={url}
          style={{
            width: '100%',
            height: 'calc(100vh - 200px)',
            border: 'none',
            ...fileStyle,
          }}
          title={filename || 'File Viewer'}
          loading="lazy"
          onLoad={() => setIsLoader(true)}
        />
      </Col>
    </Row>
  );
}

export default DocumentFileView;
