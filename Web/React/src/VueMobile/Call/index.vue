<template>
  <div class="call-container" :style="containerStyle">
    <controller-context-provider :value="controllerRef">
      <Stage
        :agent-type="agentType"
        :auto-call="shouldAutoCall"
        @auth-fail="onAuthFail"
        @exit="onExitClick"
      />
      <slot></slot>
    </controller-context-provider>
  </div>
</template>

<script lang="ts">
  import {
    computed,
    defineComponent,
    onMounted,
    onUnmounted,
    ref,
    watch,
  } from 'vue';
  import {
    AICallController,
    AICallOptions,
    AICallAgentType,
    AICallTemplateConfig,
    AICallChatSyncConfig,
  } from 'aliyun-auikit-aicall';
  import { Toast } from 'vant';
  import Stage from './Stage.vue';
  import ControllerContextProvider from './ControlerContext';
  import { defaultCallBehavior } from './store';
  import { isAndroidWeChatBrowser } from '../../common/utils';

  export default defineComponent({
    name: 'Call',
    components: {
      Stage,
      ControllerContextProvider,
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
      agentType: {
        type: String,
        required: true,
      },
      autoCall: {
        type: Boolean,
        default: undefined,
      },
      shareToken: {
        type: String,
        default: undefined,
      },
      fromShare: {
        type: Boolean,
        default: false,
      },
      agentId: {
        type: String,
        default: undefined,
      },
      appServer: {
        type: String,
        required: true,
      },
      region: {
        type: String,
        default: undefined,
      },
      userData: {
        type: String,
        default: undefined,
      },
      templateConfig: {
        type: Object,
        default: undefined,
      },
      chatSyncConfig: {
        type: Object as () => AICallChatSyncConfig,
        default: undefined,
      },
      rtcEngineConfig: {
        type: Object as () => {
          environment?: 'PRE' | 'PROD';
          useAudioPlugin?: boolean;
          dumpAudio?: boolean;
        },
        default: undefined,
      },
    },
    emits: ['exit', 'auth-fail'],
    setup(props, { emit }) {
      const controllerRef = ref<AICallController | null>(null);

      const containerStyle = computed(() => ({
        '--aicall-safe-area-top': '0px',
        '--aicall-safe-area-bottom': '0px',
      }));

      // 计算是否应该自动拨号
      const shouldAutoCall = computed(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const hasNoCallParam = urlParams.get('nocall') !== null;

        // 优先使用props中的autoCall
        if (props.autoCall !== undefined) {
          return props.autoCall;
        }

        // 微信安卓端自动播放会失败，分享场景需要手动点击通话
        if (
          hasNoCallParam ||
          (controllerRef.value?.config.fromShare && isAndroidWeChatBrowser())
        ) {
          return false;
        }

        return true;
      });

      onMounted(() => {
        initCall();

        // 关闭页面时尝试挂断，减少出现 Agent 需要超时才能退出的情况
        const beforeOnload = () => {
          controllerRef.value?.handup();
        };
        window.addEventListener('beforeunload', beforeOnload);
      });

      onUnmounted(() => {
        // 清理事件监听
        window.removeEventListener('beforeunload', () => {
          controllerRef.value?.handup();
        });

        controllerRef.value?.destroy();
      });

      watch(
        () => props,
        () => {
          initCall();
        },
        { deep: true },
      );

      const initCall = async () => {
        const {
          userId,
          userToken,
          agentType,
          shareToken,
          fromShare,
          agentId,
          appServer,
          region,
          userData,
          templateConfig,
          chatSyncConfig,
          rtcEngineConfig,
        } = props;

        try {
          if (controllerRef.value) {
            controllerRef.value.destroy();
            controllerRef.value = null;
          }

          const options: AICallOptions = {
            userId,
            userToken,
            agentId,
            appServer,
            region,
            userData,
            templateConfig,
            behavior: defaultCallBehavior,
            onAuthFail: () => {
              emit('auth-fail');
            },
          };

          const controller = new AICallController(options);

          // 处理分享相关配置
          if (shareToken) {
            controller.shareConfig = shareToken;

            if (!controller.shareConfig) {
              Toast({
                message: '分享链接有误',
                position: 'bottom',
              });
              return;
            }

            if (controller.shareConfig.templateConfig) {
              controller.config.templateConfig =
                AICallTemplateConfig.fromJsonString(
                  controller.shareConfig?.agentType ||
                    AICallAgentType.VoiceAgent,
                  controller.shareConfig?.templateConfig,
                );
            }

            controller.config.fromShare = true;
          } else {
            controller.config.fromShare = !!fromShare;

            if (agentId) {
              controller.config.agentId = agentId;
            }

            if (chatSyncConfig) {
              controller.config.chatSyncConfig = chatSyncConfig;
            }
          }

          // 设置RTC引擎配置
          if (rtcEngineConfig) {
            controller.config.rtcEngineConfig = rtcEngineConfig;
          }

          controllerRef.value = controller;
        } catch (error) {
          console.error('Failed to initialize call:', error);
        }
      };

      const onExitClick = () => {
        if (controllerRef.value) {
          controllerRef.value.destroy();
          controllerRef.value = null;
        }
        emit('exit');
      };

      const onAuthFail = () => {
        emit('auth-fail');
      };

      return {
        controllerRef,
        containerStyle,
        shouldAutoCall,
        onExitClick,
        onAuthFail,
        agentType,
      };
    },
  });
</script>

<style lang="less">
  .call-container {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100%;
    overflow: hidden;
    background-color: #000;
  }
</style>
