<template>
  <div class="messages">
    <div class="messages-list" ref="messagesListRef">
      <MessageItem
        v-for="message in messages"
        :key="message.id"
        :message="message"
      />
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted, nextTick, watch } from 'vue';
  import { useChatModel } from './store';
  import MessageItem from './MessageItem/index.vue';

  export default defineComponent({
    name: 'Messages',
    components: {
      MessageItem,
    },
    setup() {
      const { messages } = useChatModel();
      const messagesListRef = ref<HTMLElement | null>(null);

      const scrollToBottom = () => {
        nextTick(() => {
          if (messagesListRef.value) {
            messagesListRef.value.scrollTop =
              messagesListRef.value.scrollHeight;
          }
        });
      };

      onMounted(() => {
        scrollToBottom();
      });

      watch(
        () => messages.value.length,
        () => {
          scrollToBottom();
        },
      );

      return {
        messages,
        messagesListRef,
      };
    },
  });
</script>

<style>
  @import '../../Mobile/Chat/messages.less';

  .messages {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .messages-list {
    height: 100%;
    overflow-y: auto;
    padding: 10px;
  }

  .message-item {
    display: flex;
    margin-bottom: 16px;
  }

  .message-ai {
    flex-direction: row;
  }

  .message-user {
    flex-direction: row-reverse;
  }

  .message-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
  }

  .message-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .user-avatar {
    width: 100%;
    height: 100%;
    background-color: #2979ff;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .message-content {
    margin: 0 10px;
    max-width: calc(100% - 100px);
  }

  .message-ai .message-content {
    margin-left: 10px;
    margin-right: 50px;
  }

  .message-user .message-content {
    margin-right: 10px;
    margin-left: 50px;
    text-align: right;
  }

  .message-text {
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 16px;
    line-height: 1.5;
    word-break: break-word;
  }

  .message-ai .message-text {
    background-color: #f5f5f5;
  }

  .message-user .message-text {
    background-color: #2979ff;
    color: white;
  }

  .message-time {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
</style>
