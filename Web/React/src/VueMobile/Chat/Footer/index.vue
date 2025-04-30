<template>
  <div class="chat-footer">
    <text-sender
      v-if="inputType === 'text'"
      :uploader="uploader"
      :on-type-change="handleTypeChange"
      :after-send="afterSend"
      :disabled="disabled"
    />
    <voice-sender
      v-else
      :uploader="uploader"
      :on-type-change="handleTypeChange"
      :after-send="afterSend"
      :disabled="disabled"
    />

    <!-- 附件选择面板 -->
    <van-popup
      v-model:show="showAttachmentPanel"
      position="bottom"
      :style="{ height: '30%' }"
      round
    >
      <div class="attachment-panel">
        <div class="attachment-panel-header">
          <div class="title">选择类型</div>
          <van-button class="close-btn" @click="showAttachmentPanel = false">
            <CloseSVG />
          </van-button>
        </div>
        <div class="attachment-panel-content">
          <div class="attachment-item" @click="selectImage">
            <div class="attachment-icon">
              <van-icon name="photo-o" size="24" />
            </div>
            <div class="attachment-label">图片</div>
          </div>
          <div class="attachment-item" @click="selectFile">
            <div class="attachment-icon">
              <van-icon name="description" size="24" />
            </div>
            <div class="attachment-label">文件</div>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, inject, onBeforeUnmount } from 'vue';
  import { Toast } from 'vant';
  import { AIChatAttachmentUploader } from 'aliyun-auikit-aicall';
  import { useChatModel } from '../store';
  import { ChatEngineContextKey } from '../ChatEngineContext.vue';
  import { CloseSVG } from '../Icons';
  import TextSender from './TextSender.vue';
  import VoiceSender from './VoiceSender.vue';

  export default defineComponent({
    name: 'ChatFooter',
    components: {
      CloseSVG,
      TextSender,
      VoiceSender,
    },
    props: {
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      const inputType = ref<'text' | 'voice'>('text');
      const showAttachmentPanel = ref(false);
      const uploader = ref<AIChatAttachmentUploader>(
        new AIChatAttachmentUploader(),
      );
      const chatEngine = inject(ChatEngineContextKey);

      const handleTypeChange = (type: 'text' | 'voice') => {
        inputType.value = type;
      };

      const afterSend = (success: boolean) => {
        if (success) {
          // 发送成功后清空附件
          if (uploader.value) {
            uploader.value.clear();
          }
        }
      };

      const onAttachmentClick = () => {
        showAttachmentPanel.value = true;
      };

      const selectImage = () => {
        Toast('图片功能暂未实现');
        showAttachmentPanel.value = false;
      };

      const selectFile = () => {
        Toast('文件功能暂未实现');
        showAttachmentPanel.value = false;
      };

      onBeforeUnmount(() => {
        if (uploader.value) {
          uploader.value.clear();
        }
      });

      return {
        inputType,
        uploader,
        showAttachmentPanel,
        handleTypeChange,
        afterSend,
        onAttachmentClick,
        selectImage,
        selectFile,
      };
    },
  });
</script>

<style>
  .chat-footer {
    padding: 0;
    border-top: 1px solid #eee;
    background-color: #fff;
    position: relative;
  }

  .attachment-panel {
    padding: 16px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .attachment-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }

  .attachment-panel-header .title {
    font-size: 18px;
    font-weight: 500;
  }

  .attachment-panel-content {
    display: flex;
    padding-top: 20px;
    flex-wrap: wrap;
  }

  .attachment-item {
    width: 80px;
    height: 90px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    margin-bottom: 16px;
    cursor: pointer;
  }

  .attachment-icon {
    width: 60px;
    height: 60px;
    border-radius: 12px;
    background-color: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }

  .attachment-label {
    font-size: 14px;
    color: #333;
  }
</style>
