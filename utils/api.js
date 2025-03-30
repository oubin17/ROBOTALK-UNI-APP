/**
 * API工具类
 * 封装所有与API交互相关的函数
 */

// API基础配置
export const API_CONFIG = {
  // 使用Vite环境变量
  baseUrl: import.meta.env.DEV ? 'http://localhost:8080/robotalk/api' : import.meta.env.VITE_API_BASE_URL,
  timeout: 10000, // 10秒超时
  endpoints: {
    ask: '/ask/turbo'
  }
};

/**
 * 带超时的API调用
 * @param {Object} options 请求选项
 * @returns {Promise} 返回API响应数据
 */
export const callApiWithTimeout = (options) => {
  return new Promise((resolve, reject) => {
    // 创建超时计时器
    const timeoutTimer = setTimeout(() => {
      reject(new Error('请求超时，请检查网络连接'));
    }, options.timeout || API_CONFIG.timeout);

    // 检查网络状态
    uni.getNetworkType({
      success: (networkState) => {
        // 如果没有网络连接，直接返回错误
        if (networkState.networkType === 'none') {
          clearTimeout(timeoutTimer);
          return reject(new Error('无网络连接，请检查网络设置'));
        }

        // 打印请求信息
        if (import.meta.env.DEV) {
          console.log('请求URL:', options.url);
          console.log('请求方法:', options.method);
          console.log('请求数据:', options.data);
        }

        // 发起请求
        uni.request({
          url: options.url,
          method: options.method || 'GET',
          data: options.data || {},
          header: {
            'content-type': 'application/json',
            ...options.header
          },
          success: (res) => {
            clearTimeout(timeoutTimer);

            // 调试模式下打印完整响应
            if (import.meta.env.DEV) {
              console.log('API响应状态码:', res.statusCode);
              console.log('API完整响应:', res.data);
            }

            // 修改响应处理逻辑，增加更多的容错处理
            if (res.statusCode >= 200 && res.statusCode < 300) {
              // 根据不同的响应结构进行处理
              if (res.data && res.data.success === true && res.data.data) {
                // 标准响应格式: { success: true, data: {...} }
                resolve(res.data.data);
              } else if (res.data && res.data.content) {
                // 直接返回带content的格式: { content: "..." }
                resolve(res.data);
              } else if (typeof res.data === 'object') {
                // 返回整个响应对象
                resolve(res.data);
              } else {
                // 纯文本响应
                resolve({ content: String(res.data) });
              }
            } else {
              // 处理HTTP错误
              let errorMsg = '请求失败';
              if (res.data) {
                if (res.data.errorContext || res.data.message || res.data.error) {
                  errorMsg = res.data.errorContext || res.data.message || res.data.error;
                } else {
                  errorMsg = `请求失败(${res.statusCode})`;
                }
              }
              reject(new Error(errorMsg));
            }
          },
          fail: (err) => {
            clearTimeout(timeoutTimer);
            if (import.meta.env.DEV) {
              console.error('请求失败:', err);
            }
            reject(new Error(err.errMsg || '网络异常'));
          }
        });
      },
      fail: () => {
        clearTimeout(timeoutTimer);
        reject(new Error('无法获取网络状态'));
      }
    });
  });
};

/**
 * 发送消息到AI服务
 * @param {string} message 用户消息内容
 * @param {Object} options 额外选项(可选)
 * @returns {Promise<object>} AI回复内容
 */
export const sendMessageToAI = async (message, options = {}) => {
  try {
    // 请求开始时间，用于计算响应时间
    const startTime = Date.now();

    // 构建请求参数
    const requestData = {
      content: message,
      ...options.extraParams // 允许传入额外参数
    };

    // 发送请求
    const result = await callApiWithTimeout({
      url: options.url || (API_CONFIG.baseUrl + API_CONFIG.endpoints.ask),
      method: 'POST',
      data: requestData,
      timeout: options.timeout,
      header: options.headers
    });

    // 计算响应时间（毫秒）
    const responseTime = Date.now() - startTime;
    console.log(`AI响应时间: ${responseTime}ms`);

    // 确保返回的数据包含content属性
    if (!result.content && typeof result === 'string') {
      return { content: result };
    } else if (!result.content && typeof result === 'object') {
      // 尝试从响应中找出可能的内容字段
      const possibleContentFields = ['text', 'message', 'answer', 'response', 'result'];
      for (const field of possibleContentFields) {
        if (result[field]) {
          return { content: result[field] };
        }
      }
      // 如果找不到内容字段，将整个对象序列化
      return { content: JSON.stringify(result) };
    }

    return result;
  } catch (error) {
    console.error('AI服务调用失败:', error);

    // 记录失败的请求内容，便于调试
    if (import.meta.env.DEV) {
      console.log('失败的请求内容:', message);
    }

    throw error;
  }
}; 