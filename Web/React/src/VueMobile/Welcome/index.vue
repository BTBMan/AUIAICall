<template>
  <div class="welcome">
    <div class="welcome-header">AI虚拟人通话</div>
    <van-tabs v-model:active="activeKey" @change="onTabChange">
      <van-tab
        v-for="item in tabItems"
        :key="item.key"
        :title="item.title"
      ></van-tab>
    </van-tabs>
    <van-swipe
      class="welcome-swiper"
      ref="swiperRef"
      @change="onSwiperChange"
      :initial-swipe="activeIndex"
      :show-indicators="false"
    >
      <van-swipe-item v-for="item in tabItems" :key="item.key">
        <img class="welcome-img" :src="item.imgUrl" :alt="item.title" />
      </van-swipe-item>
    </van-swipe>
    <div class="welcome-btn">
      <van-button type="primary" block @click="onClick">开始体验</van-button>
    </div>
    <div class="safe-area"></div>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import { AICallAgentType, AIChatAgentType } from 'aliyun-auikit-aicall';
  import { WorkflowType } from '@/service/interface';
  import i18n from '@/common/i18n';

  const LAST_SELECT_INDEX_CACHE_KEY = 'aicall-welcome-last-select-index';

  export default defineComponent({
    name: 'Welcome',
    emits: ['agent-type-selected'],
    setup(props, { emit }) {
      const swiperRef = ref(null);
      const activeIndex = ref(
        Number(localStorage.getItem(LAST_SELECT_INDEX_CACHE_KEY)) || 0,
      );
      const activeKey = ref(tabItems[activeIndex.value].key);

      const tabItems = [
        {
          key: WorkflowType.VoiceChat,
          value: AICallAgentType.VoiceAgent,
          title: i18n['agent.voice'],
          imgUrl:
            'https://gw.alicdn.com/imgextra/i2/O1CN01ZLoopi1t0JfazWfy8_!!6000000005839-2-tps-426-852.png',
        },
        {
          key: WorkflowType.AvatarChat3D,
          value: AICallAgentType.AvatarAgent,
          title: i18n['agent.avatar'],
          imgUrl:
            'https://gw.alicdn.com/imgextra/i4/O1CN01SfZ6SI1eo2QpmMjMt_!!6000000003917-2-tps-426-852.png',
        },
        {
          key: WorkflowType.VisionChat,
          value: AICallAgentType.VisionAgent,
          title: i18n['agent.vision'],
          imgUrl:
            'https://gw.alicdn.com/imgextra/i1/O1CN01BZPzdO1pnXmFPq3WN_!!6000000005405-2-tps-426-852.png',
        },
        {
          key: 'Chatbot',
          value: AIChatAgentType.MessageChat,
          title: i18n['agent.chatbot'],
          imgUrl:
            'https://gw.alicdn.com/imgextra/i3/O1CN01e6vxYV1pJm28uCaRD_!!6000000005340-2-tps-426-852.png',
        },
      ];

      const onTabChange = (key: string) => {
        const index = tabItems.findIndex((item) => item.key === key);
        activeIndex.value = index;
        if (swiperRef.value) {
          (swiperRef.value as any).swipeTo(index);
        }
      };

      const onSwiperChange = (index: number) => {
        activeIndex.value = index;
        activeKey.value = tabItems[index].key;
      };

      const onClick = () => {
        localStorage.setItem(
          LAST_SELECT_INDEX_CACHE_KEY,
          activeIndex.value.toString(),
        );
        emit('agent-type-selected', tabItems[activeIndex.value].value);
      };

      return {
        swiperRef,
        activeIndex,
        activeKey,
        tabItems,
        onClick,
        onTabChange,
        onSwiperChange,
      };
    },
  });
</script>

<style>
  @import '../../Mobile/Welcome/index.less';

  .safe-area {
    height: 34px; /* 模拟 SafeArea 底部间距 */
  }
</style>
