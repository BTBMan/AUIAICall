import { AICallErrorCode } from 'aliyun-auikit-aicall'

const ErrorCodeMessageMap: { [key: number]: string } = {
  [AICallErrorCode.ConnectionFailed]: '通话失败，当前网络连接出现问题',
  [AICallErrorCode.KickedByUserReplace]: '通话失败，当前用户可能登录了其他设备',
  [AICallErrorCode.KickedBySystem]: '通话失败，被系统结束通话',
  [AICallErrorCode.LocalDeviceException]: '通话失败，本地设备出现了错误',
  [AICallErrorCode.AgentLeaveChannel]: '通话失败，智能体停止通话了',
  [AICallErrorCode.AgentPullFailed]: '通话失败，智能体拉流失败',
  [AICallErrorCode.AgentASRFailed]: '第三方ASR服务不可用',
  [AICallErrorCode.AvatarServiceFailed]: '数字人服务不可用',
  [AICallErrorCode.AvatarRoutesExhausted]: '数字人通话火爆，请稍后尝试或先享AI音频通话新体验。',
  [AICallErrorCode.TokenExpired]: '通话失败，当前授权已过期',
  [AICallErrorCode.AgentSubscriptionRequired]: '接通失败，请检查您账号是否正确订购套餐',
  [AICallErrorCode.AgentNotFound]: '接通失败，请检查智能体ID是否正确',
}

export function getErrorMessage(errorCode?: number) {
  return ErrorCodeMessageMap[errorCode] || '通话失败，发生未知错误'
}
