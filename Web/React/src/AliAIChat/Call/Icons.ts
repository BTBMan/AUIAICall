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

// 通话图标
export const CallPhoneSVG = createIconComponent('CallPhone');
export const CameraClosedSVG = createIconComponent('CameraClosed');
export const CameraSVG = createIconComponent('Camera');
export const CameraSwitchSVG = createIconComponent('CameraSwitch');
export const MicrophoneClosedSVG = createIconComponent('MicrophoneClosed');
export const MicrophoneSVG = createIconComponent('Microphone');

// 设置图标
export const SettingSVG = createIconComponent('Setting');

// 音色图标
export const VoiceOneSVG = createIconComponent('VoiceOne');
export const VoiceTwoSVG = createIconComponent('VoiceTwo');
export const VoiceThreeSVG = createIconComponent('VoiceThree');

// 字幕图标
export const SubtitleMoreSVG = createIconComponent('SubtitleMore');
export const UserSVG = createIconComponent('User');
export const MaskCloseSVG = createIconComponent('MaskClose');

// 聊天图标
export const MessageSendSVG = createIconComponent('MessageSend');
