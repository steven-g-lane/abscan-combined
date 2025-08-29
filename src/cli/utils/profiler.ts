interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryBefore?: number;
  memoryAfter?: number;
  metadata?: Record<string, any>;
}

interface ProfilerOptions {
  enableMemoryTracking?: boolean;
  logToConsole?: boolean;
}

export class Profiler {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private options: ProfilerOptions;

  constructor(options: ProfilerOptions = {}) {
    this.options = {
      enableMemoryTracking: false,
      logToConsole: false, // Changed to false to reduce noise
      ...options
    };
  }

  start(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    if (this.options.enableMemoryTracking) {
      metric.memoryBefore = this.getMemoryUsage();
    }

    this.metrics.set(name, metric);
    
    if (this.options.logToConsole) {
      console.log(`⏱️  Starting: ${name}${metadata ? ` (${JSON.stringify(metadata)})` : ''}`);
    }
  }

  end(name: string): PerformanceMetric | undefined {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️  No metric found for: ${name}`);
      return undefined;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (this.options.enableMemoryTracking) {
      metric.memoryAfter = this.getMemoryUsage();
    }

    if (this.options.logToConsole) {
      const durationStr = this.formatDuration(metric.duration);
      const memoryStr = this.options.enableMemoryTracking && metric.memoryBefore && metric.memoryAfter
        ? ` | Memory: ${this.formatMemory(metric.memoryAfter - metric.memoryBefore)}`
        : '';
      console.log(`✅ Completed: ${name} in ${durationStr}${memoryStr}`);
    }

    return metric;
  }

  measure<T>(name: string, fn: () => T | Promise<T>, metadata?: Record<string, any>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        this.start(name, metadata);
        const result = await fn();
        this.end(name);
        resolve(result);
      } catch (error) {
        this.end(name);
        reject(error);
      }
    });
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  getSummary(): string {
    const metrics = this.getMetrics();
    const totalDuration = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    
    let summary = `\n📊 Performance Summary (Total: ${this.formatDuration(totalDuration)})\n`;
    summary += '═'.repeat(60) + '\n';
    
    metrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .forEach(metric => {
        const percentage = ((metric.duration || 0) / totalDuration * 100).toFixed(1);
        const duration = this.formatDuration(metric.duration || 0);
        summary += `${metric.name.padEnd(40)} ${duration.padStart(8)} (${percentage.padStart(5)}%)\n`;
      });
    
    return summary;
  }

  reset(): void {
    this.metrics.clear();
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms.toFixed(1)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  }

  private formatMemory(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb > 0 ? '+' : ''}${mb.toFixed(1)}MB`;
  }

  private getMemoryUsage(): number {
    return process.memoryUsage().heapUsed;
  }
}

// Global profiler instance for easy access
export const globalProfiler = new Profiler({
  enableMemoryTracking: true,
  logToConsole: true
});