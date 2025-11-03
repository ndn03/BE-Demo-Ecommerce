import { SearchOutlined } from '@ant-design/icons';
import { fnDebounce } from '@src/utils/helper';
import { ConfigProvider, Input } from 'antd';
import { InputProps } from 'antd/lib';
import { useState } from 'react';

type TSearchInput = {
  placeholder?: string;
  onSearch?: (s: string) => void;
  disabled?: boolean;
  style?: React.CSSProperties;
};

function SearchInput({
  placeholder = 'Vui lòng nhập từ khóa',
  onSearch,
  disabled,
  style,
  ...props
}: TSearchInput & InputProps) {
  const [value, setValue] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    fnDebounce(() => {
      if (onSearch) onSearch(newValue);
    }, 300);
  };
  return (
    <ConfigProvider
      theme={{ components: { Input: {}, Form: { itemMarginBottom: 0 } } }}
    >
      <Input
        value={value}
        disabled={!!disabled}
        prefix={<SearchOutlined />}
        placeholder={placeholder}
        allowClear
        onChange={handleChange}
        style={style}
        {...props}
      />
    </ConfigProvider>
  );
}

export default SearchInput;
