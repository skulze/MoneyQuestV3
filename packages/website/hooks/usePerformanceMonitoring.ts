'use client';

import { useEffect, useRef, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  interactionToNextPaint: number;
}

interface NavigationTiming {
  navigationStart: number;
  loadEventEnd: number;
  domContentLoaded: number;
  domInteractive: number;
}

interface PerformanceData {
  metrics: Partial<PerformanceMetrics>;
  navigation: Partial<NavigationTiming>;
  userAgent: string;
  url: string;
  timestamp: number;
  sessionId: string;
}

export function usePerformanceMonitoring() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const sessionIdRef = useRef<string>('');

  // Generate or retrieve session ID
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // Check for Performance Observer support
  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
      'PerformanceObserver' in window &&
      'performance' in window
    );
  }, []);

  // Collect Core Web Vitals and other metrics
  useEffect(() => {
    if (!isSupported) return;

    const metrics: Partial<PerformanceMetrics> = {};
    const observers: PerformanceObserver[] = [];

    try {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        metrics.largestContentfulPaint = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observers.push(lcpObserver);

      // First Input Delay (FID) / Interaction to Next Paint (INP)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as any;
          if (entry.entryType === 'first-input') {
            metrics.firstInputDelay = fidEntry.processingStart - fidEntry.startTime;
          }
          if (entry.entryType === 'event') {
            // INP calculation
            const processingTime = fidEntry.processingEnd - fidEntry.processingStart;
            if (!metrics.interactionToNextPaint || processingTime > metrics.interactionToNextPaint) {
              metrics.interactionToNextPaint = processingTime;
            }
          }
        }
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        observers.push(fidObserver);
      } catch (e) {
        // First-input might not be supported
      }

      // Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        metrics.cumulativeLayoutShift = clsValue;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observers.push(clsObserver);

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
      observers.push(fcpObserver);

    } catch (error) {
      console.warn('Performance monitoring setup failed:', error);
    }

    // Collect navigation timing
    const collectNavigationTiming = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as any;
      if (navigation) {
        const timing: Partial<NavigationTiming> = {
          navigationStart: navigation.navigationStart || performance.timing?.navigationStart,
          loadEventEnd: navigation.loadEventEnd || performance.timing?.loadEventEnd,
          domContentLoaded: navigation.domContentLoadedEventEnd || performance.timing?.domContentLoadedEventEnd,
          domInteractive: navigation.domInteractive || performance.timing?.domInteractive,
        };

        // Calculate load time
        if (timing.loadEventEnd && timing.navigationStart) {
          metrics.loadTime = timing.loadEventEnd - timing.navigationStart;
        }

        const data: PerformanceData = {
          metrics,
          navigation: timing,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: Date.now(),
          sessionId: sessionIdRef.current,
        };

        setPerformanceData(data);
      }
    };

    // Wait for load event
    if (document.readyState === 'complete') {
      collectNavigationTiming();
    } else {
      window.addEventListener('load', collectNavigationTiming);
    }

    // Cleanup
    return () => {
      observers.forEach(observer => observer.disconnect());
      window.removeEventListener('load', collectNavigationTiming);
    };
  }, [isSupported]);

  const reportPerformance = async (data: PerformanceData) => {
    try {
      // In a real app, you would send this to your analytics service
      console.log('Performance Report:', data);

      // Example: Send to analytics endpoint
      // await fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });

      // Store in localStorage for demo purposes
      const reports = JSON.parse(localStorage.getItem('performanceReports') || '[]');
      reports.push(data);
      // Keep only last 10 reports
      if (reports.length > 10) {
        reports.splice(0, reports.length - 10);
      }
      localStorage.setItem('performanceReports', JSON.stringify(reports));

    } catch (error) {
      console.error('Failed to report performance:', error);
    }
  };

  const getPerformanceScore = (data: PerformanceData): { score: number; grade: string } => {
    const { metrics } = data;
    let score = 100;

    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5-4s, Poor: >4s)
    if (metrics.largestContentfulPaint) {
      if (metrics.largestContentfulPaint > 4000) score -= 30;
      else if (metrics.largestContentfulPaint > 2500) score -= 15;
    }

    // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (metrics.firstInputDelay) {
      if (metrics.firstInputDelay > 300) score -= 25;
      else if (metrics.firstInputDelay > 100) score -= 10;
    }

    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (metrics.cumulativeLayoutShift) {
      if (metrics.cumulativeLayoutShift > 0.25) score -= 20;
      else if (metrics.cumulativeLayoutShift > 0.1) score -= 10;
    }

    // Load time scoring (Good: <3s, Needs Improvement: 3-5s, Poor: >5s)
    if (metrics.loadTime) {
      if (metrics.loadTime > 5000) score -= 25;
      else if (metrics.loadTime > 3000) score -= 10;
    }

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
    return { score: Math.max(0, score), grade };
  };

  const measureInteraction = (interactionName: string) => {
    const startTime = performance.now();

    return {
      end: () => {
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Report interaction timing
        console.log(`Interaction "${interactionName}": ${duration.toFixed(2)}ms`);

        // Store interaction data
        const interactions = JSON.parse(localStorage.getItem('interactionTimings') || '[]');
        interactions.push({
          name: interactionName,
          duration,
          timestamp: Date.now(),
          sessionId: sessionIdRef.current,
        });

        // Keep only last 50 interactions
        if (interactions.length > 50) {
          interactions.splice(0, interactions.length - 50);
        }
        localStorage.setItem('interactionTimings', JSON.stringify(interactions));

        return duration;
      }
    };
  };

  return {
    performanceData,
    isSupported,
    reportPerformance,
    getPerformanceScore,
    measureInteraction,
  };
}