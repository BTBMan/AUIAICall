<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { AICallAgentType } from 'aliyun-auikit-aicall'
import Icons from './Icons.vue'
import useCallStore from './store'

export default defineComponent({
  name: 'Subtitle',
  components: {
    Icons,
  },
  setup() {
    const { currentSubtitle, agentType, cameraMuted } = storeToRefs(useCallStore())
    const detailVisible = ref(false)
    const isExpanded = ref(false)
    const isTextOverflow = ref(false)

    const rows = computed(() =>
      agentType.value === AICallAgentType.VisionAgent && cameraMuted.value
        ? 12
        : 4,
    )

    const onExpand = () => {
      isExpanded.value = true
      detailVisible.value = true
    }

    const setDetailVisible = (visible: boolean) => {
      detailVisible.value = visible
      if (!visible) {
        isExpanded.value = false
      }
    }

    onMounted(() => {
      // 检测文本是否超出显示范围
      setTimeout(() => {
        isTextOverflow.value = true // 简化实现，实际应该检测文本是否溢出
      }, 100)
    })

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
    }
  },
})
</script>

<template>
  <div
    v-if="currentSubtitle && currentSubtitle.data.text"
    class="subtitle"
    @click.stop
  >
    <div class="_source">
      <div v-if="currentSubtitle.source === 'agent'" class="_agent-icon" />
      <Icons v-else name="UserSVG" />
    </div>
    <div class="_text" @click="onExpand">
      <div class="text-content">
        <!-- v-if="!isExpanded"
          class="ellipsis-text"
          :style="{ '-webkit-line-clamp': rows }" -->
        <div>
          {{ currentSubtitle.data.text }}
        </div>
        <!-- <div v-else>
          {{ currentSubtitle.data.text }}
        </div> -->
      </div>
      <!-- <span
        v-if="!isExpanded && isTextOverflow"
        class="_more"
        @click.stop="onExpand"
      >
        <Icons name="SubtitleMoreSVG" />
      </span> -->
    </div>

    <van-overlay
      v-if="false"
      :show="detailVisible"
      :custom-style="{ background: 'rgba(0, 0, 0, 0.7)' }"
      @click="setDetailVisible(false)"
    >
      <div class="_detail">
        <div class="_detail-close">
          <el-button @click="setDetailVisible(false)">
            <Icons name="MaskCloseSVG" />
          </el-button>
        </div>
        {{ currentSubtitle.data.text }}
      </div>
    </van-overlay>
  </div>
</template>

<style lang="scss">
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
  .el-button {
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
