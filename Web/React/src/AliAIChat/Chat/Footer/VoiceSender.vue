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
  import { ChatEngineKey } from '../provider';
  import { useChatStore } from '../store';
  import { interruptSVG, keyboardSVG } from '../Icons';
  import { AIChatMessageState } from 'aliyun-auikit-aicall';
  import { ElMessage } from 'element-plus';
  import { UploaderRef, AfterSendCallback } from './types';

  // 平滑音频数据函数
  function smoothData(data: Uint8Array) {
    const smoothingFactor = 0.8;
    let previousValue = data[0];
    return data.map((value) => {
      const smoothedValue =
        previousValue * smoothingFactor + value * (1 - smoothingFactor);
      previousValue = smoothedValue;
      return smoothedValue;
    });
  }

  const MAX_TIME_IN_SECONDS = 60 * 3; // 最大录音时间3分钟

  export default defineComponent({
    name: 'VoiceSender',
    props: {
      uploaderRef: {
        type: Object as () => UploaderRef,
        required: true,
      },
      afterSend: {
        type: Function as () => AfterSendCallback,
        default: () => (success: boolean) => {},
      },
    },
    emits: ['type-change'],
    setup(props, { emit }) {
      const chatStore = useChatStore();
      const chatEngine = inject(ChatEngineKey);

      // 语音录制相关状态
      const pushing = ref(false);
      const willCancel = ref(false);
      const timeString = ref('0"');
      const buttonRef = ref<HTMLButtonElement | null>(null);
      const visualizerRef = ref<HTMLUListElement | null>(null);

      // 语音录制相关引用变量
      const startYRef = ref(0);
      const isPushingRef = ref(false);
      const willCancelRef = ref(false);
      const timerRef = ref<number>(0);
      const startTimeRef = ref(0);

      // 从store获取当前消息和附件信息
      const currentMessage = computed(() => chatStore.currentMessage);
      const attachmentCanSend = computed(() => chatStore.attachmentCanSend);

      // 判断是否在响应中
      const isAgentResponding = computed(() => {
        return (
          currentMessage.value?.message.messageState ===
          AIChatMessageState.Printing
        );
      });

      // 监听willCancel变化
      watch(willCancel, (val) => {
        willCancelRef.value = val;
      });

      // 设置willCancel状态
      const setWillCancel = (value: boolean) => {
        willCancel.value = value;
      };

      // 按下开始录音处理
      const onStart = async (clientY: number) => {
        if (!chatEngine.value) return;

        startYRef.value = clientY;
        setWillCancel(false);
        pushing.value = true;
        timeString.value = '0"';
        isPushingRef.value = true;

        const msg = await chatEngine.value.startPushVoiceMessage(
          props.uploaderRef.value || undefined,
        );

        if (!msg) return;

        const stream = chatEngine.value.currentRecordStream;
        if (stream) {
          startTimeRef.value = Date.now();
          timerRef.value = window.setInterval(() => {
            const seconds = Math.floor(
              (Date.now() - startTimeRef.value) / 1000,
            );
            if (seconds >= MAX_TIME_IN_SECONDS) {
              willCancelRef.value = true;
              onEnd();
            }
            timeString.value = `${seconds}"`;
          }, 1000);

          const audioContext =
            chatEngine.value.audioContext ||
            new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(stream);

          // 设置音频分析
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          source.connect(analyser);

          // 绘制音频可视化
          function draw() {
            requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            const smoothedData = smoothData(dataArray);

            visualizerRef.value
              ?.querySelectorAll('li')
              .forEach((bar, index) => {
                const barHeight = (smoothedData[index] / 255) * 8 + 4;
                bar.style.height = `${barHeight}px`;
              });
          }

          draw();
        }
      };

      // 结束录音处理
      const onEnd = async () => {
        if (!chatEngine.value) return;

        pushing.value = false;
        timeString.value = '0"';

        if (timerRef.value) {
          clearInterval(timerRef.value);
        }

        if (!isPushingRef.value) {
          return;
        }

        isPushingRef.value = false;

        if (!willCancelRef.value) {
          try {
            const message = await chatEngine.value.finishPushVoiceMessage();
            props.afterSend(true);
            if (!message?.text) {
              ElMessage.warning('未识别到文字');
              return;
            }
            chatStore.sendMessage(message);
          } catch (error) {
            props.afterSend(false);
          }
        } else {
          chatEngine.value.cancelPushVoiceMessage();
        }
      };

      // 移动处理（检测是否取消）
      const onMove = (clientY: number) => {
        if (clientY === -1) {
          willCancel.value = true;
        }

        if (startYRef.value === 0 && clientY) {
          startYRef.value = clientY;
        } else {
          if (
            !willCancelRef.value &&
            Math.abs(clientY - startYRef.value) > 40
          ) {
            willCancel.value = true;
          }
        }
      };

      // 触摸和鼠标事件处理
      onMounted(() => {
        const element = buttonRef.value;
        const isTouchSupported = 'ontouchstart' in window;

        // 触摸事件处理
        const onTouchStart = (e: TouchEvent) => {
          const target = e.currentTarget as HTMLButtonElement;
          if (target.disabled) {
            if (!attachmentCanSend.value) {
              ElMessage.warning('部分图片上传中或上传失败');
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
              ElMessage.warning('部分图片上传中或上传失败');
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

        // 注册事件监听
        if (isTouchSupported) {
          element?.addEventListener('touchstart', onTouchStart);
          element?.addEventListener('touchend', onEnd);
          element?.addEventListener('touchmove', onTouchMove);
        } else {
          element?.addEventListener('mousedown', onMouseDown);
          document?.addEventListener('mouseup', onEnd);
          element?.addEventListener('mouseleave', onMouseLeave);
          element?.addEventListener('mousemove', onMouseMove);
        }

        // 清理函数
        onUnmounted(() => {
          clearInterval(timerRef.value);

          if (isTouchSupported) {
            element?.removeEventListener('touchstart', onTouchStart);
            element?.removeEventListener('touchend', onEnd);
            element?.removeEventListener('touchmove', onTouchMove);
          } else {
            element?.removeEventListener('mousedown', onMouseDown);
            document?.removeEventListener('mouseup', onEnd);
            element?.removeEventListener('mouseleave', onMouseLeave);
            element?.removeEventListener('mousemove', onMouseMove);
          }
        });
      });

      // 中断AI响应
      const interruptMessage = async () => {
        if (!chatEngine.value) return;

        try {
          await chatEngine.value.interruptAgentResponse();
          chatStore.interruptAgent();
        } catch (error) {
          console.error(error);
        }
      };

      // 切换到文本模式
      const toText = () => {
        emit('type-change', 'text');
      };

      return {
        pushing,
        willCancel,
        timeString,
        buttonRef,
        visualizerRef,
        isAgentResponding,
        attachmentCanSend,
        interruptMessage,
        toText,
        interruptSVG,
        keyboardSVG,
        AIChatMessageState,
      };
    },
  });
</script>

<template>
  <div :class="['_send-voice', pushing ? 'is-pushing' : '']">
    <el-button
      class="_push-btn"
      ref="buttonRef"
      :disabled="isAgentResponding || !attachmentCanSend"
    >
      按住说话
    </el-button>

    <el-button
      v-if="isAgentResponding"
      class="_action-btn"
      @click="interruptMessage"
      v-html="interruptSVG"
    />
    <el-button
      v-else
      class="_action-btn is-text"
      @click="toText"
      v-html="keyboardSVG"
    />

    <div class="_pushing">
      <div class="_pushing-content">
        <div :class="['_tip', willCancel ? 'is-will-cancel' : '']">
          {{ willCancel ? '松开发送，上滑取消' : '松开结束' }}
        </div>
        <div :class="['_recording-status', willCancel ? 'is-will-cancel' : '']">
          <div class="_time">{{ timeString }}</div>
          <ul ref="visualizerRef" class="_wave">
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
            <li></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  ._send-voice {
    flex: 1;
    display: flex;
    align-items: center;
    position: relative;

    ._push-btn {
      flex: 1;
      height: 40px;
      line-height: 38px;
      border-radius: 20px;
      padding: 0;
      margin-right: 10px;
      background: radial-gradient(
        58% 126% at 50% 90%,
        rgba(255, 255, 255, 0.6) 0%,
        #ffffff 100%
      );
      color: #26244c;
      border: 1px solid #ffffff;
      box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.05);

      &:disabled {
        opacity: 0.5;
      }
    }

    ._action-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      border: none;
      background-color: transparent;
      color: inherit;

      &.is-text {
        font-size: 1.2em;
      }
    }

    &.is-pushing {
      ._pushing {
        display: block;
      }
    }

    ._pushing {
      display: none;
      position: fixed;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.6);
      z-index: 999;

      ._pushing-content {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        width: 80%;
        max-width: 300px;

        ._tip {
          margin-bottom: 20px;
          color: #fff;
          font-size: 18px;

          &.is-will-cancel {
            color: #ff4d4f;
          }
        }

        ._recording-status {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 20px;

          &.is-will-cancel {
            background-color: rgba(255, 77, 79, 0.2);
          }

          ._time {
            color: #fff;
            font-size: 24px;
            margin-bottom: 20px;
          }

          ._wave {
            display: flex;
            align-items: flex-end;
            justify-content: center;
            height: 40px;
            margin: 0;
            padding: 0;
            list-style: none;

            li {
              flex: 1;
              background-color: #fff;
              margin: 0 2px;
              height: 4px;
              max-width: 6px;
              border-radius: 1px;
              transition: height 0.1s ease;
            }
          }
        }
      }
    }
  }
</style>
