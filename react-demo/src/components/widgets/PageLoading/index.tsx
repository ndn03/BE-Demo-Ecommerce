import { memo } from 'react'
import { Flex, Spin } from 'antd'

function PageLoading() {
  return (
    <Flex align="center" justify="center" style={{ width: '100%', height: 300 }}>
      <Spin />
    </Flex>
  )
}

export default memo(PageLoading)
