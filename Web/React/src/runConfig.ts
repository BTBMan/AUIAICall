import { AICallRunConfig } from '@/interface.ts';
// import { AICallTemplateConfig } from 'aliyun-auikit-aicall';

// 如果需要自定义 TemplateConfig，请参考以下写法
// const callTemplateConfig = new AICallTemplateConfig();
// callTemplateConfig.agentGreeting = 'Custom Greeting';

// 支持的配置项参考 src/interface.ts
const runConfig: AICallRunConfig = {
  // appServer: 'https://aui-aiagent.h5video.vip', // https://aiagent.aliyun-inc.test https://aui-aiagent.h5video.vip https://ice-smart-aiagent-fcapp-appserver.aliyuncs.com
  // chatAgentId: '87e2c48440c54a07a84b445a184a7b0e', // 5a12e2415b7545e5b15716d276cb8fb4 1bf0f98eb2d942ff930deb07d59f5872 94e4222d27bd43f49a7d49c8e6521bf4
  // callTemplateConfig: callTemplateConfig,
  // appServer: '',
  // chatAgentId: '94e4222d27bd43f49a7d49c8e6521bf4',
  // appServer: 'https://ice-smart-aiagent-fcapp.aliyun-inc.com',
  // appServer: 'https://ice-vpc.cn-shanghai.aliyuncs.com',
  appServer: 'http://localhost:9000',
  chatAgentId: '87e2c48440c54a07a84b445a184a7b0e',
};

export default runConfig;
