<script lang="ts">
  import {
    defineComponent,
    ref,
    inject,
    onMounted,
    onUnmounted,
    watch,
    computed,
  } from 'vue';
  import { ChatEngineKey } from '../provider';
  import { useChatStore } from '../store';
  import { micSVG, sendSVG, interruptSVG } from '../Icons';
  import {
    AIChatMessage,
    AIChatMessageState,
    AIChatAttachmentUploader,
  } from 'aliyun-auikit-aicall';
  import { ElMessage } from 'element-plus';
  import { UploaderRef, AfterSendCallback } from './types';

  const TEXT_CACHE_KEY = 'aicall-chat-input-cache';

  export default defineComponent({
    name: 'TextSender',
    props: {
      uploaderRef: {
        type: Object as () => UploaderRef,
        required: true,
      },
      afterSend: {
        type: Function as () => AfterSendCallback,
        default: () => (success: boolean) => {},
      },
    },
    emits: ['type-change'],
    setup(props, { emit }) {
      const chatStore = useChatStore();
      const chatEngine = inject(ChatEngineKey);

      const textAreaRef = ref<HTMLTextAreaElement | null>(null);
      const textHeightRef = ref(0);
      const focusing = ref(false);
      const hasText = ref(false);

      // 从store获取当前消息和附件信息
      const currentMessage = computed(() => chatStore.currentMessage);
      const attachmentList = computed(() => chatStore.attachmentList);
      const attachmentCanSend = computed(() => chatStore.attachmentCanSend);

      // 是否可以发送消息
      const canSend = computed(() => {
        return (
          attachmentCanSend.value &&
          (attachmentList.value.length > 0 || hasText.value)
        );
      });

      // 正在输入
      const isAgentResponding = computed(() => {
        return (
          currentMessage.value?.message.messageState ===
          AIChatMessageState.Printing
        );
      });

      // 初始化加载缓存的文本
      onMounted(() => {
        const text = localStorage.getItem(TEXT_CACHE_KEY);
        if (text && textAreaRef.value) {
          textAreaRef.value.value = text;
          hasText.value = !!text.trim();
        }
        if (textAreaRef.value) {
          textHeightRef.value = textAreaRef.value.clientHeight;
        }

        // 监听聚焦和失焦事件
        textAreaRef.value?.addEventListener('focus', onTextFocus);
        textAreaRef.value?.addEventListener('blur', onTextBlur);
      });

      onUnmounted(() => {
        textAreaRef.value?.removeEventListener('focus', onTextFocus);
        textAreaRef.value?.removeEventListener('blur', onTextBlur);
      });

      // 监听聚焦状态变化
      watch(focusing, (newVal) => {
        if (newVal) {
          setTimeout(() => {
            textAreaRef.value?.scrollIntoView();
          }, 100);
        }
      });

      // 发送消息
      const sendMessage = async () => {
        if (!chatEngine.value) return;

        if (!canSend.value) {
          if (!attachmentCanSend.value) {
            ElMessage.warning('部分图片上传中或上传失败');
          }
          return;
        }

        const text = textAreaRef.value?.value || '';

        // 需要有附件或文本时才发送
        if (!props.uploaderRef.value?.attachmentList?.length && !text.trim()) {
          return;
        }

        localStorage.removeItem(TEXT_CACHE_KEY);
        const message = AIChatMessage.fromSendText(
          text.trim(),
          props.uploaderRef.value?.attachmentList,
        );
        message.messageState = AIChatMessageState.Transfering;
        chatStore.sendMessage(message);

        try {
          const sendedMessage = await chatEngine.value.sendMessage(
            message,
            props.uploaderRef.value || undefined,
          );
          props.afterSend(true);
          if (textAreaRef.value) textAreaRef.value.value = '';
          hasText.value = false;
          focusing.value = false;

          if (sendedMessage) {
            chatStore.updateSendMessage(sendedMessage);
          }
        } catch (error) {
          props.afterSend(false);
          message.messageState = AIChatMessageState.Failed;
          chatStore.updateSendMessage(message);
          chatStore.setState({ attachmentList: [] });
          console.error(error);
        }
      };

      // 中断AI响应
      const interruptMessage = async () => {
        if (!chatEngine.value) return;

        try {
          await chatEngine.value.interruptAgentResponse();
          chatStore.interruptAgent();
        } catch (error) {
          console.error(error);
        }
      };

      // 切换到语音模式
      const toVoice = () => {
        const text = textAreaRef.value?.value || '';
        if (text) {
          localStorage.setItem(TEXT_CACHE_KEY, text);
        }
        emit('type-change', 'voice');
      };

      // 文本变化处理
      const onTextChange = (e: Event) => {
        const textarea = e.target as HTMLTextAreaElement;
        const value = textarea.value;

        // 仅高度增大时需要更新列表，触发滚动到最下面
        if (textarea.clientHeight > textHeightRef.value) {
          chatStore.updateMessageList();
          textHeightRef.value = textarea.clientHeight;
        }

        hasText.value = !!value.trim();

        // 保存到localStorage
        if (value) {
          localStorage.setItem(TEXT_CACHE_KEY, value);
        } else {
          localStorage.removeItem(TEXT_CACHE_KEY);
        }
      };

      // 聚焦处理
      const onTextFocus = () => {
        focusing.value = true;
      };

      // 失焦处理
      const onTextBlur = () => {
        setTimeout(() => {
          focusing.value = false;
        }, 200);
      };

      return {
        textAreaRef,
        focusing,
        hasText,
        attachmentCanSend,
        currentMessage,
        canSend,
        isAgentResponding,
        sendMessage,
        interruptMessage,
        toVoice,
        onTextChange,
        sendSVG,
        interruptSVG,
        micSVG,
        AIChatMessageState,
      };
    },
  });
</script>

<template>
  <div :class="['_send-textarea', focusing ? 'is-focusing' : '']">
    <textarea
      ref="textAreaRef"
      class="text-area"
      placeholder="请输入内容"
      rows="1"
      @input="onTextChange"
    ></textarea>

    <el-button
      v-if="isAgentResponding"
      class="_action-btn"
      @click="interruptMessage"
      v-html="interruptSVG"
    />
    <el-button
      v-else
      :class="['_action-btn', 'is-send', !canSend ? 'is-disabled' : '']"
      :disabled="!canSend"
      @click="sendMessage"
      v-html="sendSVG"
    />
  </div>

  <el-button class="_to-voice-btn" @click="toVoice" v-html="micSVG" />
</template>

<style lang="scss" scoped>
  ._send-textarea {
    flex: 1;
    position: relative;

    &.is-focusing {
      .text-area {
        border-color: #624aff;
      }
    }

    .text-area {
      width: 100%;
      background: radial-gradient(
        58% 126% at 50% 90%,
        rgba(255, 255, 255, 0.6) 0%,
        #ffffff 100%
      );
      border: 1px solid #ffffff;
      box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.05);
      border-radius: 20px;
      line-height: 20px;
      min-height: 20px;
      padding: 9px 12px;
      width: calc(100% - 40px);
      margin-right: 40px;
      font-size: 14px;
      color: #26244c;
      resize: none;
      outline: none;
      box-sizing: border-box;

      &:focus {
        border-color: #624aff;
      }
    }
  }

  ._action-btn {
    right: 8px;
    bottom: 6px;
    position: absolute;
    z-index: 9;
    width: 28px;
    height: 28px;
    line-height: 28px;
    border: none;
    padding: 0;
    border-radius: 14px;
    color: inherit;

    &.is-send {
      padding: 5px;
      line-height: 18px;
      background-color: #624aff;
      border-radius: 14px;
      color: white;

      &.is-disabled {
        background-color: #aaa;
      }
    }

    &:active {
      opacity: 0.8;
    }
  }

  ._to-voice-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    border: none;
    background-color: transparent;
    color: inherit;
    margin: 0 -6px 0 6px;
  }
</style>
