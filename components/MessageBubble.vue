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
  margin-bottom: 20rpx;
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
      border-radius: 20rpx 0 20rpx 20rpx;
    }

    .message-time {
      text-align: right;
      color: #999;
      font-size: 24rpx;
      margin-top: 4rpx;
      margin-right: 8rpx;
    }
  }

  &.assistant {
    align-self: flex-start;
    margin-right: auto;

    .message-content {
      background-color: #FFFFFF;
      color: #333333;
      border-radius: 0 20rpx 20rpx 20rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
    }

    .message-time {
      text-align: left;
      color: #999;
      font-size: 24rpx;
      margin-top: 4rpx;
      margin-left: 8rpx;
    }

    &.error .message-content {
      background-color: #FFEFEF;
      border: 1px solid rgba(255, 96, 96, 0.2);
    }
  }

  .message-content {
    padding: 16rpx 24rpx;
    word-break: break-all;
    word-wrap: break-word;
    font-size: 28rpx;
    line-height: 1.5;
    position: relative;
    box-sizing: border-box;
    max-width: 100%; // 确保不会溢出
  }

  .retry-btn {
    margin-top: 10rpx;
    display: inline-block;
    padding: 6rpx 16rpx;
    background-color: #4A90E2;
    color: white;
    border-radius: 8rpx;
    font-size: 22rpx;

    &:active {
      opacity: 0.8;
    }
  }
}
</style>