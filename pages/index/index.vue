<template>
  <view class="content">
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

    <view class="main-content">
      <view class="logo-container">
        <image class="logo" src="/static/logo.png"></image>
        <view class="logo-glow"></view>
      </view>

      <view class="action-area">
        <view class="start-btn" @tap="navigateToChat">
          <text>开始对话</text>
          <view class="btn-effect"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const navigateToChat = () => {
  uni.navigateTo({
    url: '/pages/chat/index'
  });
};

onMounted(() => {
  // 添加粒子随机位置和动画延迟
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
});
</script>

<style lang="scss" scoped>
.content {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #2e1a4a, #3a0f53);
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
  background: rgba(148, 87, 235, 0.1);
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
    background: rgba(167, 121, 255, 0.08);
  }

  &.circle-5 {
    width: 180rpx;
    height: 180rpx;
    bottom: 30%;
    left: 15%;
    animation-delay: -3s;
    background: rgba(167, 121, 255, 0.08);
  }
}

.grid {
  position: absolute;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(148, 87, 235, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 87, 235, 0.1) 1px, transparent 1px);
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
  background-color: rgba(167, 121, 255, 0.6);
  border-radius: 50%;
  animation: particleFloat 15s infinite linear;
  opacity: 0;
}

.main-content {
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  height: 100vh;
  padding: 15vh 0 15vh;
  box-sizing: border-box;
}

.logo-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.logo {
  height: 240rpx;
  width: 240rpx;
  animation: pulse 2s infinite ease-in-out;
  filter: drop-shadow(0 0 20rpx rgba(74, 144, 226, 0.3));
  z-index: 2;
}

.logo-glow {
  position: absolute;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(148, 87, 235, 0.3) 0%, rgba(148, 87, 235, 0) 70%);
  animation: glow 4s infinite alternate ease-in-out;
  z-index: 1;
}

.action-area {
  margin-top: auto;
}

.start-btn {
  position: relative;
  overflow: hidden;
  background: rgba(148, 87, 235, 0.2);
  backdrop-filter: blur(10px);
  color: #FFFFFF;
  padding: 24rpx 60rpx;
  border-radius: 50rpx;
  font-size: 32rpx;
  border: 1px solid rgba(148, 87, 235, 0.3);
  transition: all 0.3s;
  box-shadow: 0 0 30rpx rgba(148, 87, 235, 0.4);

  .btn-effect {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg,
        transparent,
        rgba(148, 87, 235, 0.3),
        transparent);
    transform: rotate(45deg);
    animation: shine 3s infinite;
  }

  &:active {
    transform: scale(0.98);
    box-shadow: 0 0 15rpx rgba(148, 87, 235, 0.4);
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

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.05);
  }
}

@keyframes glow {

  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.2);
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

@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) rotate(45deg);
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

// 为粒子添加不同的动画延迟
@for $i from 1 through 20 {
  .particle:nth-child(#{$i}) {
    animation-delay: #{$i * 0.3}s;
    animation-duration: #{10 + random(10)}s;
  }
}
</style>