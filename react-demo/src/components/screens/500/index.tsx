import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function () {
  const navigate = useNavigate();
  return (
    <Result
      status="500"
      title="500"
      subTitle="Xin lỗi, đã xảy ra lỗi."
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          Về trang chủ
        </Button>
      }
    />
  );
}
