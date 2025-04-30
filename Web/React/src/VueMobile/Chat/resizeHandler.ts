export const resizeHandler = {
  register() {
    // 处理移动端键盘弹出的事件
    document.documentElement.style.height = `${window.innerHeight}px`;
  },
  unregister() {
    document.documentElement.style.height = '';
  },
};
