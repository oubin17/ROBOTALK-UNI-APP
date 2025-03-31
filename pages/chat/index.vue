<template>
  <view class="chat-container">
    <!-- 动态背景 -->
    <view class="background">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
      <view class="circle circle-4"></view>
      <view class="circle circle-5"></view>
      <view class="grid"></view>
      <view class="particles">
        <view class="particle" v-for="i in 20" :key="i"></view>
      </view>
    </view>

    <!-- 顶部导航栏 -->
    <view class="chat-header">
      <view class="back-btn" @tap="goBack">
        <text class="back-icon">←</text>
      </view>
      <view class="chat-title">AI助手</view>
    </view>

    <!-- 聊天消息列表 -->
    <scroll-view class="chat-messages" scroll-y="true" :scroll-top="scrollTop" :scroll-with-animation="true"
      @scrolltoupper="loadMoreMessages" upper-threshold="50" ref="messageScroll">
      <view class="messages-container">
        <!-- 欢迎消息 -->
        <view class="welcome-message" v-if="messages.length === 0">
          <view class="welcome-icon">
            <view class="welcome-glow"></view>
          </view>
          <view class="welcome-title">欢迎使用 RoboTalk</view>
          <view class="welcome-desc">请输入您的问题，我随时为您提供帮助</view>
          <view class="welcome-tips">
            <view class="tip-item">
              <view class="tip-icon">💡</view>
              <view class="tip-text">可以询问任何知识</view>
            </view>
            <view class="tip-item">
              <view class="tip-icon">🔍</view>
              <view class="tip-text">帮助查找资料</view>
            </view>
            <view class="tip-item">
              <view class="tip-icon">💬</view>
              <view class="tip-text">长按消息可复制或删除</view>
            </view>
          </view>
        </view>

        <!-- 消息气泡列表 -->
        <block v-for="(message, index) in messages" :key="message.id">
          <MessageBubble :id="message.id" :content="message.content" :type="message.role" :time="message.time"
            :isError="message.isError" :referenceId="message.referenceId" @retry="retryMessage" @copy="copyMessage"
            @delete="deleteMessage" />
        </block>

        <!-- AI正在输入的提示 -->
        <view class="ai-typing" v-if="isAiTyping">
          <view class="typing-bubble">
            <LoadingDots />
          </view>
        </view>
        <!-- 底部安全距离 -->
        <view class="safe-bottom-area"></view>
      </view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="chat-input-area">
      <view class="input-wrapper">
        <textarea class="chat-textarea" v-model="userInput" placeholder="请输入消息..." :disabled="isAiTyping"
          :auto-height="true" :show-confirm-bar="false" :cursor-spacing="10" :maxlength="-1" @confirm="sendMessage"
          @input="adjustTextareaHeight" :style="{ height: textareaHeight }" />
      </view>
      <view class="send-btn" :class="{ 'send-btn-active': userInput.trim().length > 0 }" @tap="sendMessage">
        <text class="send-icon">↑</text>
      </view>
    </view>

    <!-- 网络错误提示 -->
    <view class="network-error" v-if="networkError">
      <text>网络连接异常，请检查网络后重试</text>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import MessageBubble from '@/components/MessageBubble.vue';
import LoadingDots from '@/components/LoadingDots.vue';
import { callApiWithTimeout, sendMessageToAI } from '@/utils/api.js';
import { onBackPress } from '@dcloudio/uni-app';

// 状态变量
const userInput = ref('');
const messages = ref([]);
const isAiTyping = ref(false);
const scrollTop = ref(0);
const networkError = ref(false);
const messageId = ref(0);
const textareaHeight = ref('50rpx'); // 修改默认高度为更小的值

// 返回上一页
const goBack = () => {
  // 直接返回，不通过onBackPress事件处理
  if (messages.value.length > 0) {
    uni.showModal({
      title: '提示',
      content: '是否确认退出当前对话？',
      success: function (res) {
        if (res.confirm) {
          uni.navigateBack({
            delta: 1,
            fail: (err) => {
              console.error('返回失败:', err);
              // 如果navigateBack失败，尝试使用redirectTo回到首页
              uni.redirectTo({
                url: '/pages/index/index'
              });
            }
          });
        }
      }
    });
  } else {
    uni.navigateBack({
      delta: 1,
      fail: (err) => {
        console.error('返回失败:', err);
        // 如果navigateBack失败，尝试使用redirectTo回到首页
        uni.redirectTo({
          url: '/pages/index/index'
        });
      }
    });
  }
};

// 检测返回键
onBackPress((event) => {
  // 只有系统返回键才处理，不影响页面内返回按钮
  if (event.from === 'backbutton' && messages.value.length > 0) {
    uni.showModal({
      title: '提示',
      content: '是否确认退出当前对话？',
      success: function (res) {
        if (res.confirm) {
          uni.navigateBack();
        }
      }
    });
    return true; // 阻止默认返回
  }
  return false; // 不阻止默认返回
});

// 生成唯一ID
const generateId = () => {
  messageId.value += 1;
  return `msg_${Date.now()}_${messageId.value}`;
};

// 调整文本区高度
const adjustTextareaHeight = (e) => {
  const text = userInput.value;
  if (!text || text.length === 0) {
    textareaHeight.value = '50rpx';
    return;
  }

  // 计算换行符数量
  const lineBreaks = (text.match(/\n/g) || []).length;

  // 估算每行能容纳的字符数（根据输入框宽度和字体大小估算）
  const charsPerLine = 26; // 假设每行可以容纳约26个字符

  // 估算因内容长度导致的额外行数（不含换行符导致的行数）
  const contentLines = Math.ceil(text.length / charsPerLine);

  // 计算总行数（取换行符导致的行数和内容长度导致的行数的较大值）
  let totalLines = Math.max(lineBreaks + 1, contentLines);

  // 限制最多显示3行
  totalLines = Math.min(3, Math.max(1, totalLines));

  // 根据行数设置高度
  textareaHeight.value = totalLines === 1 ? '50rpx' : `${totalLines * 36 + 14}rpx`;
};

// 发送消息
const sendMessage = async () => {
  const message = userInput.value.trim();
  if (!message || isAiTyping.value) return;

  // 添加用户消息到列表
  const userMessageId = generateId();
  messages.value.push({
    id: userMessageId,
    role: 'user',
    content: message,
    time: new Date(),
    isError: false
  });

  // 清空输入框
  userInput.value = '';

  // 滚动到底部
  await scrollToBottom();

  // 显示AI正在输入状态
  isAiTyping.value = true;

  try {
    // 发送消息到AI
    const response = await sendMessageToAI(message);

    // 在开发环境中输出响应内容
    if (import.meta.env.DEV) {
      console.log('AI响应内容:', response);
    }

    // 获取AI回复内容
    let aiContent = '抱歉，我无法理解您的问题';

    // 根据响应格式提取内容
    if (response && typeof response === 'object') {
      if (response.content) {
        aiContent = response.content;
      } else if (response.data && typeof response.data === 'string') {
        aiContent = response.data;
      } else if (typeof response === 'string') {
        aiContent = response;
      }
    }

    // 添加AI回复到列表
    const aiMessageId = generateId();
    messages.value.push({
      id: aiMessageId,
      role: 'assistant',
      content: aiContent,
      time: new Date(),
      isError: false,
      referenceId: userMessageId
    });

    // 隐藏网络错误提示
    networkError.value = false;
  } catch (error) {
    console.error('发送消息失败:', error);

    // 添加错误消息
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: error.message || '消息发送失败，请重试',
      time: new Date(),
      isError: true,
      referenceId: userMessageId
    });

    // 显示网络错误提示（如果是网络问题）
    if (error.type === 'network') {
      networkError.value = true;

      // 3秒后自动隐藏网络错误提示
      setTimeout(() => {
        networkError.value = false;
      }, 3000);
    }
  } finally {
    isAiTyping.value = false;
    await scrollToBottom();
  }
};

// 重试发送失败的消息
const retryMessage = async (messageId) => {
  // 找到错误消息
  const errorMessageIndex = messages.value.findIndex(msg => msg.id === messageId);
  if (errorMessageIndex === -1) return;

  const errorMessage = messages.value[errorMessageIndex];
  const userMessageIndex = messages.value.findIndex(msg => msg.id === errorMessage.referenceId);
  if (userMessageIndex === -1) return;

  const userMessage = messages.value[userMessageIndex];

  // 删除错误消息
  messages.value.splice(errorMessageIndex, 1);

  // 显示AI正在输入状态
  isAiTyping.value = true;

  try {
    // 重新发送消息到AI
    const response = await sendMessageToAI(userMessage.content);

    // 获取AI回复内容
    let aiContent = '抱歉，我无法理解您的问题';

    // 根据响应格式提取内容
    if (response && typeof response === 'object') {
      if (response.content) {
        aiContent = response.content;
      } else if (response.data && typeof response.data === 'string') {
        aiContent = response.data;
      } else if (typeof response === 'string') {
        aiContent = response;
      }
    }

    // 添加AI回复到列表
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: aiContent,
      time: new Date(),
      isError: false,
      referenceId: userMessage.id
    });

    // 隐藏网络错误提示
    networkError.value = false;
  } catch (error) {
    console.error('重试消息失败:', error);

    // 添加错误消息
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: error.message || '消息发送失败，请重试',
      time: new Date(),
      isError: true,
      referenceId: userMessage.id
    });
  } finally {
    isAiTyping.value = false;
    await scrollToBottom();
  }
};

// 复制消息内容
const copyMessage = (messageId) => {
  const message = messages.value.find(msg => msg.id === messageId);
  if (!message) return;

  uni.setClipboardData({
    data: message.content,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'none'
      });
    }
  });
};

// 删除消息
const deleteMessage = (messageId) => {
  const index = messages.value.findIndex(msg => msg.id === messageId);
  if (index !== -1) {
    messages.value.splice(index, 1);
  }
};

// 加载更多历史消息
const loadMoreMessages = () => {
  // 这里可以实现加载更多历史消息的逻辑
  // 例如从本地存储或服务器获取历史对话
};

// 滚动到底部
const scrollToBottom = async () => {
  await nextTick();
  // 获取消息容器高度并设置滚动位置
  const query = uni.createSelectorQuery().in(this);
  query.select('.messages-container').boundingClientRect(data => {
    if (data) {
      scrollTop.value = data.height;
    }
  }).exec();
};

// 组件挂载时执行
onMounted(() => {
  // 这里可以添加初始化逻辑，例如加载历史消息

  // 添加粒子随机位置和动画延迟
  setTimeout(() => {
    const particles = document.querySelectorAll('.particle');
    particles.forEach(particle => {
      const delay = Math.random() * 5;
      const size = Math.random() * 10 + 2;
      const posX = Math.random() * 100;
      const posY = Math.random() * 100;

      particle.style.left = `${posX}%`;
      particle.style.top = `${posY}%`;
      particle.style.width = `${size}rpx`;
      particle.style.height = `${size}rpx`;
      particle.style.animationDelay = `${delay}s`;
    });
  }, 100);
});
</script>

<style lang="scss" scoped>
.chat-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
}

.background {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(74, 144, 226, 0.1);
  animation: float 8s infinite ease-in-out;

  &.circle-1 {
    width: 300rpx;
    height: 300rpx;
    top: -100rpx;
    left: -100rpx;
    animation-delay: 0s;
  }

  &.circle-2 {
    width: 400rpx;
    height: 400rpx;
    bottom: -150rpx;
    right: -150rpx;
    animation-delay: -2s;
  }

  &.circle-3 {
    width: 200rpx;
    height: 200rpx;
    top: 40%;
    left: 60%;
    animation-delay: -4s;
  }

  &.circle-4 {
    width: 250rpx;
    height: 250rpx;
    top: 20%;
    right: 10%;
    animation-delay: -1s;
    background: rgba(106, 169, 255, 0.08);
  }

  &.circle-5 {
    width: 180rpx;
    height: 180rpx;
    bottom: 30%;
    left: 15%;
    animation-delay: -3s;
    background: rgba(106, 169, 255, 0.08);
  }
}

.grid {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(74, 144, 226, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 144, 226, 0.1) 1px, transparent 1px);
  background-size: 50rpx 50rpx;
  animation: gridMove 20s linear infinite;
}

.particles {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.particle {
  position: absolute;
  width: 5rpx;
  height: 5rpx;
  background-color: rgba(106, 169, 255, 0.6);
  border-radius: 50%;
  animation: particleFloat 15s infinite linear;
  opacity: 0;
}

.chat-header {
  position: relative;
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-icon {
  font-size: 40rpx;
  color: #fff;
}

.chat-title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: 500;
  color: #fff;
  margin-right: 60rpx; // 抵消返回按钮的宽度，保持标题居中
}

.chat-messages {
  flex: 1;
  position: relative;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 5;
}

.messages-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding-bottom: 20rpx;
  box-sizing: border-box;
  padding-right: 10rpx; // 防止右侧被遮挡
}

.safe-bottom-area {
  height: 40rpx; // 底部安全距离，防止最后一条消息被输入框遮挡
}

.welcome-message {
  margin: 40rpx 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.welcome-icon {
  width: 100rpx;
  height: 100rpx;
  background-color: rgba(74, 144, 226, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  position: relative;
  border: 2rpx solid rgba(74, 144, 226, 0.3);

  &::before {
    content: "AI";
    font-size: 40rpx;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.9);
  }
}

.welcome-glow {
  position: absolute;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(74, 144, 226, 0.6) 0%, rgba(74, 144, 226, 0) 70%);
  animation: pulse 2s infinite ease-in-out;
  z-index: -1;
}

.welcome-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.3);
}

.welcome-desc {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 30rpx;
}

.welcome-tips {
  width: 80%;
  margin-top: 16rpx;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tip-item {
  display: flex;
  align-items: center;
  margin: 8rpx 0;
}

.tip-icon {
  font-size: 26rpx;
  margin-right: 14rpx;
}

.tip-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
}

.ai-typing {
  display: flex;
  margin-top: 30rpx;
  align-self: flex-start;
}

.typing-bubble {
  background-color: rgba(240, 240, 240, 0.2);
  backdrop-filter: blur(5px);
  border-radius: 30rpx 30rpx 30rpx 0;
  padding: 20rpx 30rpx;
  max-width: 70%;
  position: relative;
}

.chat-input-area {
  display: flex;
  align-items: center;
  padding: 12rpx 30rpx;
  background-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
  box-sizing: border-box;
  position: relative;
  width: 100%;
  z-index: 10;
}

.input-wrapper {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 18rpx;
  padding: 0;
  max-height: 160rpx;
  overflow-y: auto;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1) inset;
  position: relative;
}

.chat-textarea {
  width: 100%;
  padding: 14rpx 16rpx 10rpx;
  /* 顶部内边距更大，使单行文本看起来居中 */
  background-color: transparent;
  font-size: 26rpx;
  box-sizing: border-box;
  color: #fff;
  overflow-y: auto;
  line-height: 36rpx;
  /* 固定行高，确保多行文本整齐 */
  transition: height 0.2s ease;
}

/* 自定义placeholder样式 */
.chat-textarea::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

.send-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background-color: rgba(224, 224, 224, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.send-btn-active {
  background-color: #4A90E2;
}

.send-icon {
  color: #fff;
  font-size: 32rpx;
}

.network-error {
  position: fixed;
  top: 150rpx;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(255, 76, 76, 0.8);
  color: #fff;
  padding: 15rpx 30rpx;
  border-radius: 50rpx;
  font-size: 26rpx;
  z-index: 100;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -20rpx);
  }

  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-20rpx);
  }
}

@keyframes gridMove {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(50rpx);
  }
}

@keyframes particleFloat {
  0% {
    transform: translateY(0) translateX(0);
    opacity: 0;
  }

  10% {
    opacity: 0.8;
  }

  90% {
    opacity: 0.8;
  }

  100% {
    transform: translateY(-100vh) translateX(100rpx);
    opacity: 0;
  }
}

@keyframes pulse {

  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

// 为粒子添加不同的动画延迟
@for $i from 1 through 20 {
  .particle:nth-child(#{$i}) {
    animation-delay: #{$i * 0.3}s;
    animation-duration: #{10 + random(10)}s;
  }
}
</style>