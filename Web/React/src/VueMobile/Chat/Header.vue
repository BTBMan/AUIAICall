<template>
  <div class="chat-header">
    <div class="safe-area-top"></div>
    <div class="header-content">
      <div class="left-action">
        <van-button class="back-btn" @click="onExit">
          <van-icon name="arrow-left" />
        </van-button>
      </div>
      <div class="title">{{ title }}</div>
      <div class="right-action"></div>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, inject, ref } from 'vue';
  import { ChatEngineContextKey } from './ChatEngineContext.vue';

  export default defineComponent({
    name: 'ChatHeader',
    emits: ['exit'],
    setup(props, { emit }) {
      const chatEngine = inject(ChatEngineContextKey);
      const title = ref('AI助手');

      const onExit = () => {
        emit('exit');
      };

      return {
        title,
        onExit,
      };
    },
  });
</script>

<style>
  @import '../../Mobile/Chat/header.less';

  .chat-header {
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  .safe-area-top {
    height: var(--van-safe-area-top, 44px);
  }

  .header-content {
    height: 44px;
    display: flex;
    align-items: center;
    padding: 0 16px;
  }

  .left-action,
  .right-action {
    width: 44px;
  }

  .title {
    flex: 1;
    text-align: center;
    font-size: 18px;
    font-weight: 500;
  }
</style>
