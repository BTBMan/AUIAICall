<script lang="ts">
  import { defineComponent, computed } from 'vue';
  import { AIChatMessageState } from 'aliyun-auikit-aicall';

  export default defineComponent({
    name: 'SendStatus',
    props: {
      message: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const messageStatus = computed(() => {
        return props.message.messageState;
      });

      const isTransfering = computed(() => {
        return messageStatus.value === AIChatMessageState.Transfering;
      });

      const isInterrupted = computed(() => {
        return messageStatus.value === AIChatMessageState.Interrupted;
      });

      return {
        messageStatus,
        isTransfering,
        isInterrupted,
        AIChatMessageState,
      };
    },
  });
</script>

<template>
  <div v-if="isTransfering || isInterrupted" class="_status">
    <div class="sending-status">
      <span v-if="isTransfering">发送中...</span>
      <span v-else-if="isInterrupted">已中断</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .sending-status {
    font-size: 12px;
    color: #624aff;
  }
</style>
