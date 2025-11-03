import { COLORS } from '@src/styles/theme'
import { ConfigProvider, Tag } from 'antd'
import { TagProps } from 'antd/lib'

export type TTagStatus = { children: React.ReactNode; colorTextLightSolid?: string; colorText?: string } & TagProps

function TagStatus({ children, colorTextLightSolid, colorText, ...props }: TTagStatus) {
  return (
    <ConfigProvider
      theme={{
        components: {
          Tag: {
            fontSizeSM: 14,
            borderRadiusSM: 4,
            colorTextLightSolid: colorTextLightSolid ?? COLORS.white,
            colorText: colorText ?? COLORS.gray[900],
          },
        },
      }}
    >
      <Tag {...props}>{children}</Tag>
    </ConfigProvider>
  )
}

export default TagStatus
