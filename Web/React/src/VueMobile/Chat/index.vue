<template>
  <div class="mobile-chat-container">
    <chat-engine-context-provider :value="chatEngineRef">
      <Header />
      <div
        class="mobile-chat-content"
        :style="{ height: contentHeight + 'px' }"
      >
        <State v-if="aiState" />
        <Messages />
      </div>
      <div class="mobile-chat-actions">
        <Footer :disabled="isExiting" />
      </div>
    </chat-engine-context-provider>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    onMounted,
    onUnmounted,
    ref,
    computed,
    watch,
  } from 'vue';
  import { useChatModel } from './store';
  import { AIChatEngine, AIChatOptions } from 'aliyun-auikit-aicall';
  import { Toast } from 'vant';
  import State from './State.vue';
  import Messages from './Messages.vue';
  import Header from './Header.vue';
  import Footer from './Footer/index.vue';
  import ChatEngineContextProvider from './ChatEngineContext';
  import { resizeHandler } from './resizeHandler';
  import { JSONObject } from '@/service/interface';

  export default defineComponent({
    name: 'Chat',
    components: {
      State,
      Messages,
      Header,
      Footer,
      ChatEngineContextProvider,
    },
    props: {
      userId: {
        type: String,
        required: true,
      },
      userToken: {
        type: String,
        required: true,
      },
      agentId: {
        type: String,
        required: true,
      },
      appServer: {
        type: String,
        required: true,
      },
      templateConfig: {
        type: Object,
        default: undefined,
      },
      userData: {
        type: Object as () => JSONObject,
        default: undefined,
      },
    },
    emits: ['exit'],
    setup(props, { emit }) {
      const {
        initData,
        aiState,
        messages,
        addMessage,
        setAiState,
        clearAiState,
        resetData,
      } = useChatModel();
      const chatEngineRef = ref<AIChatEngine | null>(null);
      const contentHeight = ref(window.innerHeight - 44 - 60);
      const isExiting = ref(false);

      const initChatEngine = () => {
        const {
          userId,
          userToken,
          agentId,
          appServer,
          templateConfig,
          userData,
        } = props;

        try {
          const options: AIChatOptions = {
            userId,
            userToken,
            agentId,
            appServer,
            userData,
            templateConfig,
            onConnect: () => {
              console.log('Chat connected');
            },
            onDisconnect: (reason: string) => {
              console.log('Chat disconnected:', reason);
              Toast.show({
                message: reason || '连接已断开',
                position: 'bottom',
              });
            },
            onTitleChange: (title: string) => {
              console.log('Title changed:', title);
            },
            onStateChange: (state: string) => {
              setAiState(state);
            },
            onActionComplete: () => {
              clearAiState();
            },
            onMessage: (message) => {
              addMessage(message);
            },
          };

          const engine = new AIChatEngine(options);
          chatEngineRef.value = engine;
        } catch (error) {
          console.error('Failed to initialize chat:', error);
          Toast.show({
            message: '初始化失败，请重试',
            position: 'bottom',
          });
        }
      };

      const onResize = () => {
        contentHeight.value = window.innerHeight - 44 - 60;
      };

      onMounted(() => {
        resetData();
        initData();
        initChatEngine();
        window.addEventListener('resize', onResize);
        resizeHandler.register();
      });

      onUnmounted(() => {
        if (chatEngineRef.value) {
          chatEngineRef.value.destroy();
          chatEngineRef.value = null;
        }
        window.removeEventListener('resize', onResize);
        resizeHandler.unregister();
      });

      watch(
        () => props,
        () => {
          if (chatEngineRef.value) {
            chatEngineRef.value.destroy();
            chatEngineRef.value = null;
          }
          resetData();
          initData();
          initChatEngine();
        },
        { deep: true },
      );

      const onExit = () => {
        isExiting.value = true;
        if (chatEngineRef.value) {
          chatEngineRef.value.destroy();
          chatEngineRef.value = null;
        }
        emit('exit');
      };

      return {
        aiState,
        messages,
        chatEngineRef,
        contentHeight,
        isExiting,
        onExit,
      };
    },
  });
</script>

<style>
  @import '../../Mobile/Chat/index.less';
</style>
