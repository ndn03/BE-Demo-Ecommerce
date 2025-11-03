import { Result, Button } from 'antd';
import { ResultStatusType } from 'antd/es/result';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ({
  statusCode = 500,
  message,
}: {
  statusCode?: number;
  message?: string;
}) {
  const navigate = useNavigate();
  const code: ResultStatusType = useMemo(() => {
    if (statusCode === 500 || statusCode === 403 || statusCode === 404)
      return statusCode;
    return 500;
  }, [statusCode]);
  const subTitle = useMemo(() => {
    if (message) return message;
    switch (statusCode) {
      case 403:
        return 'Xin lỗi, bạn không có quyền truy cập trang này.';
      case 404:
        return 'Xin lỗi, trang bạn tìm kiếm không tồn tại.';
      default:
        return 'Xin lỗi, đã xảy ra lỗi.';
    }
  }, [statusCode]);
  return (
    <Result
      status={code}
      title={code}
      subTitle={subTitle}
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      }
    />
  );
}
