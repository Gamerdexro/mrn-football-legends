import { useState, useEffect } from 'react';

export const useDeviceDetection = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);
    const [isLowMemory, setIsLowMemory] = useState(false);

    useEffect(() => {
        const checkDevice = () => {
            const userAgent = navigator.userAgent.toLowerCase();
            const width = window.innerWidth;

            // Check RAM (if supported)
            // @ts-ignore - deviceMemory is not in standard TS lib yet
            const ram = (navigator as any).deviceMemory || 4; // Default to 4GB if unknown
            setIsLowMemory(ram < 4);

            // Detect iPad OS 13+ (often reports as Macintosh but has touch points)
            const isIpadOS = /macintosh/i.test(userAgent) && navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
            
            // Detect Standard Tablets
            const isTabletDevice = /ipad|playbook|silk/i.test(userAgent) || 
                                 (/android/i.test(userAgent) && !/mobile/i.test(userAgent));

            // Detect Mobile Phones
            const isMobileDevice = /mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

            // Responsive Logic
            // If it's a small screen, treat as mobile unless we know it's a tablet
            const isSmallScreen = width < 768;
            // If it's medium screen and touch enabled, likely a tablet
            const isMediumScreen = width >= 768 && width < 1024;
            const hasTouch = navigator.maxTouchPoints > 0;

            const mobile = isMobileDevice || (isSmallScreen && !isTabletDevice && !isIpadOS);
            const tablet = isTabletDevice || isIpadOS || (isMediumScreen && hasTouch);
            
            // Prioritize: Tablet > Mobile > Desktop
            if (tablet) {
                setIsTablet(true);
                setIsMobile(false);
                setIsDesktop(false);
            } else if (mobile) {
                setIsTablet(false);
                setIsMobile(true);
                setIsDesktop(false);
            } else {
                setIsTablet(false);
                setIsMobile(false);
                setIsDesktop(true);
            }
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        
        return () => window.removeEventListener('resize', checkDevice);
    }, []);

    return { isMobile, isTablet, isDesktop, isLowMemory };
};
