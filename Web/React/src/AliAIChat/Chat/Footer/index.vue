<script lang="ts">
  import {
    defineComponent,
    ref,
    inject,
    computed,
    onMounted,
    onUnmounted,
  } from 'vue';
  import { useChatStore } from '../store';
  import { ChatEngineKey } from '../provider';
  import {
    AICallAgentType,
    AICallChatSyncConfig,
    AIChatAttachment,
    AIChatAttachmentUploader,
  } from 'aliyun-auikit-aicall';
  import { ElMessage, ElDialog } from 'element-plus';
  import {
    openExtraSVG,
    closeExtraSVG,
    imageUploadSVG,
    toVoiceSVG,
    toAvatarSVG,
    toVisionSVG,
    attachmentAddSVG,
  } from '../Icons';
  import TextSender from './TextSender.vue';
  import VoiceSender from './VoiceSender.vue';
  import Attachment from './Attachment.vue';

  const MAX_FILE_SIZE = 1024 * 1024 * 10;
  const MAX_FILE_COUNT = 9;

  export default defineComponent({
    name: 'Footer',
    components: {
      TextSender,
      VoiceSender,
      Attachment,
    },
    props: {
      userId: {
        type: String,
        required: true,
      },
      userToken: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const chatStore = useChatStore();
      const chatEngine = inject(ChatEngineKey);

      // 状态管理
      const mode = ref<'text' | 'voice'>('text');
      const extraViewVisible = ref(false);
      const callVisible = ref(false);
      const callAgentType = ref<AICallAgentType>(AICallAgentType.VoiceAgent);

      // 附件上传相关
      const uploaderRef = ref<AIChatAttachmentUploader>();
      const attachmentEndRef = ref<HTMLLIElement | null>(null);

      // 从store获取附件信息
      const attachmentList = computed(() => chatStore.attachmentList);

      // 高度变化处理函数，用于通知页面重新计算高度
      const onHeightUpdate = () => {
        // 触发页面重新调整高度
        chatStore.updateMessageList();
      };

      // 监听extraViewVisible变化
      watch(extraViewVisible, () => {
        onHeightUpdate();
      });

      // 上传附件
      const onUpload = async (e: Event) => {
        if (!chatEngine.value) return;

        const input = e.target as HTMLInputElement;
        const files = input.files;

        if (
          attachmentList.value.length + (files?.length || 0) >
          MAX_FILE_COUNT
        ) {
          ElMessage.warning(`最多上传${MAX_FILE_COUNT}个文件`);
          return;
        }

        if (files && files.length > 0) {
          const filteredFiles = Array.from(files).filter(
            (file) => file.size <= MAX_FILE_SIZE,
          );

          if (files.length !== filteredFiles.length) {
            ElMessage.warning(
              `文件大小不能超过${MAX_FILE_SIZE / 1024 / 1024}M`,
            );
          }

          if (filteredFiles.length > 0) {
            if (!uploaderRef.value) {
              uploaderRef.value =
                await chatEngine.value.createAttachmentUploader();
              uploaderRef.value.on('uploadSuccess', () => {
                chatStore.setState({
                  attachmentCanSend:
                    !uploaderRef.value || uploaderRef.value.allUploadSuccess,
                });
              });
            }

            // 开始上传则必然不可 Send
            chatStore.setState({
              attachmentCanSend: false,
            });

            filteredFiles.forEach((file) => {
              const attachment = AIChatAttachment.createImageAttachment(file);
              chatStore.addAttachment(attachment);
              uploaderRef.value?.addAttachment(attachment);
            });

            // 添加完成后如有必要，将继续添加按钮移动到画面中
            setTimeout(() => {
              attachmentEndRef.value?.scrollIntoView();
            }, 100);
          }
        }

        // 重置input值，以便同一文件能够再次选择
        if (input) {
          input.value = '';
        }
      };

      // 点击附加按钮
      const onStartUpload = async (e: Event) => {
        extraViewVisible.value = false;
        onUpload(e);
        if (uploaderRef.value) {
          uploaderRef.value.destroy(true);
          uploaderRef.value = undefined;
        }
      };

      // 消息发送完成后处理
      const afterSend = (success: boolean) => {
        // 发送成功，清空 uploader
        if (success) {
          uploaderRef.value?.destroy();
          uploaderRef.value = undefined;
        }

        // 清空附件列表
        chatStore.setState({
          attachmentList: [],
        });
      };

      // 切换输入模式
      const handleTypeChange = (type: 'text' | 'voice') => {
        mode.value = type;
      };

      // 启动通话
      const startCall = (type: AICallAgentType) => {
        extraViewVisible.value = false;
        callAgentType.value = type;
        callVisible.value = true;
      };

      // 关闭通话
      const closeCall = () => {
        callVisible.value = false;
      };

      return {
        mode,
        extraViewVisible,
        callVisible,
        callAgentType,
        attachmentList,
        attachmentEndRef,
        uploaderRef,
        handleTypeChange,
        onUpload,
        onStartUpload,
        afterSend,
        startCall,
        closeCall,
        openExtraSVG,
        closeExtraSVG,
        imageUploadSVG,
        toVoiceSVG,
        toAvatarSVG,
        toVisionSVG,
        attachmentAddSVG,
        AICallAgentType,
      };
    },
  });
</script>

<template>
  <div class="chat-footer">
    <div class="_bd">
      <el-button
        v-if="attachmentList.length === 0"
        class="_extra-btn"
        @click="extraViewVisible = !extraViewVisible"
        v-html="extraViewVisible ? closeExtraSVG : openExtraSVG"
      />

      <div class="_send-area">
        <voice-sender
          v-if="mode === 'voice'"
          :uploader-ref="uploaderRef"
          @type-change="handleTypeChange"
          :after-send="afterSend"
        />
        <text-sender
          v-else
          :uploader-ref="uploaderRef"
          @type-change="handleTypeChange"
          :after-send="afterSend"
        />
      </div>
    </div>

    <ul v-if="extraViewVisible" class="_extra-actions">
      <li>
        <div class="_upload-button">
          <span v-html="imageUploadSVG"></span>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="onStartUpload"
          />
        </div>
        <div class="_extra-action-label">
          <span>相册</span>
        </div>
      </li>
      <li>
        <el-button
          @click="startCall(AICallAgentType.VoiceAgent)"
          v-html="toVoiceSVG"
        />
        <div class="_extra-action-label">
          <span>语音通话</span>
        </div>
      </li>
      <li>
        <el-button
          @click="startCall(AICallAgentType.AvatarAgent)"
          v-html="toAvatarSVG"
        />
        <div class="_extra-action-label">
          <span>虚拟人通话</span>
        </div>
      </li>
      <li>
        <el-button
          @click="startCall(AICallAgentType.VisionAgent)"
          v-html="toVisionSVG"
        />
        <div class="_extra-action-label">
          <span>视觉理解通话</span>
        </div>
      </li>
    </ul>

    <div v-if="attachmentList.length > 0" class="_attachments">
      <ul>
        <attachment
          v-for="attachment in attachmentList"
          :key="attachment.id"
          :attachment="attachment"
          :uploader-ref="uploaderRef"
        />
        <li>
          <div class="_add">
            <span v-html="attachmentAddSVG"></span>
            <input type="file" accept="image/*" multiple @change="onUpload" />
          </div>
        </li>
        <li ref="attachmentEndRef"></li>
      </ul>
    </div>

    <!-- 通话弹窗 -->
    <el-dialog
      v-model="callVisible"
      :class="{ 'call-dialog': true }"
      :show-close="false"
      fullscreen
    >
      <!-- 这里简化处理，实际项目中需要引入Call组件 -->
      <div class="call-container">
        <div class="call-header">
          <el-button @click="closeCall">返回</el-button>
        </div>
        <div class="call-content">
          <p>通话功能占位</p>
          <p>实际使用需引入Chat组件</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
  .chat-footer {
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 2;
    padding: 20px;
    background-color: #f7f6fe;

    ._bd {
      position: relative;
      display: flex;
    }

    ._send-area {
      flex: 1;
      display: flex;
      flex-direction: row;
    }

    ._extra-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      background-color: transparent;
      color: inherit;
      margin: 0 6px 0 -6px;
    }

    ._extra-actions {
      display: flex;
      justify-content: space-between;
      list-style: none;
      margin: 0;
      padding: 18px 0 0 0;
      text-align: center;

      li {
        flex: 1 1 70px;
      }

      ._extra-action-label {
        margin-top: 8px;
        padding: 0 2px;
        word-wrap: break-word;
        color: #56597e;
        font-size: 12px;
      }

      ._upload-button {
        position: relative;
        display: inline-block;

        input[type='file'] {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      }
    }

    ._attachments {
      margin-top: 12px;

      ul {
        display: flex;
        list-style: none;
        margin: 0;
        padding: 0;
        flex-wrap: wrap;
        gap: 8px;
      }

      ._add {
        width: 80px;
        height: 80px;
        border-radius: 4px;
        overflow: hidden;
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;

        input[type='file'] {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
      }
    }
  }

  .call-dialog {
    :deep(.el-dialog__body) {
      padding: 0;
    }

    .call-container {
      height: 100vh;
      display: flex;
      flex-direction: column;

      .call-header {
        height: 60px;
        display: flex;
        align-items: center;
        padding: 0 20px;
        border-bottom: 1px solid #eee;
      }

      .call-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    }
  }
</style>
