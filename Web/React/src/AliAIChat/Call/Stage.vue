<!-- eslint-disable vue/custom-event-name-casing -->
<!-- eslint-disable vue/no-reserved-component-names -->
<script lang="ts">
import {
  type PropType,
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import ARTCAICallEngine, { AICallAgentType, AICallState } from 'aliyun-auikit-aicall'
import { debounce } from '../common/utils'
import { getErrorMessage } from '../common/errorMsg'
import Voice from './Voice/index.vue'
import Header from './Header.vue'
import Footer from './Footer.vue'
import Subtitle from './Subtitle.vue'
import Connecting from './Connecting.vue'
import Tip from './Tip.vue'
import useCallStore from './store'
import { useController } from './hooks/use-controller'

export default defineComponent({
  name: 'Stage',
  components: {
    Voice,
    Tip,
    CallHeader: Header,
    CallFooter: Footer,
    Subtitle,
    Connecting,
  },
  props: {
    agentType: {
      type: Number as PropType<AICallAgentType>,
      required: true,
    },
    autoCall: {
      type: Boolean,
      default: false,
    },
    limitSecond: {
      type: Number,
      default: 0,
    },
  },
  emits: ['exit', 'auth-fail'],
  setup(props, { emit }) {
    const { controllerRef: controller } = useController()
    const { callState, cameraMuted, agentState, isSpeaking } = storeToRefs(useCallStore())
    const disconnectTip = ref('')
    const showErrorDialog = ref(false)

    watchEffect(() => {
      console.log('stage', controller.value)
    })

    // 计算是否显示视频
    const hasVideo = computed(
      () =>
        callState.value === AICallState.Connected
        && (props.agentType === AICallAgentType.AvatarAgent
          || (props.agentType === AICallAgentType.VisionAgent
            && !cameraMuted.value)),
    )

    // 根据代理类型确定要渲染的组件
    const characterComponent = computed(() => {
      return 'Voice'
    })

    const countdownTimer: number | null = null

    const interruptSpeaking = debounce(() => {
      if (controller.value) {
        controller.value.interruptSpeaking()
      }
    }, 100)

    const resetCallState = () => {
      useCallStore().callState = AICallState.None
      showErrorDialog.value = false
    }

    // 开始通话
    const startCall = async () => {
      console.log(controller.value)
      if (!controller.value)
        return

      try {
        const supportedResult = await ARTCAICallEngine.isSupported()
        if (!supportedResult.support) {
          ElMessage.error('当前浏览器不支持WebRTC，建议您使用钉钉或微信打开')
          return
        }

        useCallStore().callState = AICallState.Connecting

        // 监听事件
        controller.value.on('AICallStateChanged', (newState: AICallState) => {
          useCallStore().callState = newState
          if (newState === AICallState.Error) {
            disconnectTip.value
                = getErrorMessage(controller.value.errorCode) || '连接出错'
            showErrorDialog.value = true
          }
        })

        controller.value.on('AICallAgentStateChanged', (newState: any) => {
          agentState.value = newState
        })

        controller.value.on(
          'AICallActiveSpeakerVolumeChanged',
          (userId: string, volume: number) => {
            if (userId === '') {
              // 本地说话状态
              isSpeaking.value = volume > 30
            }
          },
        )

        controller.value.on('AICallAgentEmotionNotify', (emotion, sentenceId) => {
          console.log(`智能体情绪：${emotion}, 语句：${sentenceId}`)
        })

        // 实时字幕相关
        controller.value.on('AICallAgentSubtitleNotify', (data) => {
          useCallStore().setCurrentSubtitle({
            data,
            source: 'agent',
          })
        })

        controller.value.on('AICallUserSubtitleNotify', (data, voiceprintResult) => {
          useCallStore().setCurrentSubtitle({
            data,
            source: 'user',
          })
          console.log(`voiceprintResult to ${voiceprintResult}`)
        })

        controller.value.on('AICallUserTokenExpired', () => {
          ElMessage.error('登录已过期，请重新登录')
          emit('auth-fail')
        })

        controller.value.on('AICallBegin', () => {
          if (countdownTimer) {
            window.clearInterval(countdownTimer)
          }
        })

        controller.value.on('AICallAgentWillLeave', (reason: number) => {
          let msg = '通话已经结束'
          if (reason === 2001) {
            msg = '由于你长时间未进行通话，该通话已经结束'
          }
          else if (reason === 2002) {
            msg = '该通话已经结束'
          }
          ElMessage.error(msg)
        })

        controller.value.on('AICallReceivedAgentCustomMessage', (data) => {
          ElMessage.info(`收到智能体自定义消息：${JSON.stringify(data)}`)
        })

        controller.value.on('AICallHumanTakeoverWillStart', () => {
          ElMessage.info('当前通话即将被真人接管')
        })

        controller.value.on('AICallHumanTakeoverConnected', () => {
          ElMessage.info('当前通话已经被真人接管')
        })

        controller.value.on('AICallVisionCustomCaptureChanged', (enabled) => {
          console.log(`视觉自定义截图：${enabled}`)
          if (enabled) {
            ElMessage.info('已开启自定义截帧送检模式，语音输入将不起作用')
          }
          else {
            ElMessage.info('已退出自定义截帧送检模式')
          }
        })

        controller.value.on('AICallSpeakingInterrupted', (reason) => {
          console.log(`当前讲话已被打断: ${reason}`)
          ElMessage.info('当前讲话已被打断')
        })

        const currentTemplateConfig = controller.value.config.templateConfig
        useCallStore().setState({
          enablePushToTalk: currentTemplateConfig.enablePushToTalk,
          enableVoiceInterrupt: currentTemplateConfig.enableVoiceInterrupt,
          voiceId: currentTemplateConfig.agentVoiceId || '',
        })

        try {
          await controller.value.start()
          if (controller.value.config.templateConfig?.agentVoiceId) {
            useCallStore().setState({
              voiceId: controller.value.config.templateConfig.agentVoiceId,
            })
          }
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
        catch (error) {
          useCallStore().setState({
            callState: AICallState.Error,
            callErrorMessage: getErrorMessage(controller.value.errorCode),
          })
        }
      }
      catch (error) {
        console.error('Failed to start call:', error)
        useCallStore().callState = AICallState.Error
        disconnectTip.value = '初始化失败，请重试'
        showErrorDialog.value = true
      }
    }

    // 结束通话
    const stopCall = async () => {
      if (!controller.value)
        return

      try {
        await controller.value.handup()
        // 重置状态
        useCallStore().reset()
        onExit()
      }
      catch (error) {
        console.error('停止通话失败:', error)
      }
    }

    function onExit() {
      emit('exit')
    }

    function onAuthFail() {
      emit('auth-fail')
    }

    onMounted(() => {
      if (!controller.value)
        return

      controller.value.config.agentType = props.agentType

      useCallStore().setState({
        agentType: props.agentType,
      })

      if (props.autoCall) {
        startCall()
      }
    })

    onUnmounted(() => {
      // 清理工作
      if (countdownTimer) {
        window.clearInterval(countdownTimer)
      }

      // 停止通话
      if (controller.value) {
        controller.value.handup()
      }

      useCallStore().reset()
    })

    watch(
      () => props.autoCall,
      (newValue) => {
        if (newValue && controller && callState.value === AICallState.None) {
          startCall()
        }
      },
    )

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
    }
  },
})
</script>

<template>
  <div class="stage">
    <CallHeader />
    <div
      class="stage-bd"
      :class="{ 'has-video': hasVideo }"
      @click="interruptSpeaking"
    >
      <Subtitle />
      <Voice v-if="callState === AICallState.Connected" />
      <Connecting v-else />
      <Tip v-if="callState === AICallState.Connected" />
      <CallFooter @stop="stopCall" @call="startCall" />
    </div>
    <van-dialog
      v-if="callState === AICallState.Error"
      v-model:visible="showErrorDialog"
      get-container="() => getRootElement()"
      :closeable="true"
      @close="resetCallState"
    >
      <div class="stage-error-message">
        {{ disconnectTip }}
      </div>
      <template #footer>
        <el-button round block @click="resetCallState">
          关闭
        </el-button>
        <el-button round type="primary" block @click="stopCall">
          退出
        </el-button>
      </template>
    </van-dialog>
  </div>
</template>

<style lang="scss">
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
