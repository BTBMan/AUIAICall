import { useEffect } from 'react';

export default function App() {
  function initAliAICall() {
    // @ts-expect-error ARTCAICallUI
    // cspell:disable-next-line
    new ARTCAICallUI({
      userId: '210457171', // 进入rtc的用户id，建议使用业务的登录用户id
      root: document.getElementById('ai-chat'), // 页面渲染到的节点，画面完整填充整个区域
      shareToken:
        'eyJSZXF1ZXN0SWQiOiIzRDFEOThCMy1ERjRELTUyMTQtOEQzRC00MzE4NTREQkU1RTYiLCJXb3JrZmxvd1R5cGUiOiJWb2ljZUNoYXQiLCJUZW1wb3JhcnlBSUFnZW50SWQiOiI5NGU0MjIyZDI3YmQ0M2Y0OWE3ZDQ5YzhlNjUyMWJmNCIsIkV4cGlyZVRpbWUiOiIyMDI1LTA1LTAyIDAzOjU5OjUwIiwiTmFtZSI6Ijk0ZTQyMjJkMjdiZDQzZjQ5YTdkNDljOGU2NTIxYmY0IiwiUmVnaW9uIjoiY24tc2hhbmdoYWkifQ==', // 从控制台上拷贝的Token
    }).render();
  }

  useEffect(() => {
    setTimeout(() => {
      initAliAICall();
    }, 1000);
  }, []);

  return (
    <div>
      <p>一段代码集成 AI 实时互动 Demo</p>
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%',
          zIndex: 1000,
        }}
      >
        <div
          id='ai-chat'
          style={{
            boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.1)',
            height: '80vh',
            maxHeight: '600px',
            width: '500px',
            overflow: 'hidden',
            borderRadius: '5px',
            backgroundColor: 'white',
            padding: '15px 0',
          }}
        />
      </div>
    </div>
  );
}
