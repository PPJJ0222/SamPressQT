/**
 * 节流/防抖工具函数
 * 用于 PLC 数据更新等高频场景
 */

// 节流选项接口
interface ThrottleOptions {
  leading?: boolean   // 是否在开始时执行，默认 true
  trailing?: boolean  // 是否在结束时执行，默认 true
}

// 节流函数返回类型
interface ThrottledFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel: () => void
}

/**
 * 节流函数 - 限制函数在指定时间内只执行一次
 * @param fn 要节流的函数
 * @param wait 等待时间（毫秒）
 * @param options 配置选项
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  options: ThrottleOptions = {}
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options

  let lastTime = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const throttled = function (this: unknown, ...args: Parameters<T>) {
    const now = Date.now()

    // 首次调用且不需要 leading 执行
    if (!lastTime && !leading) {
      lastTime = now
    }

    const remaining = wait - (now - lastTime)

    if (remaining <= 0 || remaining > wait) {
      // 可以执行
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      lastTime = now
      fn.apply(this, args)
    } else if (!timer && trailing) {
      // 设置 trailing 定时器
      lastArgs = args
      timer = setTimeout(() => {
        lastTime = leading ? Date.now() : 0
        timer = null
        if (lastArgs) {
          fn.apply(this, lastArgs)
          lastArgs = null
        }
      }, remaining)
    }
  } as ThrottledFunction<T>

  throttled.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    lastTime = 0
    lastArgs = null
  }

  return throttled
}

/**
 * 防抖函数 - 延迟执行，重复调用会重置计时器
 * @param fn 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @param immediate 是否立即执行
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  immediate = false
): ThrottledFunction<T> {
  let timer: ReturnType<typeof setTimeout> | null = null

  const debounced = function (this: unknown, ...args: Parameters<T>) {
    const callNow = immediate && !timer

    if (timer) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      timer = null
      if (!immediate) {
        fn.apply(this, args)
      }
    }, wait)

    if (callNow) {
      fn.apply(this, args)
    }
  } as ThrottledFunction<T>

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return debounced
}
