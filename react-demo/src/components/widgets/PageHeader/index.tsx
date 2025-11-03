import { ArrowLeftOutlined } from '@ant-design/icons'
import { Col, ConfigProvider, Flex, Row, Typography } from 'antd'
import React from 'react'
import { useNavigate } from 'react-router-dom'

type TPageHeader = {
  title?: string
  extra?: React.ReactNode
  backToPage?: boolean
  onBackToPage?: () => void
  fontSizeTitle?: number
  mTBackToPage?: number
}

function PageHeader({ title, extra, backToPage = false, onBackToPage, fontSizeTitle, mTBackToPage }: TPageHeader) {
  const navigate = useNavigate()
  return (
    <Row gutter={[24, 24]} align="bottom">
      <Col xs={24} sm={24} xl={!extra ? 24 : 10}>
        <Flex gap={16} align="flex-start">
          {backToPage && (
            <ArrowLeftOutlined
              onClick={() => {
                if (onBackToPage) {
                  onBackToPage()
                } else {
                  navigate(-1)
                }
              }}
              style={{ fontSize: 18, marginTop: mTBackToPage || 8 }}
            />
          )}
          {title && (
            <ConfigProvider
              theme={{
                components: {
                  Typography: {
                    fontSize: fontSizeTitle || 24,
                  },
                },
              }}
            >
              <Typography.Text>{title}</Typography.Text>
            </ConfigProvider>
          )}
        </Flex>
      </Col>
      {extra && (
        <Col xs={24} sm={24} xl={14}>
          {extra}
        </Col>
      )}
    </Row>
  )
}

export default PageHeader
