<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { AICallAgentType, AICallState } from 'aliyun-auikit-aicall'
import logger from '../common/logger'
import Icons from './Icons.vue'
import useCallStore from './store'
import { useController } from './hooks/use-controller'

export default defineComponent({
  name: 'CallHeader',
  components: {
    Icons,
  },
  setup() {
    const { controllerRef: controller } = useController()

    const {
      agentType,
      callState,
      enableVoiceInterrupt,
      updatingVoiceInterrupt,
      voiceId,
      updatingVoiceId,
      enablePushToTalk,
      updatingPushToTalk,
    } = storeToRefs(useCallStore())

    const settingVisible = ref(false)
    const talkMode = computed(() =>
      enablePushToTalk.value ? 'pushToTalk' : 'normal',
    )

    const openSetting = () => {
      logger.info('Header', 'OpenSetting')
      settingVisible.value = true
    }

    const closeSetting = () => {
      settingVisible.value = false
    }

    const onVoiceInterruptChange = async (checked: boolean) => {
      const original = enableVoiceInterrupt.value
      enableVoiceInterrupt.value = checked
      updatingVoiceInterrupt.value = true

      let updated = false
      if (controller) {
        updated = await controller.value.enableVoiceInterrupt(checked)
      }

      if (updated) {
        ElMessage.success(`智能打断成功已${checked ? '开启' : '关闭'}`)
      }

      enableVoiceInterrupt.value = updated ? checked : original
      updatingVoiceInterrupt.value = false
    }

    const onVoiceChange = async (_voiceId: string) => {
      const original = voiceId.value
      voiceId.value = _voiceId
      updatingVoiceId.value = true

      let updated = false
      if (controller) {
        updated = await controller.value.switchVoiceId(_voiceId)
      }

      if (updated) {
        ElMessage.success('音色切换成功')
      }

      voiceId.value = updated ? _voiceId : original
      updatingVoiceId.value = false
    }

    const onPushToTalkChange = async (value: string) => {
      const checked = value === 'pushToTalk'
      const original = enablePushToTalk.value
      enablePushToTalk.value = checked
      updatingPushToTalk.value = true

      let updated = false
      if (controller) {
        updated = await controller.value.enablePushToTalk(checked)
      }

      if (updated) {
        ElMessage.success(`对讲机模式已${checked ? '开启' : '关闭'}`)
      }
      else {
        ElMessage.error('对讲机模式切换失败')
      }

      // 退出对讲机模式，恢复音频静音状态
      if (!checked && controller) {
        // 在实际应用中，应该从store中获取microphoneMuted状态
        // const microphoneMuted = getMicrophoneMuted();
        // controller.muteMicrophone(microphoneMuted);
      }

      enablePushToTalk.value = updated ? checked : original
      updatingPushToTalk.value = false
    }

    const getVoiceIconName = (index: number) => {
      const iconNames = ['VoiceOneSVG', 'VoiceTwoSVG', 'VoiceThreeSVG']
      return iconNames[index % 3]
    }

    const agentName = computed(() => {
      if (agentType.value === AICallAgentType.AvatarAgent) {
        return '数字人通话'
      }
      else if (agentType.value === AICallAgentType.VisionAgent) {
        return '视觉理解通话'
      }
      return '语音通话'
    })

    return {
      controller,
      agentType,
      callState,
      enableVoiceInterrupt,
      updatingVoiceInterrupt,
      voiceId,
      updatingVoiceId,
      enablePushToTalk,
      updatingPushToTalk,
      settingVisible,
      talkMode,
      openSetting,
      closeSetting,
      onVoiceInterruptChange,
      onVoiceChange,
      onPushToTalkChange,
      getVoiceIconName,
      agentName,
      AICallAgentType,
      AICallState,
    }
  },
})
</script>

<template>
  <div class="call-header">
    {{ agentName }}
    <el-button
      :disabled="callState !== AICallState.Connected"
      @click="openSetting"
    >
      <Icons name="SettingSVG" />
    </el-button>

    <van-popup
      v-if="false"
      v-model:show="settingVisible"
      class="header-pop setting-pop"
      position="bottom"
      @click-overlay="closeSetting"
    >
      <div class="_title">
        设置
      </div>
      <ul>
        <li class="_mode">
          <van-radio-group v-model="talkMode" @change="onPushToTalkChange">
            <van-cell-group>
              <van-cell
                title="自然对话模式"
                clickable
                @click="talkMode = 'normal'"
              >
                <template #right-icon>
                  <van-radio name="normal" />
                </template>
              </van-cell>
              <van-cell
                title="对讲机模式"
                clickable
                @click="talkMode = 'pushToTalk'"
              >
                <template #right-icon>
                  <van-radio name="pushToTalk" />
                </template>
              </van-cell>
            </van-cell-group>
          </van-radio-group>
        </li>
        <li v-if="!enablePushToTalk && !updatingPushToTalk">
          <div class="_itemBox">
            <div class="_itemInfo">
              <div class="_itemTitle">
                智能打断
              </div>
              <div class="_itemDesc">
                根据声音和环境智能打断AI机器人
              </div>
            </div>
            <div class="_itemSwitch">
              <van-switch
                v-model="enableVoiceInterrupt"
                :loading="updatingVoiceInterrupt"
                @change="onVoiceInterruptChange"
              />
            </div>
          </div>
        </li>
        <li
          v-if="
            agentType !== AICallAgentType.AvatarAgent
              && !controller?.config.fromShare
              && (controller?.config.agentVoiceIdList.length || 0) > 0
          "
          class="_voiceId"
        >
          <div class="_itemBox">
            <div class="_itemInfo">
              <div class="_itemTitle">
                选择音色
              </div>
              <div class="_itemDesc">
                切换音色后，AI将在下一次回答中使用新的角色
              </div>
            </div>
          </div>
          <van-radio-group
            v-model="voiceId"
            :disabled="updatingVoiceId"
            @change="onVoiceChange"
          >
            <div v-for="(voice, index) in (controller?.config.agentVoiceIdList || [])" :key="voice">
              <van-cell clickable @click="voiceId = voice">
                <template #icon>
                  <Icons :name="getVoiceIconName(index)" class="_voiceIcon" />
                </template>
                <template #title>
                  <span class="_voiceName">{{ voice }}</span>
                </template>
                <template #right-icon>
                  <van-radio :name="voice" />
                </template>
              </van-cell>
            </div>
          </van-radio-group>
        </li>
      </ul>
    </van-popup>
  </div>
</template>

<style lang="scss">
.call-header {
  position: relative;
  z-index: 4;
  background-color: #fff;

  display: flex;
  align-items: center;
  justify-content: center;

  height: 44px;
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  text-align: center;

  .el-button {
    position: absolute;
    height: 40px;
    width: 40px;
    top: 2px;
    right: 10px;
    border-width: 0;
    padding: 10px 5px;
    outline: none;
    &::before {
      border-width: 0;
    }

    & > span {
      display: inline-block;
      width: 22px;
      height: 20px;
    }
    svg {
      vertical-align: top;
    }

    &._feedback {
      right: auto;
      left: 10px;
      width: auto;
      svg {
        vertical-align: -2px;
      }
      & > span {
        font-size: 12px;
        line-height: 20px;
        vertical-align: top;
        width: auto;
        white-space: nowrap;
      }
    }
  }
}

.header-pop {
  --adm-color-primary: #624aff;
  .adm-popup-body {
    background: #f5f5fa;
  }

  ._title {
    font-size: 14px;
    line-height: 22px;
    text-align: center;
    color: #26244c;
    padding: 12px 0;
    border-bottom: 1px solid #e7e8ee;
  }
}

.setting-pop {
  ul {
    list-style: none;
    padding: 4px 0 10px;
    max-height: 300px;
    max-height: 50vh;
    overflow-y: auto;
  }
  li {
    padding: 0 20px;
  }

  ._itemBox {
    padding: 16px 0;
    display: flex;
    align-items: center;
  }
  ._itemInfo {
    flex: 1;
  }
  ._itemTitle {
    font-size: 14px;
    line-height: 22px;
    color: #26244c;
  }

  ._itemDesc {
    margin-top: 4px;
    font-size: 10px;
    line-height: 16px;
    color: #747a8c;
  }

  ._itemSwitch .adm-switch {
    --width: 36px;
    --height: 18px;
    .adm-switch-handle {
      background: #747a8c;
      box-shadow: none;
    }
    &.adm-switch-checked {
      .adm-switch-handle {
        background: var(--adm-color-text-light-solid);
      }
    }
  }

  ._mode {
    .adm-selector {
      .adm-space {
        width: 100%;
      }
      .adm-space-item {
        flex: 1 1 0;
      }
      .adm-selector-item {
        width: 100%;
        padding: 16px;
        box-sizing: border-box;
        background: #f6f5ff;
        border: 1px solid #d8d9e6;
        border-radius: 8px;
        font-size: 12px;
        line-height: 18px;
        color: #26244c;

        &.adm-selector-item-active {
          border: 1px solid var(--adm-color-primary);
          .adm-selector-check-mark-wrapper {
            display: none;
          }
        }
      }
    }
  }

  ._voiceId {
    .adm-radio-content {
      width: 100%;
      display: flex;
      align-items: center;
      font-size: 12px;
      line-height: 18px;
      color: #26244c;
      padding-left: 0;
      &::after {
        content: '使用';
        border: 1px solid #b2b7c4;
        font-size: 12px;
        line-height: 18px;
        color: #26244c;
        padding: 2px 12px;
        border-radius: 12px;
      }
    }
    .adm-radio-icon {
      display: none;
    }
    .adm-space-vertical > .adm-space-item {
      margin-bottom: 16px;
    }
    .adm-radio {
      width: 100%;
    }
    .adm-radio-checked .adm-radio-content {
      &::after {
        content: ' ';
        border: none;
        display: inline-block;
        width: 16px;
        height: 16px;
        padding: 0;
        background-repeat: no-repeat;
        margin-right: 17px;
        background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIGZpbGw9Im5vbmUiIHZlcnNpb249IjEuMSIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEyIiB2aWV3Qm94PSIwIDAgMTIgMTIiPgogIDxnPgogICAgPGc+CiAgICAgIDxwYXRoIGQ9Ik0wLC05LjA5NDk0NzAxNzcyOTI4MmUtMTNMMS43MDkyMiwtOS4wOTQ5NDcwMTc3MjkyODJlLTEzTDEuNzA5MjIsMTEuOTYwNDk5OTk5OTk5MDlMMCwxMS45NjA0OTk5OTk5OTkwOUwwLC05LjA5NDk0NzAxNzcyOTI4MmUtMTNaIiBmaWxsPSIjNERDRkUxIiBmaWxsLW9wYWNpdHk9IjEiLz4KICAgIDwvZz4KICAgIDxnPgogICAgICA8cGF0aCBkPSJNMy40MzAyODY4ODQzMDc4NjEzLDUuOTI5NzI4MDMxMTU4NDQ3TDUuMTM5NTA2ODg0MzA3ODYxNSw1LjkyOTcyODAzMTE1ODQ0N0w1LjEzOTUwNjg4NDMwNzg2MTUsMTEuOTA5OTc4MDMxMTU4NDQ3TDMuNDMwMjg2ODg0MzA3ODYxMywxMS45MDk5NzgwMzExNTg0NDdMMy40MzAyODY4ODQzMDc4NjEzLDUuOTI5NzI4MDMxMTU4NDQ3WiIgZmlsbD0iIzREQ0ZFMSIgZmlsbC1vcGFjaXR5PSIxIi8+CiAgICA8L2c+CiAgICA8Zz4KICAgICAgPHBhdGggZD0iTTYuODYwNTEyMjU2NjIyMzE0NSwyLjM1MTQ1NTQ1MDA1Nzk4MzRMOC41Njk3MzIyNTY2MjIzMTUsMi4zNTE0NTU0NTAwNTc5ODM0TDguNTY5NzMyMjU2NjIyMzE1LDExLjk3NTc1NTQ1MDA1Nzk4M0w2Ljg2MDUxMjI1NjYyMjMxNDUsMTEuOTc1NzU1NDUwMDU3OTgzTDYuODYwNTEyMjU2NjIyMzE0NSwyLjM1MTQ1NTQ1MDA1Nzk4MzRaIiBmaWxsPSIjNERDRkUxIiBmaWxsLW9wYWNpdHk9IjEiLz4KICAgIDwvZz4KICAgIDxnPgogICAgICA8cGF0aCBkPSJNMTAuMjkwNzgzODgyMTQxMTEzLDQuODA1MTM1MjUwMDkxNTUzTDEyLjAwMDAwMzg4MjE0MTExMyw0LjgwNTEzNTI1MDA5MTU1M0wxMi4wMDAwMDM4ODIxNDExMTMsMTEuOTk5OTk1MjUwMDkxNTUzTDEwLjI5MDc4Mzg4MjE0MTExMywxMS45OTk5OTUyNTAwOTE1NTNMMTAuMjkwNzgzODgyMTQxMTEzLDQuODA1MTM1MjUwMDkxNTUzWiIgZmlsbD0iIzREQ0ZFMSIgZmlsbC1vcGFjaXR5PSIxIi8+CiAgICA8L2c+CiAgPC9nPgo8L3N2Zz4=');
        border-radius: 0;
      }
    }
  }

  ._voiceIcon {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    margin-right: 12px;
  }
  ._voiceName {
    flex: 1;
  }
}

.safe-area-top {
  height: var(--van-safe-area-top, 44px);
}

.safe-area-bottom {
  height: var(--van-safe-area-bottom, 34px);
}
</style>
