<script lang="ts">
  import { defineComponent, inject, ref } from 'vue';
  import { useChatStore } from './store';
  import { ElPopover, ElRadioGroup, ElRadio } from 'element-plus';
  import { backSVG, settingSVG } from './Icons';
  import { VoiceOneSVG, VoiceTwoSVG, VoiceThreeSVG } from '../Call/Icons';
  import { ChatEngineKey } from './provider';

  export default defineComponent({
    name: 'Header',
    emits: ['back'],
    setup(_, { emit }) {
      const chatStore = useChatStore();
      const chatEngine = inject(ChatEngineKey);

      const settingVisible = ref(false);

      const handleBack = () => {
        emit('back');
      };

      const handleVoiceChange = (value: string) => {
        if (value) {
          chatStore.setState({ voiceId: value });
        }
      };

      return {
        chatStore,
        settingVisible,
        handleBack,
        handleVoiceChange,
        backSVG,
        settingSVG,
        VoiceOneSVG,
        VoiceTwoSVG,
        VoiceThreeSVG,
      };
    },
  });
</script>

<template>
  <div class="chat-header">
    <button class="back-btn" @click="handleBack" v-html="backSVG"></button>
    <img
      src="https://img.alicdn.com/imgextra/i4/O1CN01fcswVF24BjIbLhA3C_!!6000000007353-2-tps-84-84.png"
      width="28"
      height="28"
      alt=""
    />
    <div class="title">小云</div>
    <div class="gap"></div>
    <el-popover
      v-model:visible="settingVisible"
      :disabled="chatStore.voiceIdList.length === 0"
      placement="bottom"
      width="300"
      trigger="click"
    >
      <template #reference>
        <button
          class="setting-btn"
          :disabled="chatStore.voiceIdList.length === 0"
          v-html="settingSVG"
        ></button>
      </template>

      <template #default>
        <div class="setting-content">
          <div class="title">设置</div>
          <ul>
            <li v-if="chatStore.voiceIdList.length > 0" class="voiceId">
              <div class="item-box">
                <div class="item-info">
                  <div class="item-title">选择音色</div>
                  <div class="item-desc">
                    切换音色后，AI将在下一次回答中使用新的音色
                  </div>
                </div>
              </div>
              <el-radio-group
                v-model="chatStore.voiceId"
                @change="handleVoiceChange"
                class="voice-list"
              >
                <el-radio
                  v-for="(voiceId, index) in chatStore.voiceIdList"
                  :key="voiceId"
                  :label="voiceId"
                >
                  <span
                    class="voice-icon"
                    v-html="
                      [VoiceOneSVG, VoiceTwoSVG, VoiceThreeSVG][index % 3]
                    "
                  ></span>
                  <span class="voice-name">{{ voiceId }}</span>
                </el-radio>
              </el-radio-group>
            </li>
          </ul>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<style lang="scss" scoped>
  .chat-header {
    display: flex;
    height: 44px;
    padding: 0 10px;
    align-items: center;
    background-color: #ffffff;

    .back-btn,
    .setting-btn {
      margin: 6px;
      width: 26px;
      height: 26px;
      line-height: 26px;
      padding: 0;
      border: none;
      background-color: transparent;
      cursor: pointer;

      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      svg {
        vertical-align: bottom;
      }
    }

    .title {
      margin-left: 8px;
      font-size: 14px;
      font-weight: 500;
      line-height: 24px;
      color: #2c2c36;
    }

    .gap {
      flex: 1;
    }
  }

  .setting-content {
    padding: 16px 0;

    .title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
      padding: 0 16px;
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .voiceId {
      padding: 0 16px;

      .item-box {
        margin-bottom: 12px;
      }

      .item-title {
        font-size: 14px;
        font-weight: 500;
        color: #2c2c36;
      }

      .item-desc {
        font-size: 12px;
        color: #86868b;
        margin-top: 4px;
      }

      .voice-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .voice-icon {
        margin-right: 8px;
        display: inline-flex;
        align-items: center;
      }

      .voice-name {
        font-size: 14px;
      }
    }
  }
</style>
