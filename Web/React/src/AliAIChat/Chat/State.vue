<script lang="ts">
  import { defineComponent, computed } from 'vue';
  import { AIChatEngineState } from 'aliyun-auikit-aicall';
  import { useChatStore } from './store';

  export default defineComponent({
    name: 'State',
    emits: ['exit'],
    setup(_, { emit }) {
      const chatStore = useChatStore();

      const isConnected = computed(() => {
        return chatStore.chatState === AIChatEngineState.Connected;
      });

      const isDisconnected = computed(() => {
        return chatStore.chatState === AIChatEngineState.Disconnect;
      });

      const isLoading = computed(() => {
        return (
          chatStore.chatState === AIChatEngineState.Connecting ||
          chatStore.chatState === AIChatEngineState.Init
        );
      });

      const handleExit = () => {
        emit('exit');
      };

      return {
        chatStore,
        isConnected,
        isDisconnected,
        isLoading,
        handleExit,
        AIChatEngineState,
      };
    },
  });
</script>

<template>
  <div v-if="!isConnected">
    <el-dialog
      v-model="!isConnected"
      width="300px"
      :show-close="false"
      :class="{ 'loading-dialog': isLoading }"
      center
    >
      <div v-if="isLoading" class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">接通中</div>
      </div>
      <div v-else-if="isDisconnected" class="disconnect-content">
        连接已断开
      </div>

      <template #footer>
        <span class="dialog-footer" v-if="isDisconnected">
          <el-button @click="handleExit">退出</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
  .loading-dialog {
    :deep(.el-dialog__body) {
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .loading-content {
    text-align: center;

    .loading-spinner {
      display: inline-block;
      width: 48px;
      height: 48px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #624aff;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 16px;
    }

    .loading-text {
      font-size: 14px;
      color: #333;
    }
  }

  .disconnect-content {
    text-align: center;
    font-size: 14px;
    color: #333;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
