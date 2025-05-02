<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue'
import { useCallStore } from '../store'
import { useController } from '../hooks/use-controller'

export default defineComponent({
  name: 'Vision',
  setup() {
    const videoRef = ref<HTMLVideoElement | null>(null)
    const { controllerRef: controller } = useController()
    const { controls } = useCallStore()
    const cameraMuted = ref(true)
    let stream: MediaStream | null = null

    const isVideoEnabled = computed(() => {
      return controls.value.videoEnabled && controls.value.cameraOn
    })

    const initCamera = async () => {
      if (!isVideoEnabled.value) {
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
          stream = null
        }
        cameraMuted.value = true
        return
      }

      try {
        if (stream) {
          stream.getTracks().forEach(track => track.stop())
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })

        if (videoRef.value) {
          videoRef.value.srcObject = stream
        }

        cameraMuted.value = false

        // 将视频流发送给控制器
        if (controller) {
          controller.updateLocalStream?.(stream)
        }
      }
      catch (error) {
        console.error('Camera access failed:', error)
        cameraMuted.value = true
      }
    }

    // 监听摄像头启用状态变化
    watch(isVideoEnabled, () => {
      initCamera()
    })

    onMounted(() => {
      // 初始化时尝试启动摄像头
      initCamera()
    })

    onUnmounted(() => {
      // 组件卸载时停止所有媒体流
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
        stream = null
      }
    })

    return {
      videoRef,
      cameraMuted,
      isVideoEnabled,
    }
  },
})
</script>

<template>
  <div class="character vision">
    <div class="_box">
      <div class="_camera">
        <template v-if="!cameraMuted && isVideoEnabled">
          <video ref="videoRef" autoplay muted playsinline />
        </template>
        <div v-else class="_camera-off">
          <div class="_off-icon" />
          <div class="_off-text">
            摄像头已关闭
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  .vision {
  flex: 1 1 auto;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;

  video {
    position: absolute;
    width: 100%;
    min-height: 100%;
    background-color: #000;
    opacity: 0;
    bottom: 0;
    transition: opacity 0.5s ease-in-out;
  }

  &.has-camera {
    video {
      opacity: 1;
    }
  }
}
</style>
