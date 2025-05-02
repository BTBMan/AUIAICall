<!-- eslint-disable vue/custom-event-name-casing -->
<script lang="ts">
  import {
    defineComponent,
    onMounted,
    onUnmounted,
    provide,
    ref,
    reactive,
  } from 'vue';
  import {
    AICallAgentError,
    AICallErrorCode,
    AIChatAgentInfo,
    AIChatAuthToken,
    AIChatEngine,
    AIChatError,
    AIChatMessagePlayState,
    AIChatMessageState,
    AIChatTemplateConfig,
    AIChatUserInfo,
  } from 'aliyun-auikit-aicall';
  import type {
    AIChatAgentShareConfig,
    JSONObject,
  } from 'aliyun-auikit-aicall';
  import {
    useChatStore,
    messageCachePrefix,
    setupChatStoreSubscription,
  } from './store';
  import standardService from '../../service/standard';
  import { getRootElement } from '../common/utils';
  import Header from './Header.vue';
  import Messages from './Messages.vue';
  import Footer from './Footer/index.vue';
  import State from './State.vue';
  import { ElMessage } from 'element-plus';

  export const ChatEngineKey = Symbol('ChatEngine');

  export default defineComponent({
    name: 'Chat',
    components: {
      Header,
      Messages,
      Footer,
      State,
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
      appServer: {
        type: String,
        default: undefined,
      },
      agentId: {
        type: String,
        default: undefined,
      },
      shareToken: {
        type: String,
        default: undefined,
      },
      region: {
        type: String,
        default: undefined,
      },
      templateConfig: {
        type: Object as () => AIChatTemplateConfig,
        default: undefined,
      },
      userData: {
        type: Object as () => JSONObject,
        default: undefined,
      },
    },
    emits: ['exit', 'auth-fail'],
    setup(props, { emit }) {
      const chatEngine = ref<AIChatEngine | null>(null);
      const chatStore = useChatStore();

      // 设置store订阅，监听消息变化保存到localStorage
      const unsubscribe = setupChatStoreSubscription();

      onMounted(async () => {
        const pageUnload = () => {
          chatStore.updateMessageList();
        };
        window.addEventListener('beforeunload', pageUnload);

        let _agentId = props.agentId;
        let _region = props.region;
        let shareConfig: AIChatAgentShareConfig | undefined;

        if (props.shareToken) {
          shareConfig = AIChatEngine.parseShareAgentChat(props.shareToken);
          if (shareConfig) {
            _agentId = shareConfig.shareId;
            if (shareConfig.region) {
              _region = shareConfig.region;
            }
          } else {
            ElMessage.error('分享信息解析失败');
            return;
          }
        }

        if (!_agentId) {
          ElMessage.error('智能体Id不能为空');
          return;
        }

        if (props.appServer) {
          standardService.setAppServer(props.appServer);
        }

        const engine = new AIChatEngine();

        if (props.templateConfig) {
          engine.templateConfig = props.templateConfig;
        }
        if (props.userData) {
          engine.userData = props.userData;
        }

        engine.on('engineStateChange', (state) => {
          chatStore.setState({
            chatState: state,
          });
        });

        engine.on('messagePlayStateChange', (message, state) => {
          if (state === AIChatMessagePlayState.Playing) {
            chatStore.setState({
              playingMessageId: message.dialogueId,
            });
          } else if (state !== AIChatMessagePlayState.Init) {
            chatStore.setState({
              playingMessageId: undefined,
            });
          }
        });

        engine.on('requestAuthToken', async (userId, callback) => {
          if (shareConfig) {
            try {
              const [_, authToken] = await engine.generateShareAgentChat(
                shareConfig,
                userId,
              );
              callback(authToken as AIChatAuthToken);
            } catch (err) {
              callback(undefined, err as AIChatError);
              const error = err as AICallAgentError;
              ElMessage.error(`${error.message || '出错了'}`);
            }
            return;
          }

          try {
            const token = await standardService.generateMessageChatToken(
              `${userId}`,
              props.userToken,
              props.agentId,
              props.region,
            );
            callback(token as AIChatAuthToken);
          } catch (err) {
            callback(undefined, err as AIChatError);
            if ((err as AICallAgentError).name === 'ServiceAuthError') {
              emit('auth-fail');
            }
          }
        });

        engine.on('receivedMessage', (message) => {
          if (message.senderId === engine.agentInfo?.agentId) {
            chatStore.receiveMessage(message);
          } else {
            chatStore.sendMessage(message);
          }
        });

        engine.on('voiceListUpdated', (voiceIdList) => {
          chatStore.setState({
            voiceIdList,
          });
        });

        engine.on('errorOccurs', (error) => {
          // TokenExpired 场景交给 requestAuthToken 处理
          if ((error as AIChatError).code === AICallErrorCode.TokenExpired) {
            return;
          }

          ElMessage.error(
            `出错了(${(error as AIChatError).code}): ${(error as AIChatError).message}`,
          );
        });

        engine.on('receivedCustomMessage', (message) => {
          ElMessage.info(`Received Custom Message: ${message}`);
        });

        // 启动聊天
        if (_agentId) {
          await engine.startChat(
            new AIChatUserInfo(props.userId),
            new AIChatAgentInfo(_agentId, _region),
          );

          if (engine.sessionId) {
            let messageList;
            try {
              messageList = JSON.parse(
                localStorage.getItem(
                  `${messageCachePrefix}${engine.sessionId}`,
                ) || '[]',
              );
              messageList.forEach((messageItem) => {
                if (
                  messageItem.message.messageState ===
                  AIChatMessageState.Transfering
                ) {
                  messageItem.message.messageState =
                    AIChatMessageState.Interrupted;
                }
              });
            } catch (error) {
              console.warn(`get local history message list error: ${error}`);
              messageList = [];
            }

            chatStore.setState({
              sessionId: engine.sessionId,
              messageList: messageList,
            });

            // 首次连接成功后，加载历史消息
            engine.once('engineStateChange', async (state) => {
              if (
                state === AIChatEngine.EngineState.Connected &&
                engine?.userInfo?.userId
              ) {
                const serverLastMessageList = await engine?.queryMessageList({
                  startTime: 0,
                  endTime: Date.now(),
                  pageNumber: 1,
                  pageSize: 20,
                  isDesc: true,
                });

                if (serverLastMessageList?.length) {
                  // 加载的历史消息列表是新的在前的，在这里进行了反向
                  chatStore.historyMessages(
                    serverLastMessageList.reverse(),
                    engine.userInfo.userId,
                    true,
                  );
                }
              }
            });
          }
        }

        chatEngine.value = engine;

        // 清理函数
        onUnmounted(() => {
          window.removeEventListener('beforeunload', pageUnload);
          unsubscribe();

          if (chatEngine.value) {
            chatEngine.value.removeAllListeners();
            chatEngine.value.endChat(false);
            chatStore.reset();
          }
        });
      });

      const handleExit = () => {
        emit('exit');
      };

      provide(ChatEngineKey, chatEngine);

      return {
        handleExit,
      };
    },
  });
</script>

<template>
  <div class="chat">
    <div class="safe-area-top"></div>
    <Header @back="handleExit" />
    <Messages />
    <Footer :user-id="userId" :user-token="userToken" />
    <div class="safe-area-bottom"></div>
    <State @exit="handleExit" />
  </div>
</template>

<style lang="scss">
  .chat {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: relative;
    background-color: #f5f5f5;

    .safe-area-top {
      height: env(safe-area-inset-top);
      background-color: #ffffff;
    }

    .safe-area-bottom {
      height: env(safe-area-inset-bottom);
      background-color: #f5f5f5;
    }
  }
</style>
