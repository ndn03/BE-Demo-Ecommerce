/* eslint-disable react/function-component-definition */
import { CloseOutlined } from '@ant-design/icons';
import { MIME_TYPES } from '@src/utils/mime-type';
import { Button, ConfigProvider, Modal } from 'antd';
import { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import DocumentFileView from '@components/widgets/DocumentFileView';

import styles from './styles.module.less';

export type TDocumentPreviewModal = { fileKey: string; fileName?: string };

export type TDocumentPreviewModalHandle = {
  onOpen: (x: boolean) => void;
};

const DocumentPreviewModal: React.ForwardRefRenderFunction<
  TDocumentPreviewModalHandle,
  TDocumentPreviewModal
> = ({ fileKey, fileName }, ref) => {
  const fileType = useMemo(() => fileKey.split('.').at(-1), [fileKey]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useImperativeHandle(ref, () => ({
    onOpen: (x) => {
      setIsLoading(true);
      setIsOpen(x);
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    },
  }));
  const onCancel = () => {
    setIsLoading(false);
    setIsOpen(false);
  };

  // Mock download function for Uploadcare
  const downloadMedia = {
    mutate: (fileKey: string) => {
      const link = document.createElement('a');
      link.href = `https://ucarecdn.com/${fileKey}`;
      link.download = fileName || fileKey;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    status: 'idle' as 'idle' | 'pending' | 'success' | 'error',
  };

  return (
    <ConfigProvider
      theme={{
        components: {
          Modal: { boxShadow: 'none', contentBg: 'rbga(0,0,0,0)' },
        },
      }}
    >
      <Modal
        maskClosable={false}
        open={isOpen}
        onCancel={onCancel}
        width={1200}
        footer={false}
        centered
        closeIcon={<CloseOutlined style={{ color: 'white' }} />}
        className={styles.documentPreviewModal}
      >
        <div style={{ backgroundColor: 'white', marginTop: 20 }}>
          <DocumentFileView
            fileKey={fileKey}
            filename={fileName}
            fileStyle={{ height: '85vh' }}
          />
          {fileType !== MIME_TYPES.pdf && !isLoading && (
            <Button
              className={styles.download}
              type="primary"
              onClick={() => downloadMedia.mutate(fileKey)}
              loading={downloadMedia.status === 'pending'}
            >
              Tải xuống
            </Button>
          )}
        </div>
      </Modal>
    </ConfigProvider>
  );
};

export default forwardRef(DocumentPreviewModal);
