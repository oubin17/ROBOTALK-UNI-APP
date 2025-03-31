<template>
  <view class="loading-dots">
    <view class="dot"></view>
    <view class="dot"></view>
    <view class="dot"></view>
  </view>
</template>

<script setup>
// 无需额外逻辑
</script>

<style lang="scss" scoped>
.loading-dots {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 24rpx;

  .dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background-color: #9355e8;
    margin: 0 5rpx;
    animation: loading 1.4s infinite ease-in-out both;

    &:nth-child(1) {
      animation-delay: -0.32s;
    }

    &:nth-child(2) {
      animation-delay: -0.16s;
    }
  }
}

@keyframes loading {

  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }

  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>