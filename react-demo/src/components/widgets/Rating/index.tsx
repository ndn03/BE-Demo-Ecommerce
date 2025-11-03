import { Rate } from 'antd'
import { useEffect, useState } from 'react'
import Star from '@assets/star.svg'
import StarHover from '@assets/star.png'
import HalfStar from '@assets/rating.png'

type TRating = {
  rating?: number
  onChange?: (value: number) => void
  isPending?: boolean
  size?: number
}

function Rating({ rating, onChange, isPending, size = 40 }: TRating) {
  const [value, setValue] = useState(rating || 0)
  const [hoverValue, setHoverValue] = useState<number>(0)

  useEffect(() => {
    setValue(rating || 0)
  }, [rating])
  const handleRating = (value: number) => {
    if (onChange) {
      onChange(value)
    }
  }

  return (
    <Rate
      style={{ marginTop: 15 }}
      allowHalf
      disabled={isPending}
      value={value}
      onChange={handleRating}
      onHoverChange={(v) => setHoverValue(v)}
      character={({ index }) => {
        if (index === undefined) return null

        const currentStar = index + 1

        // Ưu tiên hoverValue nếu đang hover, nếu không thì lấy value
        const activeValue = hoverValue || value

        let src = Star
        if (activeValue >= currentStar) {
          src = StarHover // full star
        } else if (activeValue >= currentStar - 0.5) {
          src = HalfStar // half star
        }

        return (
          <img
            src={src}
            alt="star"
            style={{
              width: size,
              height: size,
              transition: 'all 0.3s ease',
            }}
          />
        )
      }}
    />
  )
}

export default Rating
