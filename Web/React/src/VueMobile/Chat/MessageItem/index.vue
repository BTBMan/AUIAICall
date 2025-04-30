<template>
  <div
    class="message-item"
    :class="{
      'user-message': message.type === 'user',
      'ai-message': message.type === 'ai',
    }"
  >
    <div class="message-avatar">
      <div v-if="message.type === 'ai'" class="ai-avatar">AI</div>
      <div v-else class="user-avatar">用户</div>
    </div>
    <div class="message-content">
      <div class="message-text">
        <template
          v-if="
            message.type === 'text' ||
            message.type === 'ai' ||
            message.type === 'user'
          "
        >
          <MarkdownRender
            v-if="isMarkdown(message.content)"
            :text="message.content"
          />
          <TextLineRender v-else :text="message.content" />
        </template>
        <template v-else-if="message.type === 'image'">
          <img :src="message.content" class="image-content" />
        </template>
      </div>
      <Reasoning v-if="message.reasoningText" :message="message" />
      <SendAttachment :message="message" />
      <SendStatus :message="message" />
      <div class="message-time">{{ formatTime(message.timestamp) }}</div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, PropType } from 'vue';
  import { Message } from '../store';
  import MarkdownRender from './MarkdownRender.vue';
  import TextLineRender from './TextLineRender.vue';
  import Reasoning from './Reasoning.vue';
  import SendAttachment from './SendAttachment.vue';
  import SendStatus from './SendStatus.vue';

  export default defineComponent({
    name: 'MessageItem',
    components: {
      MarkdownRender,
      TextLineRender,
      Reasoning,
      SendAttachment,
      SendStatus,
    },
    props: {
      message: {
        type: Object as PropType<Message>,
        required: true,
      },
    },
    setup() {
      const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
      };

      const isMarkdown = (text: string) => {
        if (!text) return false;

        // 简单检查是否包含Markdown语法
        const markdownPatterns = [
          /^#+ /m, // 标题
          /\*\*.*\*\*/, // 粗体
          /\*.*\*/, // 斜体
          /```[\s\S]*?```/, // 代码块
          /^\- /m, // 无序列表
          /^\d+\. /m, // 有序列表
          /\[.*\]\(.*\)/, // 链接
          /!\[.*\]\(.*\)/, // 图片
          /\|.*\|.*\|/, // 表格
          /^\> /m, // 引用
        ];

        return markdownPatterns.some((pattern) => pattern.test(text));
      };

      return {
        formatTime,
        isMarkdown,
      };
    },
  });
</script>

<style>
  @import '../../../Mobile/Chat/MessageItem/index.less';

  .message-item {
    display: flex;
    margin-bottom: 16px;
    position: relative;
  }

  .user-message {
    flex-direction: row-reverse;
  }

  .ai-message {
    flex-direction: row;
  }

  .message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .ai-avatar,
  .user-avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
  }

  .ai-avatar {
    background-color: #11a37f;
  }

  .user-avatar {
    background-color: #2979ff;
  }

  .message-content {
    max-width: 70%;
    margin: 0 10px;
  }

  .user-message .message-content {
    margin-right: 10px;
  }

  .ai-message .message-content {
    margin-left: 10px;
  }

  .message-text {
    padding: 10px 16px;
    border-radius: 18px;
    font-size: 16px;
    line-height: 1.5;
    word-break: break-word;
  }

  .user-message .message-text {
    background-color: #2979ff;
    color: white;
    border-bottom-right-radius: 4px;
  }

  .ai-message .message-text {
    background-color: #f5f5f5;
    border-bottom-left-radius: 4px;
  }

  .message-time {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
    text-align: right;
  }

  .user-message .message-time {
    text-align: right;
  }

  .ai-message .message-time {
    text-align: left;
  }

  .image-content {
    max-width: 100%;
    max-height: 200px;
    border-radius: 8px;
  }
</style>
