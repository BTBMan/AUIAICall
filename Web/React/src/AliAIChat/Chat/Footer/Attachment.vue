<script lang="ts">
  import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue';
  import { useChatStore } from '../store';
  import {
    AIChatAttachment,
    AIChatAttachmentState,
  } from 'aliyun-auikit-aicall';
  import { UploaderRef } from './types';

  export default defineComponent({
    name: 'Attachment',
    props: {
      attachment: {
        type: Object as () => AIChatAttachment,
        required: true,
      },
      uploaderRef: {
        type: Object as () => UploaderRef,
        required: true,
      },
    },
    setup(props) {
      const chatStore = useChatStore();
      const state = ref(props.attachment.state);
      const progress = ref(props.attachment.progress);

      // 获取附件预览URL
      const url = computed(() => {
        if (props.attachment.path) return props.attachment.path;
        if (props.attachment.url) return props.attachment.url;
        return '';
      });

      // 监听附件状态变化
      const updateState = (newState: AIChatAttachmentState) => {
        state.value = newState;
      };

      // 监听上传进度变化
      const updateProgress = (newProgress: number) => {
        progress.value = newProgress;
      };

      onMounted(() => {
        props.attachment.on('stateChange', updateState);
        props.attachment.on('progress', updateProgress);
      });

      onUnmounted(() => {
        props.attachment.off('stateChange', updateState);
        props.attachment.off('progress', updateProgress);
      });

      // 取消上传/删除附件
      const cancelUpload = () => {
        if (!props.uploaderRef.value) return;

        props.uploaderRef.value.removeAttachment(props.attachment.id);
        chatStore.removeAttachment(props.attachment.id);

        chatStore.setState({
          attachmentCanSend:
            !props.uploaderRef.value ||
            props.uploaderRef.value.allUploadSuccess,
        });
      };

      // 计算圆形进度条参数
      const circumference = 9 * 2 * Math.PI;
      const progressOffset = computed(() => {
        return circumference - (progress.value / 100) * circumference;
      });

      return {
        state,
        progress,
        url,
        cancelUpload,
        progressOffset,
        circumference,
        AIChatAttachmentState,
      };
    },
  });
</script>

<template>
  <li class="attachment-item">
    <div class="attachment-content">
      <div class="preview">
        <img :src="url" :alt="attachment.name || ''" />
      </div>

      <!-- 上传进度 -->
      <div v-if="state === AIChatAttachmentState.Uploading" class="progress">
        <svg class="progress-svg" width="22" height="22">
          <circle
            class="progress-background"
            stroke="rgba(255,255,255,.7)"
            stroke-width="2"
            fill="transparent"
            r="9"
            cx="11"
            cy="11"
          />
          <circle
            class="progress-circle"
            stroke="#fff"
            stroke-width="2"
            fill="transparent"
            r="9"
            cx="11"
            cy="11"
            :style="{
              strokeDasharray: `${circumference} ${circumference}`,
              strokeDashoffset: progressOffset,
            }"
          />
        </svg>
      </div>

      <!-- 上传失败 -->
      <div v-if="state === AIChatAttachmentState.Failed" class="failed">
        上传失败
      </div>

      <!-- 删除按钮 -->
      <el-button class="remove-btn" @click="cancelUpload">×</el-button>
    </div>
  </li>
</template>

<style lang="scss" scoped>
  .attachment-item {
    width: 80px;
    height: 80px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;

    .attachment-content {
      width: 100%;
      height: 100%;
      background-color: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      position: relative;
    }

    .preview {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: cover;
      }
    }

    .progress {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      .progress-svg {
        display: block;
      }

      .progress-circle {
        transform: rotate(-90deg);
        transform-origin: center;
        transition: stroke-dashoffset 0.3s ease;
      }
    }

    .failed {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background-color: rgba(255, 0, 0, 0.7);
      color: white;
      padding: 2px 0;
      font-size: 12px;
      text-align: center;
    }

    .remove-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 20px;
      height: 20px;
      padding: 0;
      line-height: 1;
      font-size: 16px;
      background-color: rgba(0, 0, 0, 0.5);
      color: white;
      border: none;
      border-radius: 0 0 0 4px;
    }
  }
</style>
