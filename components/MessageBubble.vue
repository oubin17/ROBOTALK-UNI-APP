<template>
  <view class="message-bubble" :class="[type, { error: isError }]" @longpress="handleLongPress">
    <view class="message-content">
      {{ content }}
      <!-- 错误消息的重试按钮 -->
      <view v-if="isError" class="retry-btn" @tap.stop="handleRetry">
        <text class="retry-text">重试</text>
      </view>
    </view>
    <view class="message-time">{{ formatTime(time) }}</view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  id: {
    type: [Number, String],
    default: () => Date.now()
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'assistant', // 'assistant' 或 'user'
    validator: (value) => ['assistant', 'user'].includes(value)
  },
  time: {
    type: [Number, String, Date],
    default: () => new Date()
  },
  isError: {
    type: Boolean,
    default: false
  },
  referenceId: {
    type: [Number, String],
    default: null
  }
});

const emit = defineEmits(['copy', 'delete', 'retry']);

// 长按操作处理
const handleLongPress = () => {
  const actions = ['复制'];

  // 用户可以删除任何消息
  actions.push('删除');

  uni.showActionSheet({
    itemList: actions,
    success: (res) => {
      if (res.tapIndex === 0) {
        // 复制
        uni.setClipboardData({
          data: props.content,
          success: () => {
            uni.showToast({ title: '已复制', icon: 'none' });
            emit('copy', props.id);
          }
        });
      } else if (res.tapIndex === 1) {
        // 删除
        emit('delete', props.id);
      }
    }
  });
};

// 重试操作处理
const handleRetry = () => {
  emit('retry', props.id);
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
</script>

<style lang="scss" scoped>
.message-bubble {
  max-width: 75%; // 减小宽度防止溢出
  margin-bottom: 16rpx; // 原来是20rpx
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

  &.user {
    align-self: flex-end;
    margin-left: auto;

    .message-content {
      background: linear-gradient(135deg, #4A90E2, #6AA9FF);
      color: #FFFFFF;
      border-radius: 20rpx 4rpx 20rpx 20rpx; // 原来是24rpx
      box-shadow: 0 4rpx 16rpx rgba(74, 144, 226, 0.3);
    }

    .message-time {
      text-align: right;
      color: rgba(255, 255, 255, 0.6);
      font-size: 20rpx; // 原来是22rpx
      margin-top: 4rpx; // 原来是6rpx
      margin-right: 8rpx; // 原来是10rpx
    }
  }

  &.assistant {
    align-self: flex-start;
    margin-right: auto;

    .message-content {
      background-color: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      color: #FFFFFF;
      border-radius: 4rpx 20rpx 20rpx 20rpx; // 原来是24rpx
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .message-time {
      text-align: left;
      color: rgba(255, 255, 255, 0.6);
      font-size: 20rpx; // 原来是22rpx
      margin-top: 4rpx; // 原来是6rpx
      margin-left: 8rpx; // 原来是10rpx
    }

    &.error .message-content {
      background-color: rgba(255, 76, 76, 0.15);
      border: 1px solid rgba(255, 96, 96, 0.3);
    }
  }

  .message-content {
    padding: 14rpx 20rpx; // 原来是20rpx 28rpx
    word-break: break-all;
    word-wrap: break-word;
    font-size: 26rpx; // 原来是28rpx
    line-height: 1.5; // 原来是1.6
    position: relative;
    box-sizing: border-box;
    max-width: 100%; // 确保不会溢出
    transition: all 0.3s ease;
  }

  .retry-btn {
    margin-top: 10rpx; // 原来是14rpx
    display: inline-block;
    padding: 6rpx 16rpx; // 原来是8rpx 20rpx
    background-color: #4A90E2;
    color: white;
    border-radius: 50rpx;
    font-size: 20rpx; // 原来是22rpx
    box-shadow: 0 2rpx 8rpx rgba(74, 144, 226, 0.4);
    transition: all 0.2s ease;

    &:active {
      opacity: 0.8;
      transform: scale(0.98);
    }
  }
}
</style>