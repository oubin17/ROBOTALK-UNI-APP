<template>
  <view class="chat-container">
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
          <view class="welcome-title">欢迎使用 RoboTalk</view>
          <view class="welcome-desc">你可以向我询问任何问题</view>
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
          @input="adjustTextareaHeight" />
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

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 检测返回键
onBackPress(() => {
  if (messages.value.length > 0) {
    uni.showModal({
      title: '提示',
      content: '是否确认退出当前对话？',
      success: function (res) {
        if (res.confirm) {
          uni.navigateBack();
        }
      }
    });
    return true;
  }
});

// 生成唯一ID
const generateId = () => {
  messageId.value += 1;
  return `msg_${Date.now()}_${messageId.value}`;
};

// 调整文本区高度
const adjustTextareaHeight = () => {
  // 这里可以根据需要实现文本区自适应高度
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
});
</script>

<style lang="scss" scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  box-sizing: border-box;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #ffffff;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  position: relative;
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
  color: #333;
}

.chat-title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: 500;
  color: #333;
  margin-right: 60rpx; // 抵消返回按钮的宽度，保持标题居中
}

.chat-messages {
  flex: 1;
  position: relative;
  padding: 20rpx 30rpx;
  box-sizing: border-box;
  overflow: hidden;
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
}

.welcome-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.welcome-desc {
  font-size: 28rpx;
  color: #666;
}

.ai-typing {
  display: flex;
  margin-top: 30rpx;
  align-self: flex-start;
}

.typing-bubble {
  background-color: #f0f0f0;
  border-radius: 30rpx 30rpx 30rpx 0;
  padding: 20rpx 30rpx;
  max-width: 70%;
  position: relative;
}

.chat-input-area {
  display: flex;
  align-items: center;
  padding: 16rpx 30rpx;
  background-color: #ffffff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  position: relative;
  width: 100%;
  z-index: 10;
}

.input-wrapper {
  flex: 1;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  padding: 4rpx;
  max-height: 220rpx;
  overflow-y: auto;
}

.chat-textarea {
  width: 100%;
  padding: 16rpx;
  background-color: transparent;
  font-size: 28rpx;
  min-height: 70rpx;
  line-height: 1.5;
  box-sizing: border-box;
}

.send-btn {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
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
</style>