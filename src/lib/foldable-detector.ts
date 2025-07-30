/**
 * Samsung Z Fold 3 and Foldable Device Detection
 * Auto-applies responsive CSS classes for optimal UI experience
 */

export interface FoldableDevice {
  isFoldable: boolean;
  isExternalScreen: boolean;
  isInternalScreen: boolean;
  deviceType: 'z-fold-3' | 'z-flip' | 'other-foldable' | 'standard';
  screenWidth: number;
  screenHeight: number;
}

export class FoldableDetector {
  private static instance: FoldableDetector;
  private device: FoldableDevice;
  private mediaQueryListeners: MediaQueryList[] = [];

  constructor() {
    this.device = this.detectDevice();
    this.setupMediaQueryListeners();
    this.applyResponsiveClasses();
  }

  static getInstance(): FoldableDetector {
    if (!FoldableDetector.instance) {
      FoldableDetector.instance = new FoldableDetector();
    }
    return FoldableDetector.instance;
  }

  private detectDevice(): FoldableDevice {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const userAgent = navigator.userAgent.toLowerCase();

    // Samsung Z Fold 3 detection
    if (userAgent.includes('sm-f926') || userAgent.includes('galaxy fold')) {
      return {
        isFoldable: true,
        isExternalScreen: width <= 374 && height <= 832,
        isInternalScreen: width >= 768 && width <= 884,
        deviceType: 'z-fold-3',
        screenWidth: width,
        screenHeight: height
      };
    }

    // Samsung Z Flip detection
    if (userAgent.includes('sm-f711') || userAgent.includes('galaxy z flip')) {
      return {
        isFoldable: true,
        isExternalScreen: width <= 260 && height <= 512,
        isInternalScreen: width >= 414 && width <= 736,
        deviceType: 'z-flip',
        screenWidth: width,
        screenHeight: height
      };
    }

    // General foldable detection based on screen dimensions
    if (width <= 374 || height <= 653 || (width >= 768 && width <= 884)) {
      return {
        isFoldable: true,
        isExternalScreen: width <= 374,
        isInternalScreen: width >= 768 && width <= 884,
        deviceType: 'other-foldable',
        screenWidth: width,
        screenHeight: height
      };
    }

    return {
      isFoldable: false,
      isExternalScreen: false,
      isInternalScreen: false,
      deviceType: 'standard',
      screenWidth: width,
      screenHeight: height
    };
  }

  private setupMediaQueryListeners(): void {
    // Samsung Z Fold 3 external screen
    const zFoldExternal = window.matchMedia('(max-width: 374px) and (max-height: 832px)');
    const zFoldInternal = window.matchMedia('(min-width: 768px) and (max-width: 884px) and (orientation: landscape)');
    const generalFoldable = window.matchMedia('(max-width: 280px), (max-height: 653px)');

    const updateDevice = () => {
      this.device = this.detectDevice();
      this.applyResponsiveClasses();
    };

    zFoldExternal.addEventListener('change', updateDevice);
    zFoldInternal.addEventListener('change', updateDevice);
    generalFoldable.addEventListener('change', updateDevice);

    this.mediaQueryListeners = [zFoldExternal, zFoldInternal, generalFoldable];
  }

  private applyResponsiveClasses(): void {
    const body = document.body;
    const html = document.documentElement;

    // Remove existing foldable classes
    body.classList.remove('z-fold-external', 'z-fold-internal', 'foldable-compact', 'z-fold-3', 'z-flip');
    html.classList.remove('z-fold-external', 'z-fold-internal', 'foldable-compact', 'z-fold-3', 'z-flip');

    if (!this.device.isFoldable) return;

    // Apply device-specific classes
    body.classList.add(this.device.deviceType);
    html.classList.add(this.device.deviceType);

    if (this.device.isExternalScreen) {
      body.classList.add('z-fold-external', 'foldable-compact');
      html.classList.add('z-fold-external', 'foldable-compact');
      
      // Add data attributes for CSS targeting
      body.setAttribute('data-foldable-screen', 'external');
      body.setAttribute('data-device-type', this.device.deviceType);
    }

    if (this.device.isInternalScreen) {
      body.classList.add('z-fold-internal');
      html.classList.add('z-fold-internal');
      
      body.setAttribute('data-foldable-screen', 'internal');
      body.setAttribute('data-device-type', this.device.deviceType);
    }

    // Apply general foldable classes for very small screens
    if (this.device.screenWidth <= 280 || this.device.screenHeight <= 653) {
      body.classList.add('foldable-compact');
      html.classList.add('foldable-compact');
    }

    console.log('Foldable device detected:', this.device);
  }

  public getDevice(): FoldableDevice {
    return { ...this.device };
  }

  public isZFold3(): boolean {
    return this.device.deviceType === 'z-fold-3';
  }

  public isExternalScreen(): boolean {
    return this.device.isExternalScreen;
  }

  public isInternalScreen(): boolean {
    return this.device.isInternalScreen;
  }

  public getFoldableStyleOverrides(): { [key: string]: string } {
    if (!this.device.isFoldable) return {};

    const overrides: { [key: string]: string } = {};

    if (this.device.isExternalScreen) {
      overrides['--header-padding'] = '0.5rem';
      overrides['--button-padding'] = '0.25rem 0.5rem';
      overrides['--text-scale'] = '0.85';
      overrides['--spacing-scale'] = '0.75';
    }

    if (this.device.isInternalScreen) {
      overrides['--grid-columns'] = '1';
      overrides['--max-width'] = '100%';
    }

    return overrides;
  }

  public applyDynamicStyles(): void {
    const overrides = this.getFoldableStyleOverrides();
    const root = document.documentElement;

    Object.entries(overrides).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }

  public destroy(): void {
    this.mediaQueryListeners.forEach(mql => {
      mql.removeEventListener('change', () => {});
    });
    this.mediaQueryListeners = [];
  }
}

// Auto-initialize when DOM is ready
export function initializeFoldableDetector(): void {
  if (typeof window !== 'undefined') {
    const detector = FoldableDetector.getInstance();
    
    // Apply styles immediately
    detector.applyDynamicStyles();
    
    // Re-apply on window resize
    window.addEventListener('resize', () => {
      setTimeout(() => {
        detector.applyDynamicStyles();
      }, 100);
    });

    // Re-apply on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        detector.applyDynamicStyles();
      }, 300);
    });
  }
}

// Export for use in components
export default FoldableDetector;