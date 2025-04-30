<template>
  <div class="stage">
    <Header @exit="onExit" />
    <div
      class="stage-bd"
      :class="{ 'has-video': hasVideo }"
      @click="interruptSpeaking"
    >
      <Subtitle />
      <component
        v-if="callState === AICallState.Connected"
        :is="characterComponent"
      />
      <Connecting v-else />
      <Tip v-if="callState === AICallState.Connected" />
      <Footer @stop="stopCall" @call="startCall" />
    </div>
    <van-dialog
      v-if="callState === AICallState.Error"
      v-model:visible="showErrorDialog"
      get-container="() => getRootElement()"
      :closeable="true"
      @close="resetCallState"
    >
      <div class="stage-error-message">{{ disconnectTip }}</div>
      <template #footer>
        <van-button round block @click="resetCallState">关闭</van-button>
        <van-button round type="primary" block @click="stopCall">
          退出
        </van-button>
      </template>
    </van-dialog>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    inject,
    onMounted,
    onUnmounted,
    watch,
    computed,
  } from 'vue';
  import { AICallAgentType, AICallState } from 'aliyun-auikit-aicall';
  import ARTCAICallEngine from 'aliyun-auikit-aicall';
  import { Toast, Dialog } from 'vant';
  import { ControllerContextKey } from './ControlerContext.vue';
  import Voice from './Voice/index.vue';
  import Avatar from './Avatar/index.vue';
  import Vision from './Vision/index.vue';
  import Header from './Header.vue';
  import Footer from './Footer.vue';
  import Subtitle from './Subtitle.vue';
  import Connecting from './Connecting.vue';
  import Tip from './Tip.vue';
  import { debounce, getRootElement } from '@/common/utils';
  import i18n, { getErrorMessage } from '@/common/i18n';

  export default defineComponent({
    name: 'Stage',
    components: {
      Voice,
      Avatar,
      Vision,
      Tip,
      Header,
      Footer,
      Subtitle,
      Connecting,
    },
    props: {
      agentType: {
        type: String,
        required: true,
      },
      autoCall: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['exit', 'auth-fail'],
    setup(props, { emit }) {
      const controller = inject(ControllerContextKey);
      const callState = ref(AICallState.None);
      const agentState = ref(null);
      const isSpeaking = ref(false);
      const cameraMuted = ref(false);
      const disconnectTip = ref('');
      const showErrorDialog = ref(false);

      // 计算是否显示视频
      const hasVideo = computed(
        () =>
          callState.value === AICallState.Connected &&
          (props.agentType === AICallAgentType.AvatarAgent ||
            (props.agentType === AICallAgentType.VisionAgent &&
              !cameraMuted.value)),
      );

      // 根据代理类型确定要渲染的组件
      const characterComponent = computed(() => {
        if (props.agentType === AICallAgentType.AvatarAgent) {
          return 'Avatar';
        } else if (props.agentType === AICallAgentType.VisionAgent) {
          return 'Vision';
        }
        return 'Voice';
      });

      let countdownTimer: number | null = null;
      let startTime = 0;

      const interruptSpeaking = debounce(() => {
        if (controller) {
          controller.interruptSpeaking();
        }
      }, 100);

      const resetCallState = () => {
        callState.value = AICallState.None;
        showErrorDialog.value = false;
      };

      // 开始通话
      const startCall = async () => {
        if (!controller) return;

        try {
          const supportedResult = await ARTCAICallEngine.isSupported();
          if (!supportedResult.support) {
            Dialog.confirm({
              title: '提示',
              message: '当前浏览器不支持WebRTC，建议您使用钉钉或微信打开',
              confirmButtonText: '确定',
              showCancelButton: false,
            });
            return;
          }

          callState.value = AICallState.Connecting;

          // 监听事件
          controller.on('AICallStateChanged', (newState: AICallState) => {
            callState.value = newState;
            if (newState === AICallState.Error) {
              disconnectTip.value =
                getErrorMessage(controller.errorCode) || '连接出错';
              showErrorDialog.value = true;
            }
          });

          controller.on('AICallAgentStateChanged', (newState: any) => {
            agentState.value = newState;
          });

          controller.on(
            'AICallActiveSpeakerVolumeChanged',
            (userId: string, volume: number) => {
              if (userId === '') {
                // 本地说话状态
                isSpeaking.value = volume > 30;
              }
            },
          );

          controller.on('AICallCameraStateChanged', (on: boolean) => {
            cameraMuted.value = !on;
          });

          controller.on('AICallUserTokenExpired', () => {
            Toast('登录已过期，请重新登录');
            emit('auth-fail');
          });

          controller.on('AICallAgentWillLeave', (reason: number) => {
            let toast = '通话已经结束';
            if (reason == 2001) {
              toast = '由于你长时间未进行通话，该通话已经结束';
            } else if (reason == 2002) {
              toast = '该通话已经结束';
            }
            Toast(toast);
          });

          // 启动通话
          await controller.start();
        } catch (error) {
          console.error('Failed to start call:', error);
          callState.value = AICallState.Error;
          disconnectTip.value = '初始化失败，请重试';
          showErrorDialog.value = true;
        }
      };

      // 结束通话
      const stopCall = async () => {
        if (!controller) return;

        try {
          await controller.handup();
          // 重置状态
          resetCallState();
          onExit();
        } catch (error) {
          console.error('停止通话失败:', error);
        }
      };

      const onExit = () => {
        emit('exit');
      };

      const onAuthFail = () => {
        emit('auth-fail');
      };

      onMounted(() => {
        // 自动通话
        if (props.autoCall && controller) {
          startCall();
        }
      });

      onUnmounted(() => {
        // 清理工作
        if (countdownTimer) {
          window.clearInterval(countdownTimer);
        }

        // 停止通话
        if (controller) {
          controller.handup();
        }
      });

      watch(
        () => props.autoCall,
        (newValue) => {
          if (newValue && controller && callState.value === AICallState.None) {
            startCall();
          }
        },
      );

      return {
        callState,
        cameraMuted,
        disconnectTip,
        hasVideo,
        characterComponent,
        showErrorDialog,
        interruptSpeaking,
        startCall,
        stopCall,
        resetCallState,
        onExit,
        onAuthFail,
        AICallAgentType,
        AICallState,
      };
    },
  });
</script>

<style lang="less">
  .stage {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .stage-bd {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    &.has-video {
      background-color: #000;
    }
  }

  .stage-error-message {
    padding: 20px;
    text-align: center;
  }
</style>
