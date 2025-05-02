import { defineStore } from 'pinia';
import {
  AIChatAttachment,
  AIChatEngineState,
  AIChatMessage,
} from 'aliyun-auikit-aicall';

const MAX_CACHE_LENGTH = 20;

export interface ChatMessageItem {
  message: AIChatMessage;
  isSend?: boolean;
  isProcessing?: boolean;
}

export const messageCachePrefix = 'chatcall-message-list-cache-';

const getInitialChatState = () => ({
  chatState: AIChatEngineState.Init,
  sessionId: undefined as string | undefined,
  messageList: [] as ChatMessageItem[],
  currentMessage: undefined as ChatMessageItem | undefined,
  voiceIdList: [] as string[],
  voiceId: '',
  playingMessageId: undefined as string | undefined,
  attachmentList: [] as AIChatAttachment[],
  attachmentCanSend: true,
});

/**
 * 刷新接收消息
 * @param message
 * @param messageList
 * @note 注意！此操作会原地修改 messageList 的最后一个消息，如果不符合预期返回 false
 */
const flushMessage = (
  messageList: ChatMessageItem[],
  messageItem?: ChatMessageItem,
): boolean => {
  if (messageList.length === 0) {
    return false;
  }

  const lastMessageItem = messageList[messageList.length - 1];
  const lastMessage = lastMessageItem?.message;
  if (!lastMessage) {
    return false;
  }

  if (
    !!lastMessageItem?.isSend === !!messageItem?.isSend &&
    lastMessage?.requestId === messageItem?.message.requestId
  ) {
    lastMessageItem.message = messageItem!.message;
    lastMessageItem.isProcessing = false;
    return true;
  }
  return false;
};

export const useChatStore = defineStore('chat', {
  state: () => getInitialChatState(),
  actions: {
    sendMessage(message: AIChatMessage) {
      // 当前为收消息阶段
      if (
        (this.currentMessage && !this.currentMessage.isSend) ||
        this.currentMessage?.message.requestId !== message.requestId
      ) {
        flushMessage(this.messageList, this.currentMessage);
      }
      const newSendMessage = { message, isSend: true, isProcessing: true };
      this.currentMessage = newSendMessage;
      this.messageList.push(newSendMessage);
    },

    updateSendMessage(message: AIChatMessage) {
      // 当前 Message 为发送且 requestId 一致
      if (
        this.currentMessage?.isSend &&
        this.currentMessage?.message.requestId === message.requestId
      ) {
        const newSendMessage = { message, isSend: true };
        if (message.isEnd) {
          flushMessage(this.messageList, newSendMessage);
        }
        this.currentMessage = newSendMessage;
      } else {
        const existMessageIndex = this.messageList.findIndex(
          (item) => item.message.requestId === message.requestId,
        );
        if (existMessageIndex > -1) {
          this.messageList.splice(existMessageIndex, 1, {
            message,
            isSend: true,
          });
        }
      }
    },

    receiveMessage(message: AIChatMessage) {
      const newReceiveMessage: ChatMessageItem = {
        message,
        isProcessing: true,
      };
      const currentMessage = this.currentMessage;

      // 添加 Message 到展示列表
      // 1. 没有消息
      // 2. 当前消息为发送
      // 3. 当前消息 requestId 不相同
      if (
        !currentMessage ||
        currentMessage?.isSend ||
        currentMessage?.message.requestId !== message.requestId
      ) {
        if (currentMessage?.isProcessing) {
          flushMessage(this.messageList, currentMessage);
        }
        this.messageList.push(newReceiveMessage);
      } else if (message.isEnd) {
        // 如果 message 结束，标记为已结束
        flushMessage(this.messageList, newReceiveMessage);
      }

      this.currentMessage = newReceiveMessage;
    },

    deleteMessage(message: AIChatMessage) {
      this.messageList = this.messageList.filter(
        (item) => item.message.dialogueId !== message.dialogueId,
      );
    },

    historyMessages(
      messages: AIChatMessage[],
      userId: string,
      isUpdateRecent = false,
    ) {
      // 可能已经下拉获取更多，直接跳过
      if (this.messageList.length > MAX_CACHE_LENGTH) {
        return;
      }

      const chatMessageList = messages.map((message) => ({
        message,
        isSend: message.senderId === userId,
        isProcessing: false,
      }));

      if (isUpdateRecent) {
        this.messageList = chatMessageList;
      } else {
        this.messageList = [...chatMessageList, ...this.messageList];
      }
    },

    interruptAgent() {
      if (this.currentMessage && !this.currentMessage.isSend) {
        flushMessage(this.messageList, this.currentMessage);
      }
      // 触发更新
      this.messageList = [...this.messageList];
    },

    updateMessageList() {
      // 触发更新
      this.messageList = [...this.messageList];
    },

    addAttachment(attachment: AIChatAttachment) {
      this.attachmentList.push(attachment);
    },

    removeAttachment(attachmentId: string) {
      this.attachmentList = this.attachmentList.filter(
        (item) => item.id !== attachmentId,
      );
    },

    reset() {
      const initialState = getInitialChatState();
      Object.assign(this, initialState);
    },

    setState(partialState: Partial<ReturnType<typeof getInitialChatState>>) {
      Object.assign(this, partialState);
    },
  },
});

// 监听消息列表变化，保存到localStorage
export function setupChatStoreSubscription() {
  const store = useChatStore();
  let previousMessageList: ChatMessageItem[] = [];

  return store.$subscribe((_, state) => {
    if (!state.sessionId) return;

    if (state.messageList !== previousMessageList) {
      previousMessageList = state.messageList;
      const lastCacheItems = state.messageList.slice(0 - MAX_CACHE_LENGTH);
      localStorage.setItem(
        `${messageCachePrefix}${state.sessionId}`,
        JSON.stringify(lastCacheItems),
      );
    }
  });
}

export default useChatStore;
