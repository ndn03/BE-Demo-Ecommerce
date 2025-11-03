import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useRefreshOnFocus(refetch: () => void, enabled = true) {
  const { key } = useLocation(); // Theo dõi URL hiện tại
  const enabledRef = useRef(false);

  useEffect(() => {
    if (enabled && enabledRef.current) {
      // Refetch mỗi khi route thay đổi
      refetch();
    } else {
      enabledRef.current = true;
    }
  }, [key, refetch]);
}
