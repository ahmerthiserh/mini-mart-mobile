import api from '@/config/api';

export type AnalyticsEventType = 'store_view' | 'product_view' | 'product_impression';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  id: number;
  timestamp: number;
}

class AnalyticsService {
  private queue: AnalyticsEvent[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  constructor() {
    // Automatically flush queued events every 8 seconds
    if (typeof setInterval !== 'undefined') {
      this.timer = setInterval(() => {
        this.flush();
      }, 8000);
    }
  }

  /**
   * Track a store visit / store details view
   */
  public trackStoreView(storeId: number) {
    if (!storeId) return;
    this.queue.push({
      type: 'store_view',
      id: Number(storeId),
      timestamp: Date.now(),
    });
  }

  /**
   * Track a product details page view
   */
  public trackProductView(productId: number) {
    if (!productId) return;
    this.queue.push({
      type: 'product_view',
      id: Number(productId),
      timestamp: Date.now(),
    });
  }

  /**
   * Track product impressions (when product cards scroll onto the visible screen)
   */
  public trackProductImpressions(productIds: number[]) {
    if (!productIds || productIds.length === 0) return;
    productIds.forEach((id) => {
      if (id) {
        this.queue.push({
          type: 'product_impression',
          id: Number(id),
          timestamp: Date.now(),
        });
      }
    });
  }

  /**
   * Batch dispatch all queued events to the backend API
   */
  public async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isFlushing) return;

    const eventsToSend = [...this.queue];
    this.queue = [];
    this.isFlushing = true;

    try {
      const response = await api.fetchWithTimeout(
        api.ENDPOINTS.ANALYTICS_TRACK,
        {
          method: 'POST',
          headers: api.getHeaders(),
          body: JSON.stringify({
            events: eventsToSend.map((e) => ({
              type: e.type,
              id: e.id,
            })),
          }),
        },
        5000 // 5 second timeout for analytics
      );

      if (!response.ok) {
        // If server failed, put events back in queue (limit to max 100 to avoid memory overflow)
        if (this.queue.length < 100) {
          this.queue = [...eventsToSend, ...this.queue];
        }
      }
    } catch (error) {
      console.warn('Analytics batch flush failed:', error);
      if (this.queue.length < 100) {
        this.queue = [...eventsToSend, ...this.queue];
      }
    } finally {
      this.isFlushing = false;
    }
  }
}

export const analytics = new AnalyticsService();
