<template>
  <view class="message-bubble" :class="[type, { error: isError }]" @longpress="handleLongPress">
    <view class="message-content">
      <text>{{ content }}</text>
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
  max-width: 76%;
  margin-bottom: 40rpx; // 增加底部外边距，为时间留出更多空间
  position: relative;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  width: fit-content;

  &.user {
    align-self: flex-end;
    margin-left: auto;
    margin-right: 10rpx;

    .message-content {
      background: #9355e8;
      color: #FFFFFF;
      border-radius: 20rpx 4rpx 20rpx 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(148, 87, 235, 0.2);
      padding: 14rpx 20rpx; // 将padding移到这里，避免嵌套样式
      word-break: break-word;
      word-wrap: break-word;
      font-size: 26rpx;
      line-height: 1.5;
      position: relative;
      box-sizing: border-box;
      max-width: 100%;
      transition: all 0.3s ease;
      white-space: pre-wrap;
    }

    .message-time {
      text-align: right;
      color: rgba(255, 255, 255, 0.6);
      font-size: 20rpx;
      margin-top: 8rpx; // 增加与消息的间距
      margin-right: 8rpx;
      position: absolute;
      right: 0;
      bottom: -30rpx; // 增加距离
    }
  }

  &.assistant {
    align-self: flex-start;
    margin-right: auto;
    margin-left: 20rpx;

    .message-content {
      background-color: rgba(148, 87, 235, 0.15);
      backdrop-filter: blur(10px);
      color: #FFFFFF;
      border-radius: 4rpx 20rpx 20rpx 20rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
      border: 1px solid rgba(148, 87, 235, 0.2);
      padding: 14rpx 20rpx; // 将padding移到这里，避免嵌套样式
      word-break: break-word;
      word-wrap: break-word;
      font-size: 26rpx;
      line-height: 1.5;
      position: relative;
      box-sizing: border-box;
      max-width: 100%;
      transition: all 0.3s ease;
      white-space: pre-wrap;
    }

    .message-time {
      text-align: left;
      color: rgba(255, 255, 255, 0.6);
      font-size: 20rpx;
      margin-top: 8rpx; // 增加与消息的间距
      margin-left: 8rpx;
      position: absolute;
      left: 0;
      bottom: -30rpx; // 增加距离
    }

    &.error .message-content {
      background-color: rgba(255, 76, 76, 0.15);
      border: 1px solid rgba(255, 96, 96, 0.3);
    }
  }

  // 删除通用的 .message-content 样式，避免样式重叠
  
  text {
    display: inline-block;
    width: 100%;
    min-width: 0;
  }

  .retry-btn {
    margin-top: 10rpx;
    display: inline-block;
    padding: 6rpx 16rpx;
    background-color: #9355e8;
    color: white;
    border-radius: 50rpx;
    font-size: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(148, 87, 235, 0.4);
    transition: all 0.2s ease;

    &:active {
      opacity: 0.8;
      transform: scale(0.98);
    }
  }
}
</style>