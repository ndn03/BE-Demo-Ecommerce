import { memo, ReactNode } from 'react';
import { Spin } from 'antd';
import { useQueryProfile } from '@queries/hooks';

function LoadingApp({
  children,
  loaded,
}: {
  children: ReactNode;
  loaded: boolean;
}) {
  const { isLoading: qrProfileLoading } = useQueryProfile();

  if (qrProfileLoading && loaded)
    return (
      <div className="loading-data-main">
        <Spin />
      </div>
    );
  return children;
}

export default memo(LoadingApp);
