/**
 * Performance Monitoring Utilities
 *
 * Track and report on application performance metrics
 */

interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'score'
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 100

  /**
   * Measure execution time of a function
   */
  async measure<T>(
    name: string,
    fn: () => T | Promise<T>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start

      this.recordMetric({
        name,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
      })

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric({
        name: `${name} (failed)`,
        value: duration,
        unit: 'ms',
        timestamp: Date.now(),
      })
      throw error
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Send to analytics if configured
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: metric.name,
        value: metric.value,
        event_category: 'Performance',
      })
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get average value for a metric
   */
  getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name)
    if (metrics.length === 0) return null

    const sum = metrics.reduce((acc, m) => acc + m.value, 0)
    return sum / metrics.length
  }

  /**
   * Clear all metrics
   */
  clearMetrics() {
    this.metrics = []
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const summary: Record<string, {
      count: number
      avg: number
      min: number
      max: number
      unit: string
    }> = {}

    this.metrics.forEach((metric) => {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          avg: 0,
          min: Infinity,
          max: -Infinity,
          unit: metric.unit,
        }
      }

      const s = summary[metric.name]
      s.count++
      s.min = Math.min(s.min, metric.value)
      s.max = Math.max(s.max, metric.value)
      s.avg = (s.avg * (s.count - 1) + metric.value) / s.count
    })

    return summary
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Measure Web Vitals
 */
export function measureWebVitals() {
  if (typeof window === 'undefined') return

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      performanceMonitor.recordMetric({
        name: 'LCP',
        value: entry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
      })
    }
  })

  try {
    observer.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (e) {
    // Not supported in all browsers
  }

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fidEntry = entry as any
      performanceMonitor.recordMetric({
        name: 'FID',
        value: fidEntry.processingStart - fidEntry.startTime,
        unit: 'ms',
        timestamp: Date.now(),
      })
    }
  })

  try {
    fidObserver.observe({ type: 'first-input', buffered: true })
  } catch (e) {
    // Not supported in all browsers
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShift = entry as any
      if (!layoutShift.hadRecentInput) {
        clsValue += layoutShift.value
        performanceMonitor.recordMetric({
          name: 'CLS',
          value: clsValue,
          unit: 'score',
          timestamp: Date.now(),
        })
      }
    }
  })

  try {
    clsObserver.observe({ type: 'layout-shift', buffered: true })
  } catch (e) {
    // Not supported in all browsers
  }

  // Time to First Byte (TTFB)
  if (window.performance && window.performance.timing) {
    const ttfb =
      window.performance.timing.responseStart -
      window.performance.timing.requestStart

    performanceMonitor.recordMetric({
      name: 'TTFB',
      value: ttfb,
      unit: 'ms',
      timestamp: Date.now(),
    })
  }
}

/**
 * Report performance metrics to console
 */
export function reportPerformanceMetrics() {
  const summary = performanceMonitor.getSummary()

  console.group('Performance Metrics Summary')
  Object.entries(summary).forEach(([name, stats]) => {
    console.log(
      `${name}:`,
      `avg: ${stats.avg.toFixed(2)}${stats.unit}`,
      `min: ${stats.min.toFixed(2)}${stats.unit}`,
      `max: ${stats.max.toFixed(2)}${stats.unit}`,
      `(${stats.count} samples)`
    )
  })
  console.groupEnd()
}

/**
 * Initialize performance monitoring
 */
export function initializePerformanceMonitoring() {
  if (typeof window === 'undefined') return

  measureWebVitals()

  // Report metrics in development
  if (process.env.NODE_ENV === 'development') {
    // Report every 30 seconds
    setInterval(reportPerformanceMetrics, 30000)
  }

  // Report on page unload
  window.addEventListener('beforeunload', () => {
    if (process.env.NODE_ENV === 'development') {
      reportPerformanceMetrics()
    }
  })
}

/**
 * Decorator for measuring function performance
 */
export function measurePerformance(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value

  descriptor.value = async function (...args: any[]) {
    return performanceMonitor.measure(
      `${target.constructor.name}.${propertyName}`,
      () => method.apply(this, args)
    )
  }

  return descriptor
}
