// ⚠️ File này được tạo tự động. Không chỉnh sửa trực tiếp.
import { Typography } from 'antd';

function TermOfPolicyLink({ style }: { style?: React.CSSProperties }) {
  return (
    <Typography.Text
      type="secondary"
      style={{
        fontSize: 12,
        position: 'absolute',
        bottom: 10,
        left: 24,
        ...style,
      }}
    >
      <Typography.Link
        href="/chinh-sach-bao-mat"
        rel="noopener noreferrer"
        target="_blank"
        underline
        style={{ fontSize: 12 }}
      >
        Chính sách bảo mật
      </Typography.Link>
      {' • '}
      <Typography.Link
        href="/dieu-khoan-su-dung"
        rel="noopener noreferrer"
        target="_blank"
        underline
        style={{ fontSize: 12 }}
      >
        Điều khoản sử dụng
      </Typography.Link>
    </Typography.Text>
  );
}

export default TermOfPolicyLink;
