import { Ref } from 'vue';
import { AIChatAttachmentUploader } from 'aliyun-auikit-aicall';

// 输入模式类型
export type InputMode = 'text' | 'voice';

// 输入模式变更回调
export type OnTypeChange = (type: InputMode) => void;

// 上传器引用类型
export type UploaderRef = Ref<AIChatAttachmentUploader | undefined>;

// 发送后的回调类型
export type AfterSendCallback = (success: boolean) => void;
