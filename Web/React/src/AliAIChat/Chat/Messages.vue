<script lang="ts">
  import {
    defineComponent,
    ref,
    onMounted,
    onUnmounted,
    inject,
    nextTick,
  } from 'vue';
  import { useChatStore } from './store';
  import { ChatEngineKey } from './provider';
  import MessageItem from './MessageItem.vue';
  import { ElMessage } from 'element-plus';

  const AutoScrollGap = 80;

  export default defineComponent({
    name: 'Messages',
    components: {
      MessageItem,
    },
    setup() {
      const chatStore = useChatStore();
      const chatEngine = inject(ChatEngineKey);

      const messagesRef = ref<HTMLDivElement | null>(null);
      const bottomRef = ref<HTMLDivElement | null>(null);
      // 是否自动滚动到最底部
      const autoScrollSwitch = ref(true);

      const scrollToBottom = () => {
        if (autoScrollSwitch.value && bottomRef.value) {
          bottomRef.value.scrollIntoView();
        }
      };

      const onScroll = (e: Event) => {
        if (!messagesRef.value) return;

        const { scrollTop, scrollHeight, clientHeight } = messagesRef.value;
        if (scrollTop + clientHeight >= scrollHeight - AutoScrollGap) {
          autoScrollSwitch.value = true;
        } else {
          autoScrollSwitch.value = false;
        }
      };

      const onLayoutUpdate = (forceScroll = false) => {
        if (forceScroll) {
          autoScrollSwitch.value = true;
        }
        nextTick(() => {
          scrollToBottom();
        });
      };

      // 监听消息列表变化，自动滚动到底部
      const unwatch = chatStore.$subscribe(() => {
        nextTick(() => {
          scrollToBottom();
        });
      });

      // 监听窗口大小变化
      const handleResize = () => onLayoutUpdate();

      onMounted(() => {
        window.addEventListener('resize', handleResize);
      });

      onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
        unwatch();
      });

      const onLoadHistoryMessage = async () => {
        if (!chatEngine.value) return;

        let endTime = Date.now();
        const list = chatStore.messageList;
        if (list.length > 0) {
          if (list[0].message.sendTime) {
            endTime = list[0].message.sendTime * 1000 - 1;
          }
        }

        const messageList = await chatEngine.value.queryMessageList({
          startTime: 0,
          endTime,
          pageNumber: 1,
          pageSize: 10,
          isDesc: true,
        });

        if (messageList?.length && chatEngine.value?.userInfo?.userId) {
          // 加载的历史消息列表是新的在前的，在这里进行了反向
          chatStore.historyMessages(
            messageList.reverse(),
            chatEngine.value.userInfo.userId,
          );
        }

        if (messageList?.length === 0) {
          ElMessage.info('没有更多了');
        }

        return messageList?.length || 0;
      };

      return {
        chatStore,
        messagesRef,
        bottomRef,
        onScroll,
        onLoadHistoryMessage,
        onLayoutUpdate,
      };
    },
  });
</script>

<template>
  <div class="chat-messages" ref="messagesRef" @scroll="onScroll">
    <el-scrollbar class="messages-scrollbar">
      <el-pull-refresh v-model="refreshing" @refresh="onLoadHistoryMessage">
        <ul>
          <message-item
            v-for="messageItem in chatStore.messageList"
            :key="`${messageItem.isSend ? 'send' : 'receive'}_${messageItem.message.requestId || 'current'}`"
            :message="messageItem"
            @layout-update="onLayoutUpdate"
          />
        </ul>
        <div ref="bottomRef"></div>
      </el-pull-refresh>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
  .chat-messages {
    flex: 1;
    min-height: 0;
    overflow: auto;

    ul {
      list-style: none;
      margin: 0;
      padding: 0 20px;
      box-sizing: border-box;
    }

    .messages-scrollbar {
      height: 100%;
    }
  }
</style>
