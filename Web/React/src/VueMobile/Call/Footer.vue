<template>
  <div class="footer">
    <ul class="_action-list">
      <!-- 视觉模式下的摄像头按钮 -->
      <li v-if="isVisionAgentAndConnected" key="camera" class="_camera">
        <div v-if="!cameraMuted && isMobile" class="_camera-switch">
          <van-button @click="switchCamera">
            <CameraSwitchSVG />
          </van-button>
          <div class="_label">镜头翻转</div>
        </div>
        <van-button @click="toggleCameraMuted">
          <component :is="cameraMuted ? 'CameraClosedSVG' : 'CameraSVG'" />
        </van-button>
        <div class="_label">{{ cameraMuted ? '摄像头已关' : '关摄像头' }}</div>
      </li>

      <!-- 通话按钮，在非对讲机模式下位于中间 -->
      <li
        key="call"
        class="_call"
        :class="{
          'is-connected':
            callState === AICallState.Connected ||
            callState === AICallState.Connecting,
        }"
      >
        <van-button @click="onCallClick">
          <CallPhoneSVG />
        </van-button>
        <div class="_label">
          {{
            callState === AICallState.Connected ||
            callState === AICallState.Connecting
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
        <van-button
          @touchstart="startPushToTalk"
          @touchend="stopPushToTalk"
          @mousedown="!isTouchSupported ? startPushToTalk : undefined"
          @mouseup="!isTouchSupported ? stopPushToTalk : undefined"
          @click="toggleMicrophoneMuted"
          :class="{ 'is-pushing': pushingToTalk }"
        >
          <component
            :is="microphoneMuted ? 'MicrophoneClosedSVG' : 'MicrophoneSVG'"
          />
        </van-button>

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
      <li v-if="needEmptyBtn" key="empty"></li>
    </ul>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, inject, onMounted } from 'vue';
  import { Toast } from 'vant';
  import { AICallAgentType, AICallState } from 'aliyun-auikit-aicall';
  import { ControllerContextKey } from './ControlerContext.vue';
  import {
    CallPhoneSVG,
    CameraClosedSVG,
    CameraSVG,
    CameraSwitchSVG,
    MicrophoneClosedSVG,
    MicrophoneSVG,
  } from './Icons';
  import { getRootElement, isMobile } from '@/common/utils';

  export default defineComponent({
    name: 'CallFooter',
    components: {
      CallPhoneSVG,
      CameraClosedSVG,
      CameraSVG,
      CameraSwitchSVG,
      MicrophoneClosedSVG,
      MicrophoneSVG,
    },
    setup() {
      const controller = inject(ControllerContextKey);
      const agentType = ref(AICallAgentType.VoiceAgent); // 默认值，实际应该从controller获取
      const callState = ref(AICallState.Connected); // 默认值，实际应该从store获取
      const microphoneMuted = ref(false);
      const cameraMuted = ref(false);
      const enablePushToTalk = ref(false);
      const pushingToTalk = ref(false);
      let pushingStartTime = 0;
      let pushingTimer: number | null = null;
      const isTouchSupported = 'ontouchstart' in window;

      const isVisionAgentAndConnected = computed(
        () =>
          agentType.value === AICallAgentType.VisionAgent &&
          callState.value === AICallState.Connected,
      );

      const needEmptyBtn = computed(
        () =>
          callState.value === AICallState.Connected &&
          agentType.value !== AICallAgentType.VisionAgent &&
          enablePushToTalk.value,
      );

      const toggleMicrophoneMuted = (e: Event) => {
        e.stopPropagation();
        if (enablePushToTalk.value) return;
        const to = !microphoneMuted.value;
        if (controller) {
          controller.muteMicrophone(to);
        }
        microphoneMuted.value = to;
      };

      const toggleCameraMuted = (e: Event) => {
        e.stopPropagation();
        const to = !cameraMuted.value;
        if (controller) {
          controller.muteCamera(to);
        }
        cameraMuted.value = to;
      };

      const switchCamera = (e: Event) => {
        e.stopPropagation();
        if (controller) {
          controller.switchCamera();
        }
      };

      const stopPushToTalk = () => {
        if (!pushingStartTime || !enablePushToTalk.value) return;
        if (pushingTimer) {
          clearTimeout(pushingTimer);
          pushingTimer = null;
        }
        const duration = Date.now() - pushingStartTime;
        if (duration < 500) {
          Toast({
            message: '说话时间太短',
          });
          if (controller) {
            controller.cancelPushToTalk();
          }
        } else {
          if (controller) {
            controller.finishPushToTalk();
          }
        }
        pushingToTalk.value = false;
        pushingStartTime = 0;
      };

      const startPushToTalk = () => {
        if (!enablePushToTalk.value) return;
        if (controller) {
          controller.startPushToTalk();
        }
        pushingToTalk.value = true;
        pushingStartTime = Date.now();
        pushingTimer = window.setTimeout(() => {
          stopPushToTalk();
        }, 60 * 1000);
      };

      const onCallClick = (e: Event) => {
        e.stopPropagation();
        if (
          callState.value === AICallState.Connected ||
          callState.value === AICallState.Connecting
        ) {
          onStop();
        } else {
          onCall();
        }
      };

      const onCall = () => {
        // 实际应用中这里会调用父组件的方法
        console.log('Call button clicked');
      };

      const onStop = () => {
        // 实际应用中这里会调用父组件的方法
        console.log('Stop button clicked');
        if (controller) {
          controller.handup();
        }
      };

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
      };
    },
  });
</script>

<style lang="less">
  .footer {
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

      .adm-button {
        width: 40px;
        height: 40px;
        border-radius: 20px;
        border-color: #d8d9e6;
        padding: 0;

        & > span {
          display: inline-block;
          width: 24px;
          height: 24px;
        }

        svg {
          vertical-align: middle;
        }
      }

      ._camera-switch {
        position: absolute;
        border: none;
        top: 0;
        left: -60px;
        padding-bottom: 40px;
        .adm-button {
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
        .adm-button {
          background: #20c591;
          border-color: #20c591;
          transition: background ease-in-out 200ms;
          & > span {
            transform: rotate(-130deg);
            transition: transform ease-in-out 200ms;
          }
          svg {
            vertical-align: 3px;
          }
        }

        &.is-connected {
          .adm-button {
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
        .adm-button {
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
