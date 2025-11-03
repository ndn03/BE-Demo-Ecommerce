import { Space, Typography } from 'antd';

function LabelFromItem({
  label,
  required,
}: {
  label: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Space size={4}>
      <Typography.Text style={{ fontWeight: 500 }}>{label}</Typography.Text>
      {required && (
        <Typography.Text type="danger" style={{ fontWeight: 500 }}>
          <sup>*</sup>
        </Typography.Text>
      )}
      {/* <Tag color={required ? COLORS.red[600] : COLORS.gray[500]} style={{ margin: 0 }}>
        {required ? 'Bắt buộc' : 'Tùy chọn'}
      </Tag> */}
    </Space>
  );
}

export default LabelFromItem;
