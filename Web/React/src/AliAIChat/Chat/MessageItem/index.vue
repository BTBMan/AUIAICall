<script lang="ts">
  import {
    defineComponent,
    ref,
    onMounted,
    onUnmounted,
    inject,
    computed,
    watch,
  } from 'vue';
  import {
    AICallErrorCode,
    AIChatError,
    AIChatMessageState,
  } from 'aliyun-auikit-aicall';
  import { useChatStore, ChatMessageItem } from '../store';
  import { ChatEngineKey } from '../provider';
  import { copySVG, volumeSVG, deleteSVG } from '../Icons';
  import { ElMessage, ElDialog, ElPopover, ElButton } from 'element-plus';
  import SendStatus from './SendStatus.vue';
  import TextLineRender from './TextLineRender.vue';
  import Reasoning from './Reasoning.vue';
  import MarkdownRender from './MarkdownRender.vue';
  import SendAttachment from './SendAttachment.vue';

  interface Props {
    message: ChatMessageItem;
    onLayoutUpdate: (forceScroll?: boolean) => void;
  }

  export default defineComponent({
    name: 'MessageItem',
    components: {
      SendStatus,
      TextLineRender,
      Reasoning,
      MarkdownRender,
      SendAttachment,
    },
    props: {
      message: {
        type: Object as () => ChatMessageItem,
        required: true,
      },
      onLayoutUpdate: {
        type: Function as () => (forceScroll?: boolean) => void,
        required: true,
      },
    },
    emits: ['layout-update'],
    setup(props, { emit }) {
      const chatStore = useChatStore();
      const chatEngine = inject(ChatEngineKey);

      const showDelete = ref(false);
      const copying = ref(false);
      const deleteRef = ref<HTMLDivElement | null>(null);
      const dialogVisible = ref(false);

      // 从store获取当前播放的消息ID和音色
      const voiceId = computed(() => chatStore.voiceId);
      const playingMessageId = computed(() => chatStore.playingMessageId);
      const currentMessage = computed(() => chatStore.currentMessage);

      // 判断是否是当前处理中的消息
      const isProcessingMessage = computed(() => {
        if (!props.message.isProcessing) return false;

        return (
          !!props.message.isSend === !!currentMessage.value?.isSend &&
          props.message.message.requestId ===
            currentMessage.value?.message.requestId
        );
      });

      // 如果是当前处理中的消息，使用currentMessage
      const messageToRender = computed(() => {
        if (isProcessingMessage.value && currentMessage.value) {
          return currentMessage.value;
        }
        return props.message;
      });

      // 监听发送消息变化，强制滚动
      watch(
        () => currentMessage.value?.isSend,
        (isSend) => {
          if (isSend && isProcessingMessage.value) {
            emit('layout-update', true);
          }
        },
      );

      // 监听消息内容变化，更新布局
      watch(
        () => [
          currentMessage.value?.message.text,
          currentMessage.value?.message.reasoningText,
          currentMessage.value?.message.messageState,
        ],
        () => {
          if (isProcessingMessage.value) {
            emit('layout-update');
          }
        },
        { deep: true },
      );

      // 点击控制消息朗读
      const togglePlay = async () => {
        if (!messageToRender.value.message.text || !chatEngine.value) {
          return;
        }

        if (
          playingMessageId.value === messageToRender.value.message.dialogueId
        ) {
          await chatEngine.value.stopPlayMessage();
          chatStore.setState({
            playingMessageId: undefined,
          });
          return;
        }

        try {
          await chatEngine.value.startPlayMessage(
            messageToRender.value.message,
            voiceId.value ? voiceId.value : undefined,
          );
        } catch (err) {
          ElMessage.error(`播放失败: ${(err as AIChatError).code}`);
        }
      };

      // 复制消息文本
      const onCopy = async () => {
        try {
          if (!messageToRender.value.message.text) return;
          copying.value = true;

          await navigator.clipboard.writeText(
            messageToRender.value.message.text,
          );
          ElMessage.success('信息已复制');

          setTimeout(() => {
            copying.value = false;
          }, 2000);
        } catch (error) {
          copying.value = false;
          console.warn(error);
          ElMessage.error('信息复制失败');
        }
      };

      // 长按消息弹出删除选项
      const onLongPress = () => {
        if (
          messageToRender.value.message.messageState !==
            AIChatMessageState.Finished &&
          messageToRender.value.message.messageState !==
            AIChatMessageState.Interrupted
        ) {
          return;
        }
        showDelete.value = true;
      };

      // 确认删除消息
      const onDelete = async () => {
        dialogVisible.value = true;
      };

      // 执行删除操作
      const confirmDelete = async () => {
        try {
          if (!chatEngine.value) return;

          await chatEngine.value.deleteMessage(
            messageToRender.value.message.dialogueId,
          );
        } catch (error) {
          if ((error as AIChatError).code !== AICallErrorCode.ChatLogNotFound) {
            ElMessage.error(`删除失败: ${(error as AIChatError).code}`);
            throw error;
          }
        }

        chatStore.deleteMessage(messageToRender.value.message);
        dialogVisible.value = false;
      };

      // 长按事件处理
      let longPressTimer: number | null = null;
      let isLongPress = false;

      const onTouchStart = (e: TouchEvent) => {
        isLongPress = false;
        longPressTimer = window.setTimeout(() => {
          isLongPress = true;
          onLongPress();
        }, 500);
      };

      const onTouchEnd = () => {
        if (longPressTimer) {
          clearTimeout(longPressTimer);
          longPressTimer = null;
        }
      };

      // 处理点击事件冒泡
      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (deleteRef.value && !deleteRef.value.contains(e.target as Node)) {
          showDelete.value = false;
        }
      };

      onMounted(() => {
        document.addEventListener('click', handleClickOutside);
        document.addEventListener('touchend', handleClickOutside);
      });

      onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('touchend', handleClickOutside);

        if (longPressTimer) {
          clearTimeout(longPressTimer);
        }
      });

      return {
        messageToRender,
        showDelete,
        copying,
        deleteRef,
        dialogVisible,
        voiceId,
        playingMessageId,
        isProcessingMessage,
        togglePlay,
        onCopy,
        onDelete,
        confirmDelete,
        onTouchStart,
        onTouchEnd,
        copySVG,
        volumeSVG,
        deleteSVG,
        AIChatMessageState,
      };
    },
  });
</script>

<template>
  <li :class="['chat-item', messageToRender.isSend ? 'is-self' : 'is-agent']">
    <el-popover
      v-model:visible="showDelete"
      placement="top"
      trigger="manual"
      :width="80"
      popper-class="dark-popover"
    >
      <template #reference>
        <div class="_bd" @touchstart="onTouchStart" @touchend="onTouchEnd">
          <send-attachment
            v-if="messageToRender.isSend"
            :message="messageToRender.message"
          />

          <div
            class="_box"
            v-if="
              messageToRender.message.text ||
              messageToRender.message.reasoningText ||
              (!messageToRender.isSend &&
                messageToRender.message.messageState ===
                  AIChatMessageState.Transfering)
            "
          >
            <text-line-render
              v-if="messageToRender.isSend"
              :text="messageToRender.message.text"
            />

            <template v-else>
              <reasoning :message="messageToRender.message" />
              <markdown-render :text="messageToRender.message.text" />

              <div
                class="loading-dots"
                v-if="
                  messageToRender.message.messageState ===
                  AIChatMessageState.Transfering
                "
              >
                <span></span>
                <span></span>
                <span></span>
              </div>

              <div
                class="_interrupted"
                v-if="
                  messageToRender.message.messageState ===
                  AIChatMessageState.Interrupted
                "
              >
                用户停止本次回答
              </div>
            </template>

            <div
              class="_actions"
              v-if="
                messageToRender.message.messageState ===
                  AIChatMessageState.Finished ||
                messageToRender.message.messageState ===
                  AIChatMessageState.Interrupted
              "
            >
              <el-button
                :class="{ 'is-copying': copying }"
                @click="onCopy"
                v-html="copySVG"
              />
              <el-button
                :class="{
                  'is-playing':
                    playingMessageId === messageToRender.message.dialogueId,
                }"
                @click="togglePlay"
                v-html="volumeSVG"
              />
            </div>
          </div>

          <send-status
            v-if="messageToRender.isSend"
            :message="messageToRender.message"
          />
        </div>
      </template>

      <div class="chat-item-delete" ref="deleteRef">
        <el-button @click="onDelete">
          <span v-html="deleteSVG"></span>
          <div class="_text">删除</div>
        </el-button>
      </div>
    </el-popover>

    <el-dialog
      v-model="dialogVisible"
      title="确认删除此条信息？"
      width="80%"
      center
    >
      <span>信息删除后，不可恢复</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="danger" @click="confirmDelete">删除</el-button>
        </span>
      </template>
    </el-dialog>
  </li>
</template>

<style lang="scss" scoped>
  .chat-item {
    position: relative;
    margin: 12px 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    color: #716f8a;

    ._bd {
      position: relative;
      box-sizing: border-box;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    ._box {
      padding: 12px;
      border-radius: 14px 14px 12px 0px;
      font-size: 14px;
      line-height: 22px;
      background-color: #fff;
    }

    :deep(._send-attachment) + ._box {
      margin-top: 12px;
    }

    ._interrupted {
      font-size: 10px;
      line-height: 16px;
      color: #747a8c;
    }

    ._actions {
      margin-bottom: -8px;

      .is-playing {
        :deep(._volume-1) {
          animation: chat-playing-volume-animation-1 1s ease-in-out infinite;
        }

        :deep(._volume-2) {
          animation: chat-playing-volume-animation-2 1s ease-in-out infinite;
        }
      }
    }

    :deep(._status) {
      position: absolute;
      top: 50%;
      left: -24px;
      margin-top: -8px;
      color: #624aff;
    }

    :deep(.el-button) {
      color: inherit;
      border: none;
      background-color: transparent;
      padding: 4px;
      line-height: 16px;
      margin: 4px;
      height: auto;

      &:active {
        opacity: 0.8;
      }
    }

    :deep(._actions .el-button) {
      line-height: 20px;
    }

    ._action-tip {
      padding-top: 4px;
      font-size: 10px;
      line-height: 16px;
    }

    &.is-agent {
      ._actions {
        color: #747a8c;
        margin-left: -4px;

        :deep(.el-button.is-playing),
        :deep(.el-button.is-copying) {
          color: #56597e;
        }
      }

      &::after {
        content: ' ';
        flex: 1;
        min-width: 12px;
      }

      ._action-tip {
        padding-left: 4px;
      }
    }

    &.is-self {
      color: #fff;
      align-items: flex-end;

      ._box {
        background-color: #624aff;
        border-radius: 14px 14px 0px 12px;
      }

      ._actions {
        color: #d8d9e6;
        text-align: right;
        margin-right: -8px;

        :deep(.el-button.is-playing),
        :deep(.el-button.is-copying) {
          color: #fff;
        }
      }

      &::before {
        content: ' ';
        flex: 1;
        min-width: 12px;
      }

      ._action-tip {
        padding-right: 8px;
      }
    }
  }

  .chat-item-delete {
    :deep(.el-button) {
      width: 48px;
      height: 48px;
      color: #e6e7ec;
      border: none;
      background-color: transparent;
      padding: 4px;
      line-height: 16px;
      margin: 0;
    }

    ._text {
      margin-top: 4px;
      font-size: 12px;
      line-height: 18px;
    }
  }

  .loading-dots {
    display: inline-flex;
    align-items: center;

    span {
      display: inline-block;
      width: 4px;
      height: 4px;
      margin: 0 2px;
      background-color: currentColor;
      border-radius: 50%;
      animation: dot-flashing 1s infinite linear alternate;

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }

  @keyframes dot-flashing {
    0% {
      opacity: 0.2;
    }
    100% {
      opacity: 1;
    }
  }

  @keyframes chat-playing-volume-animation-1 {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes chat-playing-volume-animation-2 {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }
</style>
