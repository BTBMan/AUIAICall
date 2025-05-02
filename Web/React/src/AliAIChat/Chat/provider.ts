import { InjectionKey } from 'vue';
import { AIChatEngine } from 'aliyun-auikit-aicall';

export const ChatEngineKey: InjectionKey<AIChatEngine> = Symbol('ChatEngine');
