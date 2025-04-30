// 这是一个占位的图标模块，实际应用中应该导入或自定义这些图标组件

import { h } from 'vue';

// 创建简单的SVG图标组件
const createIconComponent = (name: string) => {
  return {
    name,
    render() {
      return h('div', { class: `icon-${name.toLowerCase()}` }, name);
    },
  };
};

// 聊天图标
export const SendSVG = createIconComponent('Send');
export const AttachmentSVG = createIconComponent('Attachment');
export const CloseSVG = createIconComponent('Close');
export const BackSVG = createIconComponent('Back');
export const InfoSVG = createIconComponent('Info');
export const MoreSVG = createIconComponent('More');
export const InterruptSVG = createIconComponent('Interrupt');
export const MicSVG = createIconComponent('Mic');
export const KeyboardSVG = createIconComponent('Keyboard');

// 消息状态图标
export const LoadingSVG = createIconComponent('Loading');
export const ErrorSVG = createIconComponent('Error');
export const SuccessSVG = createIconComponent('Success');
export const ResendSVG = createIconComponent('Resend');

// 思考相关图标
export const ReasoningEndSVG = createIconComponent('ReasoningEnd');
export const ReasoningExpandSVG = createIconComponent('ReasoningExpand');

// 用户头像
export const UserAvatarSVG = createIconComponent('UserAvatar');
export const AIAvatarSVG = createIconComponent('AIAvatar');
