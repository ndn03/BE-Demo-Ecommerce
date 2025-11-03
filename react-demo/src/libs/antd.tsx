import { Col, Row, UploadFile } from 'antd';
import { MinusCircleFilled, PaperClipOutlined } from '@ant-design/icons';
import { COLORS } from '@src/styles/theme';
import type { TabsProps } from 'antd';
import LabelFromItem from '@components/elements/LabelFormItem';

export const customizeRequiredMark = (
  label: React.ReactNode,
  { required }: { required: boolean },
) => <LabelFromItem label={label} required={required} />;

export const uploadItemRender = (
  _originNode: React.ReactElement,
  file: UploadFile,
  _fileList: Array<UploadFile>,
  actions: {
    download: () => void;
    preview: () => void;
    remove: () => void;
  },
) => (
  <Row gutter={8} style={{ marginTop: 8 }}>
    <Col>
      <PaperClipOutlined style={{ color: COLORS.gray[500] }} />
    </Col>
    <Col flex="1">{file.name}</Col>
    <Col>
      <MinusCircleFilled
        style={{ color: COLORS.gray[500] }}
        onClick={() => actions.remove()}
      />
    </Col>
  </Row>
);

export const renderTabBarButtonDefault: TabsProps['renderTabBar'] = (
  props,
  DefaultTabBar,
) => <DefaultTabBar className="tab-bar-button-default" {...props} />;
