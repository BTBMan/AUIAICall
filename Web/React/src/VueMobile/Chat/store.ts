import { ref, reactive } from 'vue';

export interface Message {
  id: string;
  type: 'text' | 'image' | 'audio' | 'file' | 'video' | 'ai' | 'user';
  content: string;
  timestamp: number;
  [key: string]: any;
}

export function useChatModel() {
  const messages = ref<Message[]>([]);
  const aiState = ref<string | null>(null);

  // 初始化数据
  const initData = () => {
    // 可以在这里添加一些初始消息
    const welcomeMessage: Message = {
      id: 'welcome',
      type: 'ai',
      content: '您好，我是AI助手，请问有什么可以帮您？',
      timestamp: Date.now(),
    };
    messages.value = [welcomeMessage];
  };

  // 重置数据
  const resetData = () => {
    messages.value = [];
    aiState.value = null;
  };

  // 添加消息
  const addMessage = (message: Message) => {
    messages.value.push({
      ...message,
      timestamp: Date.now(),
    });
  };

  // 添加用户消息
  const addUserMessage = (content: string) => {
    const message: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(message);
    return message;
  };

  // 添加AI消息
  const addAIMessage = (content: string) => {
    const message: Message = {
      id: `ai-${Date.now()}`,
      type: 'ai',
      content,
      timestamp: Date.now(),
    };
    messages.value.push(message);
    return message;
  };

  // 设置AI状态
  const setAiState = (state: string) => {
    aiState.value = state;
  };

  // 清除AI状态
  const clearAiState = () => {
    aiState.value = null;
  };

  // 更新消息
  const updateMessage = (id: string, updates: Partial<Message>) => {
    const index = messages.value.findIndex((msg) => msg.id === id);
    if (index !== -1) {
      messages.value[index] = {
        ...messages.value[index],
        ...updates,
      };
    }
  };

  // 删除消息
  const deleteMessage = (id: string) => {
    const index = messages.value.findIndex((msg) => msg.id === id);
    if (index !== -1) {
      messages.value.splice(index, 1);
    }
  };

  return {
    messages,
    aiState,
    initData,
    resetData,
    addMessage,
    addUserMessage,
    addAIMessage,
    setAiState,
    clearAiState,
    updateMessage,
    deleteMessage,
  };
}
