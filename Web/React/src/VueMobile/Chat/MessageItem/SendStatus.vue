<template>
  <div
    class="_status"
    v-if="
      message.messageState === messageStates.Transfering ||
      message.messageState === messageStates.Failed
    "
  >
    <van-loading
      v-if="message.messageState === messageStates.Transfering"
      type="spinner"
      size="16px"
      color="#624AFF"
    />
    <van-button
      v-if="message.messageState === messageStates.Failed"
      @click="resend"
    >
      <ResendSVG />
    </van-button>
  </div>
</template>

<script lang="ts">
  import { defineComponent, PropType, inject } from 'vue';
  import {
    AIChatMessage,
    AIChatMessageState,
    AIChatAttachmentUploader,
  } from 'aliyun-auikit-aicall';
  import { ChatEngineContextKey } from '../ChatEngineContext.vue';
  import { ResendSVG } from '../Icons';

  export default defineComponent({
    name: 'MessageItemSendStatus',
    components: {
      ResendSVG,
    },
    props: {
      message: {
        type: Object as PropType<AIChatMessage>,
        required: true,
      },
    },
    setup(props) {
      const engine = inject(ChatEngineContextKey);
      const messageStates = AIChatMessageState;

      const resend = () => {
        let uploader: AIChatAttachmentUploader | undefined;
        if (props.message.attachmentList.length > 0) {
          uploader = new AIChatAttachmentUploader();
          uploader.attachmentList = props.message.attachmentList;
        }
        engine?.sendMessage(props.message, uploader);
      };

      return {
        messageStates,
        resend,
      };
    },
  });
</script>

<style>
  /* 样式在index.less文件中 */
</style>
