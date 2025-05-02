<script lang="ts">
  import { defineComponent, computed } from 'vue';

  export default defineComponent({
    name: 'SendAttachment',
    props: {
      message: {
        type: Object,
        required: true,
      },
    },
    setup(props) {
      const hasAttachments = computed(() => {
        return props.message.attachmentList?.length > 0;
      });

      return {
        hasAttachments,
      };
    },
  });
</script>

<template>
  <div v-if="hasAttachments" class="_send-attachment">
    <div
      v-for="(attachment, index) in message.attachmentList"
      :key="index"
      class="attachment-item"
    >
      <!-- 简化实现，实际需要根据不同类型的附件展示不同的UI -->
      <div class="attachment-name">{{ attachment.name || '附件' }}</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  ._send-attachment {
    max-width: 240px;
    background-color: #f5f5f5;
    border-radius: 8px;
    padding: 8px;
    margin-bottom: 8px;

    .attachment-item {
      display: flex;
      align-items: center;
      padding: 4px;

      .attachment-name {
        font-size: 12px;
        color: #333;
        word-break: break-all;
      }
    }
  }
</style>
