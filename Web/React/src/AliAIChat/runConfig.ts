import type { AICallRunConfig } from './interface'
// import { AICallTemplateConfig } from 'aliyun-auikit-aicall';

// 如果需要自定义 TemplateConfig，请参考以下写法
// const callTemplateConfig = new AICallTemplateConfig();
// callTemplateConfig.agentGreeting = 'Custom Greeting';

// 支持的配置项参考 src/interface.ts
const runConfig: AICallRunConfig = {
  appServer: 'https://ice-smart-aiagent-fcapp-appserver.aliyuncs.com',
  chatAgentId: '94e4222d27bd43f49a7d49c8e6521bf4',
}

export default runConfig
