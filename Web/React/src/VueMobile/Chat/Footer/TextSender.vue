<template>
  <div>
    <div :class="['_send-textarea', focusing ? 'is-focusing' : '']">
      <van-field
        v-model="inputText"
        type="textarea"
        placeholder="请输入内容"
        rows="1"
        autosize
        ref="textAreaRef"
        :maxlength="2000"
        show-word-limit
        @focus="onFocus"
        @blur="onBlur"
        @change="onChange"
      />
      <van-button
        class="_action-btn is-send"
        :class="{ 'is-disabled': !canSend }"
        :disabled="!canSend"
        @click="sendMessage"
      >
        <SendSVG
          v-if="currentMessage?.message.messageState !== messageStates.Printing"
        />
        <InterruptSVG v-else />
      </van-button>
    </div>
    <van-button class="_to-voice-btn" @click="toVoice">
      <MicSVG />
    </van-button>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    computed,
    inject,
    watch,
    onMounted,
    onUnmounted,
  } from 'vue';
  import { Toast } from 'vant';
  import {
    AIChatMessage,
    AIChatMessageState,
    AIChatAttachmentUploader,
  } from 'aliyun-auikit-aicall';
  import { ChatEngineContextKey } from '../ChatEngineContext.vue';
  import { useChatModel } from '../store';
  import { SendSVG, InterruptSVG, MicSVG } from '../Icons';

  const TEXT_CACHE_KEY = 'aicall-chat-input-cache';

  export default defineComponent({
    name: 'TextSender',
    components: {
      SendSVG,
      InterruptSVG,
      MicSVG,
    },
    props: {
      uploader: {
        type: Object as () => AIChatAttachmentUploader | undefined,
        default: undefined,
      },
      onTypeChange: {
        type: Function as () => (type: 'text' | 'voice') => void,
        required: true,
      },
      afterSend: {
        type: Function as () => (success: boolean) => void,
        default: undefined,
      },
    },
    setup(props) {
      const engine = inject(ChatEngineContextKey);
      const textAreaRef = ref<HTMLTextAreaElement | null>(null);
      const textHeight = ref(0);
      const focusing = ref(false);
      const inputText = ref('');
      const messageStates = AIChatMessageState;

      const {
        currentMessage,
        attachmentList,
        attachmentCanSend,
        sendMessage: storeSendMessage,
        updateSendMessage,
        interruptAgent,
        updateMessageList,
      } = useChatModel();

      const canSend = computed(() => {
        return (
          attachmentCanSend.value &&
          (attachmentList.value.length > 0 || inputText.value.trim().length > 0)
        );
      });

      onMounted(() => {
        const text = localStorage?.getItem(TEXT_CACHE_KEY);
        if (text) {
          inputText.value = text;
        }

        if (textAreaRef.value) {
          textHeight.value = textAreaRef.value.clientHeight;
        }
      });

      const sendMessage = async () => {
        if (!canSend.value) {
          if (!attachmentCanSend.value) {
            Toast({
              message: '部分图片上传中或上传失败',
              position: 'bottom',
            });
          }
          return;
        }

        // 需要有附件或文本时才发送
        if (
          !props.uploader?.attachmentList?.length &&
          !inputText.value.trim()
        ) {
          return;
        }

        localStorage?.removeItem(TEXT_CACHE_KEY);
        const message = AIChatMessage.fromSendText(
          inputText.value.trim(),
          props.uploader?.attachmentList,
        );
        message.messageState = AIChatMessageState.Transfering;
        storeSendMessage(message);

        try {
          const sentMessage = await engine?.sendMessage(
            message,
            props.uploader,
          );
          props.afterSend?.(true);
          inputText.value = '';
          focusing.value = false;
          if (sentMessage) {
            updateSendMessage(sentMessage);
          }
        } catch (error) {
          props.afterSend?.(false);
          message.messageState = AIChatMessageState.Failed;
          updateSendMessage(message);
          console.error(error);
        }
      };

      const interruptMessage = async () => {
        try {
          await engine?.interruptAgentResponse();
          interruptAgent();
        } catch (error) {
          console.error(error);
        }
      };

      const toVoice = () => {
        if (inputText.value) {
          localStorage?.setItem(TEXT_CACHE_KEY, inputText.value);
        }
        props.onTypeChange('voice');
      };

      const onChange = () => {
        if (textAreaRef.value) {
          // 仅高度增大时需要更新列表，触发滚动到最下面
          if (textAreaRef.value.clientHeight > textHeight.value) {
            updateMessageList();
            textHeight.value = textAreaRef.value.clientHeight;
          }
        }
      };

      const onFocus = () => {
        focusing.value = true;
        // iOS设备处理键盘弹出
        setTimeout(() => {
          textAreaRef.value?.scrollIntoView?.();
        }, 100);
      };

      const onBlur = () => {
        setTimeout(() => {
          focusing.value = false;
        }, 200);
      };

      // 监听当前消息状态，如果是打印中则显示中断按钮
      const actionBtnClick = computed(() => {
        return currentMessage.value?.message.messageState ===
          AIChatMessageState.Printing
          ? interruptMessage
          : sendMessage;
      });

      return {
        inputText,
        textAreaRef,
        focusing,
        canSend,
        messageStates,
        currentMessage,
        sendMessage,
        interruptMessage,
        toVoice,
        onChange,
        onFocus,
        onBlur,
        actionBtnClick,
      };
    },
  });
</script>

<style scoped>
  ._send-textarea {
    display: flex;
    width: 100%;
    padding: 8px;
    background-color: #fff;
    border-top: 1px solid #eee;
    align-items: flex-end;
  }

  ._action-btn {
    margin-left: 8px;
    width: 36px;
    height: 36px;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  ._action-btn.is-disabled {
    opacity: 0.5;
  }

  ._to-voice-btn {
    position: absolute;
    right: 16px;
    bottom: 16px;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
  }
</style>
