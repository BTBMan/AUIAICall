<template>
  <div>
    <div class="safe-area-top"></div>
    <div class="header">
      {{ agentName }}
      <van-button
        @click="openSetting"
        :disabled="callState !== AICallState.Connected"
      >
        <SettingSVG />
      </van-button>

      <van-popup
        class="header-pop setting-pop"
        v-model:show="settingVisible"
        position="bottom"
        @click-overlay="closeSetting"
      >
        <div class="_title">设置</div>
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
                <div class="_itemTitle">智能打断</div>
                <div class="_itemDesc">根据声音和环境智能打断AI机器人</div>
              </div>
              <div class="_itemSwitch">
                <van-switch
                  v-model="enableVoiceInterruptLocal"
                  :loading="updatingVoiceInterrupt"
                  @change="onVoiceInterruptChange"
                />
              </div>
            </div>
          </li>
          <li
            v-if="
              agentType !== AICallAgentType.AvatarAgent &&
              !isFromShare &&
              voiceIdList.length > 0
            "
            class="_voiceId"
          >
            <div class="_itemBox">
              <div class="_itemInfo">
                <div class="_itemTitle">选择音色</div>
                <div class="_itemDesc">
                  切换音色后，AI将在下一次回答中使用新的角色
                </div>
              </div>
            </div>
            <van-radio-group
              v-model="voiceIdLocal"
              :disabled="updatingVoiceId"
              @change="onVoiceChange"
            >
              <div v-for="(voice, index) in voiceIdList" :key="voice">
                <van-cell clickable @click="voiceIdLocal = voice">
                  <template #icon>
                    <component :is="getVoiceIcon(index)" class="_voiceIcon" />
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
        <div class="safe-area-bottom"></div>
      </van-popup>
    </div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, computed, inject } from 'vue';
  import { Toast } from 'vant';
  import { AICallAgentType, AICallState } from 'aliyun-auikit-aicall';
  import { SettingSVG, VoiceOneSVG, VoiceTwoSVG, VoiceThreeSVG } from './Icons';
  import { ControllerContextKey } from './ControlerContext.vue';
  import i18n from '@/common/i18n';
  import { getRootElement } from '@/common/utils';
  import logger from '@/common/logger';

  export default defineComponent({
    name: 'CallHeader',
    components: {
      SettingSVG,
      VoiceOneSVG,
      VoiceTwoSVG,
      VoiceThreeSVG,
    },
    props: {
      title: {
        type: String,
        default: '',
      },
      customHeader: {
        type: Object,
        default: null,
      },
    },
    emits: ['exit'],
    setup(props, { emit }) {
      const controller = inject(ControllerContextKey);
      const agentType = ref(AICallAgentType.VoiceAgent); // 默认值，实际应该从controller获取
      const callState = ref(AICallState.Connected); // 默认值，实际应该从store获取
      const enableVoiceInterruptLocal = ref(true);
      const updatingVoiceInterrupt = ref(false);
      const voiceIdLocal = ref('');
      const updatingVoiceId = ref(false);
      const enablePushToTalk = ref(false);
      const updatingPushToTalk = ref(false);
      const settingVisible = ref(false);
      const talkMode = computed(() =>
        enablePushToTalk.value ? 'pushToTalk' : 'normal',
      );
      const isFromShare = ref(false); // 默认值，实际应该从controller获取
      const voiceIdList = ref(['voice1', 'voice2', 'voice3']); // 默认值，实际应该从controller获取

      const openSetting = () => {
        logger.info('Header', 'OpenSetting');
        settingVisible.value = true;
      };

      const closeSetting = () => {
        settingVisible.value = false;
      };

      const onVoiceInterruptChange = async (checked: boolean) => {
        const original = enableVoiceInterruptLocal.value;
        enableVoiceInterruptLocal.value = checked;
        updatingVoiceInterrupt.value = true;

        let updated = false;
        if (controller) {
          updated = await controller.enableVoiceInterrupt(checked);
        }

        if (updated) {
          Toast({
            message: `智能打断成功已${checked ? '开启' : '关闭'}`,
          });
        }

        enableVoiceInterruptLocal.value = updated ? checked : original;
        updatingVoiceInterrupt.value = false;
      };

      const onVoiceChange = async (voiceId: string) => {
        const original = voiceIdLocal.value;
        voiceIdLocal.value = voiceId;
        updatingVoiceId.value = true;

        let updated = false;
        if (controller) {
          updated = await controller.switchVoiceId(voiceId);
        }

        if (updated) {
          Toast({
            message: '音色切换成功',
          });
        }

        voiceIdLocal.value = updated ? voiceId : original;
        updatingVoiceId.value = false;
      };

      const onPushToTalkChange = async (value: string) => {
        const checked = value === 'pushToTalk';
        const original = enablePushToTalk.value;
        enablePushToTalk.value = checked;
        updatingPushToTalk.value = true;

        let updated = false;
        if (controller) {
          updated = await controller.enablePushToTalk(checked);
        }

        if (updated) {
          Toast({
            message: `对讲机模式已${checked ? '开启' : '关闭'}`,
          });
        } else {
          Toast({
            message: '对讲机模式切换失败',
          });
        }

        // 退出对讲机模式，恢复音频静音状态
        if (!checked && controller) {
          // 在实际应用中，应该从store中获取microphoneMuted状态
          // const microphoneMuted = getMicrophoneMuted();
          // controller.muteMicrophone(microphoneMuted);
        }

        enablePushToTalk.value = updated ? checked : original;
        updatingPushToTalk.value = false;
      };

      const getVoiceIcon = (index: number) => {
        const iconComponents = [VoiceOneSVG, VoiceTwoSVG, VoiceThreeSVG];
        return iconComponents[index % 3];
      };

      const agentName = computed(() => {
        if (agentType.value === AICallAgentType.AvatarAgent) {
          return i18n['agent.avatar'];
        } else if (agentType.value === AICallAgentType.VisionAgent) {
          return i18n['agent.vision'];
        }
        return i18n['agent.voice'];
      });

      return {
        agentType,
        callState,
        enableVoiceInterruptLocal,
        updatingVoiceInterrupt,
        voiceIdLocal,
        updatingVoiceId,
        enablePushToTalk,
        updatingPushToTalk,
        settingVisible,
        talkMode,
        voiceIdList,
        isFromShare,
        openSetting,
        closeSetting,
        onVoiceInterruptChange,
        onVoiceChange,
        onPushToTalkChange,
        getVoiceIcon,
        agentName,
        AICallAgentType,
        AICallState,
      };
    },
  });
</script>

<style lang="less">
  .header {
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

    .adm-button {
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
