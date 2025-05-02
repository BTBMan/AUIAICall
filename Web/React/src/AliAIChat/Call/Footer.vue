<script lang="ts">
import { computed, defineComponent } from 'vue'
import { AICallAgentType, AICallState } from 'aliyun-auikit-aicall'
import { isMobile } from '../common/utils'
import Icons from './Icons.vue'
import useCallStore from './store'
import { useController } from './hooks/use-controller'

export default defineComponent({
  name: 'CallFooter',
  components: {
    Icons,
  },
  emits: ['call', 'stop'],
  setup(_, { emit }) {
    const { controllerRef: controller } = useController()

    const {
      agentType,
      callState,
      microphoneMuted,
      cameraMuted,
      pushingToTalk,
      enablePushToTalk,
    } = storeToRefs(useCallStore())

    let pushingStartTime = 0
    let pushingTimer: number | null = null
    const isTouchSupported = 'ontouchstart' in window

    const isVisionAgentAndConnected = computed(
      () =>
        agentType.value === AICallAgentType.VisionAgent
        && callState.value === AICallState.Connected,
    )

    const needEmptyBtn = computed(
      () =>
        callState.value === AICallState.Connected
        && agentType.value !== AICallAgentType.VisionAgent
        && enablePushToTalk.value,
    )

    const toggleMicrophoneMuted = (e: Event) => {
      e.stopPropagation()
      if (enablePushToTalk.value)
        return
      const to = !microphoneMuted.value
      if (controller) {
        controller.value.muteMicrophone(to)
      }
      microphoneMuted.value = to
    }

    const toggleCameraMuted = (e: Event) => {
      e.stopPropagation()
      const to = !cameraMuted.value
      if (controller) {
        controller.value.muteCamera(to)
      }
      cameraMuted.value = to
    }

    const switchCamera = (e: Event) => {
      e.stopPropagation()
      if (controller) {
        controller.value.switchCamera()
      }
    }

    const stopPushToTalk = () => {
      if (!pushingStartTime || !enablePushToTalk.value)
        return
      if (pushingTimer) {
        clearTimeout(pushingTimer)
        pushingTimer = null
      }
      const duration = Date.now() - pushingStartTime
      if (duration < 500) {
        ElMessage.error('说话时间太短')
        if (controller) {
          controller.value.cancelPushToTalk()
        }
      }
      else {
        if (controller) {
          controller.value.finishPushToTalk()
        }
      }
      pushingToTalk.value = false
      pushingStartTime = 0
    }

    const startPushToTalk = () => {
      if (!enablePushToTalk.value)
        return
      if (controller) {
        controller.value.startPushToTalk()
      }
      pushingToTalk.value = true
      pushingStartTime = Date.now()
      pushingTimer = window.setTimeout(() => {
        stopPushToTalk()
      }, 60 * 1000)
    }

    const onCallClick = (e: Event) => {
      e.stopPropagation()
      if (
        callState.value === AICallState.Connected
        || callState.value === AICallState.Connecting
      ) {
        onStop()
      }
      else {
        onCall()
      }
    }

    function onCall() {
      emit('call')
    }

    function onStop() {
      emit('stop')
    }

    return {
      agentType,
      callState,
      microphoneMuted,
      cameraMuted,
      enablePushToTalk,
      pushingToTalk,
      isTouchSupported,
      isVisionAgentAndConnected,
      needEmptyBtn,
      toggleMicrophoneMuted,
      toggleCameraMuted,
      switchCamera,
      stopPushToTalk,
      startPushToTalk,
      onCallClick,
      isMobile,
      AICallAgentType,
      AICallState,
    }
  },
})
</script>

<template>
  <div class="call-footer">
    <ul class="_action-list">
      <!-- 视觉模式下的摄像头按钮 -->
      <li v-if="isVisionAgentAndConnected" key="camera" class="_camera">
        <div v-if="!cameraMuted && isMobile" class="_camera-switch">
          <el-button @click="switchCamera">
            <Icons name="CameraSwitchSVG" />
          </el-button>
          <div class="_label">
            镜头翻转
          </div>
        </div>
        <el-button @click="toggleCameraMuted">
          <Icons :name="cameraMuted ? 'CameraClosedSVG' : 'CameraSVG'" />
        </el-button>
        <div class="_label">
          {{ cameraMuted ? '摄像头已关' : '关摄像头' }}
        </div>
      </li>

      <!-- 通话按钮，在非对讲机模式下位于中间 -->
      <li
        key="call"
        class="_call"
        :class="{
          'is-connected':
            callState === AICallState.Connected
            || callState === AICallState.Connecting,
        }"
      >
        <el-button @click="onCallClick">
          <Icons name="CallPhoneSVG" />
        </el-button>
        <div class="_label">
          {{
            callState === AICallState.Connected
              || callState === AICallState.Connecting
              ? '挂断'
              : '拨打'
          }}
        </div>
      </li>

      <!-- 麦克风按钮，在对讲机模式下位于中间 -->
      <li
        v-if="callState === AICallState.Connected"
        key="microphone"
        class="_microphone"
        :class="{ 'is-push-to-talk': enablePushToTalk }"
        @contextmenu.prevent
      >
        <el-button
          :class="{ 'is-pushing': pushingToTalk }"
          @touchstart="startPushToTalk"
          @touchend="stopPushToTalk"
          @mousedown="!isTouchSupported ? startPushToTalk : undefined"
          @mouseup="!isTouchSupported ? stopPushToTalk : undefined"
          @click="toggleMicrophoneMuted"
        >
          <Icons :name="microphoneMuted ? 'MicrophoneClosedSVG' : 'MicrophoneSVG'" />
        </el-button>

        <div class="_label">
          <template v-if="enablePushToTalk">
            {{ pushingToTalk ? '松开发送' : '按住讲话' }}
          </template>
          <template v-else>
            {{ microphoneMuted ? '麦克风已关' : '关麦克风' }}
          </template>
        </div>
      </li>

      <!-- 占位元素，保持布局 -->
      <li v-if="needEmptyBtn" key="empty" />
    </ul>
  </div>
</template>

<style lang="scss">
.call-footer {
  position: relative;
  z-index: 3;
  height: 126px;
  text-align: center;
  user-select: none;

  ._action-list {
    display: flex;
    justify-content: center;
    list-style: none;
    margin: 0;
    padding: 0;

    li {
      position: relative;
      margin: 0 10px;
      width: 52px;
      padding-bottom: 40px;
    }

    .el-button {
      width: 40px;
      height: 40px;
      border-radius: 20px;
      border-color: #d8d9e6;
      padding: 0;
    }

    ._camera-switch {
      position: absolute;
      border: none;
      top: 0;
      left: -60px;
      padding-bottom: 40px;
      .el-button {
        border: none;
        background: none !important;
      }
    }

    ._label {
      position: absolute;
      bottom: 0;
      margin-top: 8px;
      font-size: 12px;
      line-height: 32px;
      color: #878aab;
      white-space: nowrap;
      left: 50%;
      transform: translate3d(-50%, 0, 0);
    }

    ._call {
      .el-button {
        background: #20c591;
        border-color: #20c591;
        transition: background ease-in-out 200ms;
        & > span {
          transform: rotate(-130deg);
          transition: transform ease-in-out 200ms;
        }

        svg {
          margin-top: -3px;
        }
      }

      &.is-connected {
        .el-button {
          background: #f23139;
          border-color: #f23139;
          & > span {
            transform: rotate(0);
          }
        }
      }
    }

    ._microphone.is-push-to-talk {
      width: 82px;
      .el-button {
        width: 70px;
        &::before {
          display: none;
        }
        &.is-pushing {
          background: var(--adm-color-primary);
          color: #fff;
        }
      }
    }
  }
}
</style>
