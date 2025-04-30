<template>
  <div
    class="_send-attachment"
    v-if="(message.attachmentList || []).length > 0"
  >
    <ul>
      <li v-for="item in message.attachmentList" :key="item.id">
        <img :src="item.path" :alt="item.name" />
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
  import { defineComponent, PropType } from 'vue';
  import { AIChatMessage } from 'aliyun-auikit-aicall';

  export default defineComponent({
    name: 'SendAttachment',
    props: {
      message: {
        type: Object as PropType<AIChatMessage>,
        required: true,
      },
    },
  });
</script>

<style>
  @import '../../../Mobile/Chat/MessageItem/sendAttachment.less';
</style>
