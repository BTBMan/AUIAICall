import { defineStore } from 'pinia';
import {
  AICallAgentState,
  AICallAgentType,
  AICallState,
  AICallSubtitleData,
} from 'aliyun-auikit-aicall';

type SubtitleItem = {
  data: AICallSubtitleData;
  source: 'agent' | 'user';
};

interface CallState {
  agentType: AICallAgentType | undefined;

  // 通话状态
  callState: AICallState;
  // 通话错误
  callErrorMessage?: string;

  // Agent 状态
  agentState: AICallAgentState;

  // 是否正在说话
  isSpeaking: boolean;

  // 字幕
  currentSubtitle?: SubtitleItem;
  currentAgentSubtitle?: SubtitleItem;
  subtitleList: SubtitleItem[];

  enablePushToTalk: boolean;
  updatingPushToTalk: boolean;
  pushingToTalk: boolean;

  enableVoiceInterrupt: boolean;
  updatingVoiceInterrupt: boolean;

  voiceId: string;
  updatingVoiceId: boolean;

  microphoneMuted: boolean;
  cameraMuted: boolean;
}

const initialCallState: CallState = {
  callState: AICallState.None,
  agentType: undefined,
  agentState: AICallAgentState.Listening,
  isSpeaking: false,
  currentSubtitle: undefined,
  currentAgentSubtitle: undefined,
  subtitleList: [],
  enablePushToTalk: false,
  updatingPushToTalk: false,
  pushingToTalk: false,
  enableVoiceInterrupt: true,
  updatingVoiceInterrupt: false,
  voiceId: '',
  updatingVoiceId: false,
  microphoneMuted: false,
  cameraMuted: false,
};

export const defaultCallBehavior = {
  muteOnStart: false,
  transcriptAutoScroll: true,
  showRTT: true,
  videoCallOnConnected: true,
  enableShowInfo: false,
};

export const useCallStore = defineStore('call', {
  state: (): CallState => ({ ...initialCallState }),
  actions: {
    setCurrentSubtitle(subtitle: SubtitleItem) {
      let newSubtitle = subtitle;

      const currentAgentSubtitle = this.currentAgentSubtitle;

      // agent 的字幕连续出现，sentenceId 相同进行拼接
      if (
        subtitle.source === 'agent' &&
        subtitle.data.sentenceId === currentAgentSubtitle?.data?.sentenceId
      ) {
        if (currentAgentSubtitle) {
          currentAgentSubtitle.data.text =
            currentAgentSubtitle.data.text + subtitle.data.text;
          currentAgentSubtitle.data.end = subtitle.data.end;
          this.currentAgentSubtitle = currentAgentSubtitle;
          newSubtitle = currentAgentSubtitle;
        }
      } else {
        // agent 字幕
        if (subtitle.source === 'agent') {
          // 如果 currentAgentSubtitle 存在，并且非 end 则添加到 subtitleList，视为已经 end
          if (
            currentAgentSubtitle?.data.text &&
            !currentAgentSubtitle.data.end
          ) {
            this.subtitleList.push(currentAgentSubtitle);
          }
          this.currentAgentSubtitle = subtitle;
        }
        newSubtitle = subtitle;
      }

      this.currentSubtitle = { ...newSubtitle };

      // 如果 end 则添加到 subtitleList
      if (newSubtitle.data.text) {
        const existSubtitleIndex = this.subtitleList.findIndex(
          (sub) =>
            sub.source === newSubtitle.source &&
            sub.data.sentenceId === newSubtitle.data.sentenceId,
        );

        // 如果已经存在更新，否则 Append
        if (existSubtitleIndex !== -1) {
          this.subtitleList[existSubtitleIndex].data.text =
            newSubtitle.data.text;
        } else {
          this.subtitleList.push(newSubtitle);
        }
      }
    },
    reset(reserveAgentType = false) {
      const currentAgentType = this.agentType;

      // 重置所有状态
      Object.assign(this, initialCallState);

      // 保留代理类型如果需要
      if (reserveAgentType) {
        this.agentType = currentAgentType;
      }
    },
    setState(partialState: Partial<CallState>) {
      Object.assign(this, partialState);
    },
  },
});

// 为了兼容React版本的调用方式
export default useCallStore;
