<template>
  <view class="content">
    <image class="logo" src="/static/logo.png"></image>
    <view class="text-area">
      <text class="title">{{ title }}</text>
    </view>
    <view class="action-area">
      <view class="start-btn" @tap="navigateToChat">开始对话</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';

const title = ref('RoboTalk AI对话');

// 跳转到聊天页面
const navigateToChat = () => {
  uni.navigateTo({
    url: '/pages/chat/index'
  });
};
</script>

<style lang="scss" scoped>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
  margin-bottom: 80rpx;
}

.title {
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
}

.action-area {
  margin-top: 50rpx;
}

.start-btn {
  background: linear-gradient(135deg, #4A90E2, #6AA9FF);
  color: #FFFFFF;
  padding: 24rpx 60rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  box-shadow: 0 10rpx 20rpx rgba(74, 144, 226, 0.3);
  transition: all 0.3s;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 5rpx 10rpx rgba(74, 144, 226, 0.3);
  }
}
</style>