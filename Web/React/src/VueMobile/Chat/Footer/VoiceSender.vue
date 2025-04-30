<template>
  <div :class="['_send-voice', pushing ? 'is-pushing' : '']">
    <van-button
      class="_push-btn"
      block
      ref="buttonRef"
      :disabled="
        currentMessage?.message.messageState === messageStates.Printing ||
        !attachmentCanSend
      "
    >
      按住说话
    </van-button>
    <van-button
      class="_action-btn"
      :class="{
        'is-text':
          currentMessage?.message.messageState !== messageStates.Printing,
      }"
      @click="actionBtnClick"
    >
      <InterruptSVG
        v-if="currentMessage?.message.messageState === messageStates.Printing"
      />
      <KeyboardSVG v-else />
    </van-button>
    <div class="_pushing">
      <div class="_pushing-content">
        <div :class="['_tip', willCancel ? 'is-will-cancel' : '']">
          {{ willCancel ? '松开发送，上滑取消' : '松开结束' }}
        </div>
        <div :class="['_recording-status', willCancel ? 'is-will-cancel' : '']">
          <div class="_time">{{ timeString }}</div>
          <ul ref="visualizerRef" class="_wave">
            <li v-for="n in 14" :key="n"></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    onMounted,
    onUnmounted,
    computed,
    inject,
  } from 'vue';
  import { Toast } from 'vant';
  import {
    AIChatMessageState,
    AIChatAttachmentUploader,
  } from 'aliyun-auikit-aicall';
  import { ChatEngineContextKey } from '../ChatEngineContext.vue';
  import { useChatModel } from '../store';
  import { InterruptSVG, KeyboardSVG } from '../Icons';

  // 平滑音频数据
  const smoothData = (data: Uint8Array) => {
    const smoothingFactor = 0.8;
    let previousValue = data[0];
    return data.map((value) => {
      const smoothedValue =
        previousValue * smoothingFactor + value * (1 - smoothingFactor);
      previousValue = smoothedValue;
      return smoothedValue;
    });
  };

  const MAX_TIME_IN_SECONDS = 60 * 3;

  export default defineComponent({
    name: 'VoiceSender',
    components: {
      InterruptSVG,
      KeyboardSVG,
    },
    props: {
      uploader: {
        type: Object as () => AIChatAttachmentUploader | undefined,
        default: undefined,
      },
      onTypeChange: {
        type: Function as () => (type: 'text' | 'voice') => void,
        required: true,
      },
      afterSend: {
        type: Function as () => (success: boolean) => void,
        default: undefined,
      },
    },
    setup(props) {
      const engine = inject(ChatEngineContextKey);
      const messageStates = AIChatMessageState;
      const {
        currentMessage,
        attachmentCanSend,
        sendMessage: storeSendMessage,
        interruptAgent,
      } = useChatModel();

      const buttonRef = ref<HTMLButtonElement | null>(null);
      const visualizerRef = ref<HTMLUListElement | null>(null);
      const pushing = ref(false);
      const willCancel = ref(false);
      const timeString = ref('0"');
      const startY = ref(0);
      const isPushing = ref(false);
      const timer = ref<number | null>(null);
      const startTime = ref(0);

      // 开始录音
      const onStart = async (clientY: number) => {
        startY.value = clientY;
        willCancel.value = false;
        pushing.value = true;
        timeString.value = '0"';
        isPushing.value = true;

        try {
          const msg = await engine?.startPushVoiceMessage(props.uploader);
          if (!msg) return;

          const stream = engine?.currentRecordStream;
          if (stream) {
            startTime.value = Date.now();
            timer.value = window.setInterval(() => {
              const seconds = Math.floor((Date.now() - startTime.value) / 1000);
              if (seconds >= MAX_TIME_IN_SECONDS) {
                willCancel.value = true;
                onEnd();
              }
              timeString.value = `${seconds}"`;
            }, 1000);

            // 创建音频分析器
            const audioContext =
              engine?.audioContext ||
              new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            source.connect(analyser);

            // 绘制音频波形
            function draw() {
              requestAnimationFrame(draw);
              analyser.getByteFrequencyData(dataArray);

              const smoothedData = smoothData(dataArray);

              visualizerRef.value
                ?.querySelectorAll('li')
                .forEach((bar, index) => {
                  const barHeight = (smoothedData[index] / 255) * 8 + 4;
                  (bar as HTMLElement).style.height = `${barHeight}px`;
                });
            }

            draw();
          }
        } catch (error) {
          console.error('启动语音消息失败:', error);
          Toast({
            message: '无法启动麦克风，请检查权限设置',
            position: 'bottom',
          });
          pushing.value = false;
        }
      };

      // 结束录音
      const onEnd = async () => {
        pushing.value = false;
        timeString.value = '0"';
        if (timer.value) {
          clearInterval(timer.value);
          timer.value = null;
        }

        if (!isPushing.value) {
          return;
        }

        isPushing.value = false;
        if (!willCancel.value) {
          try {
            const message = await engine?.finishPushVoiceMessage();
            props.afterSend?.(true);
            if (!message?.text) {
              Toast({
                message: '未识别到文字',
                position: 'bottom',
              });
              return;
            }
            storeSendMessage(message);
          } catch (error) {
            console.error('结束语音消息失败:', error);
            props.afterSend?.(false);
          }
        } else {
          engine?.cancelPushVoiceMessage();
        }
      };

      // 移动处理
      const onMove = (clientY: number) => {
        if (clientY === -1) {
          willCancel.value = true;
          return;
        }

        if (startY.value === 0 && clientY) {
          startY.value = clientY;
        } else {
          if (!willCancel.value && Math.abs(clientY - startY.value) > 40) {
            willCancel.value = true;
          }
        }
      };

      onMounted(() => {
        const element = buttonRef.value;
        const isTouchSupported = 'ontouchstart' in window;

        // 触摸事件处理
        const onTouchStart = (e: TouchEvent) => {
          const target = e.currentTarget as HTMLButtonElement;
          if (target.disabled) {
            if (!attachmentCanSend.value) {
              Toast({
                message: '部分图片上传中或上传失败',
                position: 'bottom',
              });
            }
            return;
          }
          const y = e.touches[0].clientY || 0;
          onStart(y);
        };

        const onTouchMove = (e: TouchEvent) => {
          e.preventDefault();
          const y = e.touches[0].clientY || 0;
          onMove(y);
        };

        // 鼠标事件处理
        const onMouseDown = (e: MouseEvent) => {
          const target = e.currentTarget as HTMLButtonElement;
          if (target.disabled) {
            if (!attachmentCanSend.value) {
              Toast({
                message: '部分图片上传中或上传失败',
                position: 'bottom',
              });
            }
            return;
          }
          const y = e.clientY || 0;
          onStart(y);
        };

        const onMouseMove = (e: MouseEvent) => {
          e.preventDefault();
          const y = e.clientY || 0;
          onMove(y);
        };

        const onMouseLeave = () => {
          onMove(-1);
        };

        // 添加事件监听
        if (isTouchSupported) {
          element?.addEventListener('touchstart', onTouchStart);
          element?.addEventListener('touchend', onEnd);
          element?.addEventListener('touchmove', onTouchMove);
        } else {
          element?.addEventListener('mousedown', onMouseDown);
          document.addEventListener('mouseup', onEnd);
          element?.addEventListener('mouseleave', onMouseLeave);
          element?.addEventListener('mousemove', onMouseMove);
        }

        // 组件销毁时清理
        onUnmounted(() => {
          if (timer.value) {
            clearInterval(timer.value);
            timer.value = null;
          }

          if (isTouchSupported) {
            element?.removeEventListener('touchstart', onTouchStart);
            element?.removeEventListener('touchend', onEnd);
            element?.removeEventListener('touchmove', onTouchMove);
          } else {
            element?.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onEnd);
            element?.removeEventListener('mouseleave', onMouseLeave);
            element?.removeEventListener('mousemove', onMouseMove);
          }
        });
      });

      // 中断消息处理
      const interruptMessage = async () => {
        try {
          await engine?.interruptAgentResponse();
          interruptAgent();
        } catch (error) {
          console.error('中断消息失败:', error);
        }
      };

      // 切换到文本输入模式
      const toText = () => {
        props.onTypeChange('text');
      };

      // 动态计算操作按钮点击事件
      const actionBtnClick = computed(() => {
        return currentMessage.value?.message.messageState ===
          AIChatMessageState.Printing
          ? interruptMessage
          : toText;
      });

      return {
        buttonRef,
        visualizerRef,
        pushing,
        willCancel,
        timeString,
        messageStates,
        currentMessage,
        attachmentCanSend,
        actionBtnClick,
        interruptMessage,
        toText,
      };
    },
  });
</script>

<style scoped>
  ._send-voice {
    display: flex;
    align-items: center;
    padding: 10px;
    position: relative;
  }

  ._push-btn {
    flex: 1;
    height: 40px;
    border-radius: 20px;
    background-color: #f5f5f5;
    color: #333;
    font-size: 16px;
  }

  ._action-btn {
    margin-left: 10px;
    width: 40px;
    height: 40px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  ._pushing {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .is-pushing ._pushing {
    display: flex;
  }

  ._pushing-content {
    width: 70%;
    background-color: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  ._tip {
    font-size: 16px;
    margin-bottom: 20px;
    color: #333;
  }

  ._tip.is-will-cancel {
    color: #ff4d4f;
  }

  ._recording-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  ._time {
    font-size: 24px;
    margin-bottom: 10px;
    color: #333;
  }

  ._wave {
    display: flex;
    align-items: flex-end;
    height: 60px;
    width: 100%;
    padding: 0;
    margin: 0;
    list-style: none;
  }

  ._wave li {
    flex: 1;
    background-color: #2979ff;
    margin: 0 2px;
    height: 4px;
    border-radius: 2px;
    transition: height 0.1s ease;
  }

  ._recording-status.is-will-cancel ._wave li {
    background-color: #ff4d4f;
  }
</style>
