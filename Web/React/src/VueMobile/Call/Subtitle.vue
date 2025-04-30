<template>
  <div
    class="subtitle"
    v-if="currentSubtitle && currentSubtitle.data.text"
    @click.stop
  >
    <div class="_source">
      <div v-if="currentSubtitle.source === 'agent'" class="_agent-icon"></div>
      <UserSVG v-else />
    </div>
    <div class="_text" @click="onExpand">
      <div class="text-content">
        <div
          v-if="!isExpanded"
          class="ellipsis-text"
          :style="{ '-webkit-line-clamp': rows }"
        >
          {{ currentSubtitle.data.text }}
        </div>
        <div v-else>
          {{ currentSubtitle.data.text }}
        </div>
      </div>
      <span
        v-if="!isExpanded && isTextOverflow"
        class="_more"
        @click.stop="onExpand"
      >
        <SubtitleMoreSVG />
      </span>
    </div>

    <van-overlay
      :show="detailVisible"
      @click="setDetailVisible(false)"
      :custom-style="{ background: 'rgba(0, 0, 0, 0.7)' }"
    >
      <div class="_detail">
        <div class="_detail-close">
          <van-button @click="setDetailVisible(false)">
            <MaskCloseSVG />
          </van-button>
        </div>
        {{ currentSubtitle.data.text }}
      </div>
    </van-overlay>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, onMounted } from 'vue';
  import { AICallAgentType } from 'aliyun-auikit-aicall';
  import { UserSVG, SubtitleMoreSVG, MaskCloseSVG } from './Icons';

  export default defineComponent({
    name: 'Subtitle',
    components: {
      UserSVG,
      SubtitleMoreSVG,
      MaskCloseSVG,
    },
    setup() {
      // 模拟数据，实际应从 store 中获取
      const currentSubtitle = ref({
        source: 'agent',
        data: {
          text: '这是一段字幕内容，可能会很长，需要进行省略显示，点击可以查看完整内容。这是一段字幕内容，可能会很长，需要进行省略显示，点击可以查看完整内容。',
        },
      });
      const agentType = ref(AICallAgentType.VoiceAgent);
      const cameraMuted = ref(false);
      const detailVisible = ref(false);
      const isExpanded = ref(false);
      const isTextOverflow = ref(false);

      const rows = computed(() =>
        agentType.value === AICallAgentType.VisionAgent && cameraMuted.value
          ? 12
          : 4,
      );

      const onExpand = () => {
        isExpanded.value = true;
        detailVisible.value = true;
      };

      const setDetailVisible = (visible: boolean) => {
        detailVisible.value = visible;
        if (!visible) {
          isExpanded.value = false;
        }
      };

      onMounted(() => {
        // 检测文本是否超出显示范围
        setTimeout(() => {
          isTextOverflow.value = true; // 简化实现，实际应该检测文本是否溢出
        }, 100);
      });

      return {
        currentSubtitle,
        agentType,
        cameraMuted,
        detailVisible,
        isExpanded,
        isTextOverflow,
        rows,
        onExpand,
        setDetailVisible,
      };
    },
  });
</script>

<style lang="less">
  .subtitle {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 4;
    display: flex;
    padding: 16px;
    margin: 0 32px;

    & ._source {
      width: 20px;
      margin: 0 4px;
    }

    ._agent-icon {
      margin-top: 4px;
      width: 20px;
      height: 30px;
      background-image: url(https://img.alicdn.com/imgextra/i1/O1CN01fLZLq91Wpr2yasQMB_!!6000000002838-2-tps-35-40.png);
      background-repeat: no-repeat;
      background-size: 17.5px 20px;
    }

    & ._text {
      flex: 1;
      margin-top: 2px;
      text-align: left;
      font-size: 12px;
      line-height: 18px;
      color: #26244c;
    }

    ._more {
      padding: 0 4px;
    }

    ._detail {
      color: #fff;
      font-size: 14px;
      line-height: 22px;
    }
  }

  .has-video .subtitle ._text {
    color: #747a8c;
  }

  .subtitle-mask {
    .adm-button {
      background: transparent;
      border: none;
      outline: none;
    }
    .adm-mask-content {
      max-height: 100%;
      overflow-y: auto;
      ._detail {
        margin: 50px 25px;
        color: #fff;
        font-size: 14px;
        line-height: 22px;
      }
      ._detail-close {
        text-align: right;
        margin-right: -10px;
      }
    }
  }

  .ellipsis-text {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
