import { TQueryList, TResDataListApi } from '@src/configs/interface.config';
// import { useInfinityQueryByRequest } from '@queries/hooks';
import { fnDebounce } from '@src/utils/helper';
import { Select, SelectProps } from 'antd';
import React, {
  forwardRef,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';

// Helper function to replace lodash get
const getNestedProperty = (
  obj: any,
  path: string | number | keyof any,
): any => {
  if (typeof path === 'number') return obj[path];
  const pathStr = String(path);
  return pathStr.split('.').reduce((current, key) => current?.[key], obj);
};

// Mock hook for useInfinityQueryByRequest
const useInfinityQueryByRequest = <T,>(
  request: (params: any) => Promise<TResDataListApi<T[]>>,
  queryKey: string[],
  params: any,
  queryFlag: boolean,
) => {
  const [data, setData] = useState<{ pages: { data: T[] }[] } | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
  const [hasNextPage] = useState(false);

  const fetchNextPage = async () => {
    setIsFetchingNextPage(true);
    // Mock implementation
    setTimeout(() => setIsFetchingNextPage(false), 1000);
  };

  useEffect(() => {
    if (queryFlag && params) {
      setIsLoading(true);
      request(params)
        .then((result) => {
          setData({ pages: [{ data: result.data }] });
        })
        .catch(() => {
          setData({ pages: [{ data: [] }] });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [params, queryFlag, request]);

  return {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  };
};

export type TValueTypeSelectSearchAndLoadMore = {
  key?: string;
  label: ReactNode;
  value: string | number;
  disabled?: boolean;
  title?: string;
};

export type TSelectSearchAndLoadMore<T, k = TQueryList> = Omit<
  SelectProps<
    TValueTypeSelectSearchAndLoadMore | TValueTypeSelectSearchAndLoadMore[]
  >,
  'options' | 'children' | 'labelInValue'
> & {
  request: (params: TQueryList) => Promise<TResDataListApi<T[]>>;
  queryFlag?: boolean;
  queryKey: string[];
  queryParams: k;
  debounceTimeout?: number;
  initOptions?: TValueTypeSelectSearchAndLoadMore[];
  valueField: {
    key: keyof T | string;
    label: keyof T | string;
    value: keyof T | string;
    fallbackLabel?: keyof T | string;
    prefixValue?: keyof T | string;
  };
  onSelect?: (value: TValueTypeSelectSearchAndLoadMore) => void;
  disableFlag?: boolean;
};

function SelectSearchAndLoadMore<T, k = TQueryList>({
  request,
  queryFlag = false,
  queryKey,
  queryParams,
  valueField,
  debounceTimeout = 400,
  initOptions = [],
  onSelect,
  disableFlag,
  ...props
}: TSelectSearchAndLoadMore<T, k>) {
  const [params, setParams] = useState<k>();
  useEffect(() => {
    setParams(queryParams);
  }, [queryParams]);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfinityQueryByRequest<T>(request, queryKey, params, queryFlag);

  const theData = useMemo<T[]>(
    () =>
      (data?.pages?.map((page: { data: T[] }) => page.data).flat(1) as T[]) ||
      [],
    [data],
  );

  const onScroll = async (e: { target: any }) => {
    const { target } = e;
    if (
      !isLoading &&
      !isFetching &&
      !isFetchingNextPage &&
      hasNextPage &&
      target.scrollTop + target.offsetHeight === target.scrollHeight
    ) {
      await fetchNextPage();
    }
  };

  const onSearch = (textS: string) => {
    fnDebounce(() => {
      const newParams = { ...params, s: textS } as unknown as k;
      setParams(newParams);
    }, debounceTimeout);
  };

  const selectedValues = Array.isArray(props.value)
    ? props.value.map((v) => v.value)
    : [props.value?.value];
  const filteredInitOptions = initOptions.filter((option) =>
    selectedValues.includes(option.value),
  );
  const allOptions = [
    ...filteredInitOptions,
    ...theData
      .filter(
        (d) =>
          !filteredInitOptions.some(
            (o) => o.value === getNestedProperty(d, valueField.value),
          ),
      )
      .map((d) => ({
        key:
          getNestedProperty(d, valueField.key) ||
          getNestedProperty(d, valueField.value),
        value: getNestedProperty(d, valueField.value),
        label:
          getNestedProperty(d, valueField.label) ||
          (valueField?.fallbackLabel
            ? getNestedProperty(d, valueField.fallbackLabel)
            : ''),
        disabled: false,
      })),
  ];

  return (
    <Select
      style={{ width: '100%' }}
      labelInValue
      placeholder="Vui lòng chọn"
      loading={isLoading || isFetchingNextPage}
      filterOption={false}
      onPopupScroll={onScroll}
      onSearch={onSearch}
      showSearch
      onSelect={(value) => {
        const newParams = { ...params, s: undefined } as unknown as k;
        setParams(newParams);
        if (onSelect) void onSelect(value);
      }}
      disabled={isLoading && disableFlag}
      {...props}
    >
      {allOptions.map((o) => (
        <Select.Option key={o.key} value={o.value}>
          {o.label}
        </Select.Option>
      ))}
    </Select>
  );
}

export default React.memo(
  forwardRef(SelectSearchAndLoadMore),
) as typeof SelectSearchAndLoadMore;
