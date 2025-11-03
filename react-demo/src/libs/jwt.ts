import dayjs from 'dayjs'
import { jwtDecode } from 'jwt-decode'

export const validTokenFn = (accessToken: string | null | undefined) => {
  const now = dayjs().unix()
  if (!accessToken) return ''
  const payload = jwtDecode(accessToken)
  if (payload && payload?.exp && payload.exp > now) return accessToken
  return ''
}
