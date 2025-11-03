import React, { useEffect, useRef, useState } from 'react'
import TagStatus, { TTagStatus } from '@src/components/elements/TagStatus'
import { Col, Row, Tooltip } from 'antd'
import { COLORS } from '@src/styles/theme'

function ResponsiveTagList({ tags }: { tags: TTagStatus[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(tags.length)
  const [isFirstTag, setIsFirstTag] = useState(false)

  const tagStatusStyle: React.CSSProperties = {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateVisibleTags = () => {
      setVisibleCount(tags.length)
      const containerWidth = container.clientWidth
      let totalWidth = 0
      let count = 0
      const gap = 8

      const firstTagWidth = (container.children[0] as HTMLElement).offsetWidth

      if (firstTagWidth * 2 + gap > containerWidth) {
        setVisibleCount(1)
        setIsFirstTag(true)
      } else {
        setIsFirstTag(false)
        for (const tag of Array.from(container.children)) {
          const tagWidth = (tag as HTMLElement).offsetWidth
          if (totalWidth + tagWidth + count * gap + (count + 1) * 2 * 8 > containerWidth) break
          totalWidth += tagWidth
          count++
        }
        setVisibleCount(count > 0 ? count : 0)
      }
    }

    const resizeObserver = new ResizeObserver(updateVisibleTags)
    resizeObserver.observe(container)

    updateVisibleTags()
    // eslint-disable-next-line consistent-return
    return () => resizeObserver.disconnect()
  }, [tags])

  return (
    <>
      <Row gutter={8} wrap={false} style={{ width: '100%', overflow: 'hidden' }}>
        {tags.slice(0, visibleCount).map((tag, index) => (
          <Col key={index} flex={visibleCount === 1 && isFirstTag ? 1 : undefined} style={{ maxWidth: 'fit-content' }}>
            <TagStatus color={COLORS.gray[50]} colorTextLightSolid={COLORS.gray[900]} {...tag} style={tagStatusStyle} />
          </Col>
        ))}
        {visibleCount < tags.length && (
          <Col>
            <Tooltip
              title={tags
                .slice(visibleCount)
                .map((tag) => tag.children)
                .join(', ')}
            >
              <TagStatus color={COLORS.gray[50]} colorTextLightSolid={COLORS.gray[900]}>
                +{tags.length - visibleCount}
              </TagStatus>
            </Tooltip>
          </Col>
        )}
      </Row>
      <Row ref={containerRef} style={{ height: 0, opacity: 0 }}>
        {tags.map((tag, index) => (
          <Col key={index}>
            <TagStatus {...tag} />
          </Col>
        ))}
      </Row>
    </>
  )
}

export default ResponsiveTagList
