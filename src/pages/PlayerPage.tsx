import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import logger from '../utils/logger';

export default function PlayerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Extract parameters from URL
  const videoId = searchParams.get('videoId');
  const url = searchParams.get('url');
  // We don't need directStreamUrl in this component
  const autoplay = searchParams.get('autoplay') === 'true';
  const mute = searchParams.get('mute') === 'true';
  const title = searchParams.get('title') || 'TeraBox Video Player';
  
  // Parse blockedDomains if provided
  const blockedDomainsParam = searchParams.get('blockedDomains');
  const blockedDomains = blockedDomainsParam ? JSON.parse(blockedDomainsParam) : ["https://pay4link.com/"];

  // State for player
  const [playerUrl, setPlayerUrl] = useState<string | null>(null);
  const [scriptInjected, setScriptInjected] = useState(false);
  const [showAdHelper, setShowAdHelper] = useState(true);
  const [clickCount, setClickCount] = useState(0);
  const [clicksCompleted, setClicksCompleted] = useState(false);
  const clicksCompletedRef = useRef(false);

  // Generate SEO metadata
  const pageTitle = `${title} - TeraBox Video Player | TeraBoxDownloaderPro`;
  const pageDescription = `Watch and download videos from TeraBox with our secure player. No login required, fast streaming and download options available.`;

  // Back button handler
  const handleBackClick = () => {
    navigate(-1);
  };

  // Create a script string that will include the blocked domains
  const getTabInterceptScript = (domains: string[]) => {
    // Create a string representation of the domains array
    const domainsArrayString = JSON.stringify(domains);
    
    return `
    // Check if script is already running to prevent duplicate injection
    if (!window.__tabInterceptRunning) {
      window.__tabInterceptRunning = true;
      console.log("[DEBUG] Tab intercept script starting...");
      
      // Store the list of domains to block
      const blockedDomains = ${domainsArrayString};
      console.log("[DEBUG] Blocked domains:", blockedDomains);
      
      // Function to check if a URL should be blocked
      function shouldBlockUrl(url) {
        // If the blockedDomains array is empty, block all
        if (blockedDomains.length === 0) {
          return true;
        }
        
        // Otherwise, check if the URL contains any of the blocked domains
        try {
          // Try to parse the URL
          let urlObj;
          try {
            urlObj = new URL(url);
          } catch (e) {
            // If URL parsing fails, just check the string directly
            return blockedDomains.some(domain => url.includes(domain));
          }
          
          // Check if the domain matches any in our blocked list
          return blockedDomains.some(domain => {
            // Extract domain from blocked domain string
            let blockedDomainObj;
            try {
              blockedDomainObj = new URL(domain);
              return urlObj.hostname === blockedDomainObj.hostname;
            } catch (e) {
              // If parsing fails, just check if the hostname includes the domain
              return urlObj.hostname.includes(domain);
            }
          });
        } catch (e) {
          console.error("[DEBUG] Error checking URL:", e);
          // If there's any error, block by default
          return true;
        }
      }
      
      // Override window.open with a version that checks against our blocked domains
      const __originalWindowOpen = window.open;
      window.open = function(url, target, features) {
        // Log the attempted URL opening
        console.log("[DEBUG] Attempted to open URL:", url);
        
        // Check if this URL should be blocked
        if (url && shouldBlockUrl(url)) {
          console.log("[DEBUG] Blocking new tab for domain:", url);
          // Return a fake window object that does nothing
          return {
            closed: false,
            close: function() { this.closed = true; }
          };
        } else {
          console.log("[DEBUG] Allowing new tab for domain:", url);
          // If not blocked, allow the original window.open to handle it
          return __originalWindowOpen.apply(this, arguments);
        }
      };
      
      // Aggressive capture of all link clicks
      document.addEventListener('click', function(e) {
        // Get the clicked element
        let target = e.target;
        
        // Check if the clicked element or any of its parents is an anchor tag
        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }
        
        // If it's a link that would open in a new tab/window, check if we should block it
        if (target && target.href && (target.target === '_blank' || target.getAttribute('rel') === 'noopener')) {
          if (shouldBlockUrl(target.href)) {
            console.log("[DEBUG] Prevented click on link that would open new tab:", target.href);
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }
      }, true);
      
      console.log("[DEBUG] Tab intercept script fully installed with domain blocking");
    }
  `;
  };
  
  // Function to inject the script into the main document
  const injectTabInterceptScript = () => {
    if (scriptInjected) return;
    
    try {
      const scriptElement = document.createElement('script');
      scriptElement.textContent = getTabInterceptScript(blockedDomains);
      document.head.appendChild(scriptElement);
      setScriptInjected(true);
      logger.log('[PlayerPage] Tab intercept script injected with blocked domains:', blockedDomains);
    } catch (error) {
      logger.error('[PlayerPage] Error injecting tab intercept script:', error);
    }
  };

  // Function to send a postMessage to the iframe to install the script
  const sendScriptToIframe = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    try {
      iframeRef.current.contentWindow.postMessage({
        type: 'INSTALL_SCRIPT',
        script: getTabInterceptScript(blockedDomains)
      }, '*');
      
      logger.log('[PlayerPage] Sent script installation message to iframe');
    } catch (error) {
      logger.error('[PlayerPage] Error sending script message to iframe:', error);
    }
  };

  // Handler for when iframe loads
  const handleIframeLoad = () => {
    logger.log('[PlayerPage] Iframe loaded');
    
    // Initially hide the ad helper until we're confident the ad button has loaded
    setShowAdHelper(false);
    setClickCount(0);
    setClicksCompleted(false);
    clicksCompletedRef.current = false;
    
    // Try both direct injection (will likely fail) and postMessage approach
    try {
      // Due to cross-origin restrictions, this will likely fail
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const iframeWindow = iframeRef.current.contentWindow;
        const iframeDoc = iframeWindow.document;
        
        const scriptElement = iframeDoc.createElement('script');
        scriptElement.textContent = getTabInterceptScript(blockedDomains);
        iframeDoc.head.appendChild(scriptElement);
        logger.log('[PlayerPage] Tab intercept script injected into iframe');
      }
    } catch (error) {
      logger.error('[PlayerPage] Could not inject script into iframe due to cross-origin policy:', error);
    }
    
    // Try the postMessage approach as an alternative
    sendScriptToIframe();
    
    // Wait for the ad button to load before showing the helper overlay
    setTimeout(() => {
      // Only show if clicks haven't been completed yet
      if (!clicksCompletedRef.current) {
        logger.log('[PlayerPage] Showing ad helper overlay after timeout');
        setShowAdHelper(true);
      }
    }, 3000); // 3 second delay
  };

  // Function to show success notification when all clicks are done
  const showSuccessNotification = () => {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '12px 24px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    notification.style.zIndex = '10000';
    notification.style.fontSize = '16px';
    notification.style.fontWeight = 'bold';
    notification.style.textAlign = 'center';
    notification.innerText = '✅ Ad verification complete! Video will play now.';
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 500);
    }, 5000);
  };

  // Manual close button for the ad helper
  const CloseButton = () => (
    <button
      onClick={() => {
        setShowAdHelper(false);
        setClicksCompleted(true);
        clicksCompletedRef.current = true;
      }}
      style={{
        position: 'absolute',
        top: '5px',
        right: '5px',
        background: 'rgba(0,0,0,0.5)',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold',
        zIndex: 101
      }}
    >
      ✕
    </button>
  );

  // Set up player URL
  useEffect(() => {
    if (!videoId) {
      logger.error('[PlayerPage] No video ID provided');
      return;
    }

    try {
      // Apply filter to remove leading "1" if present
      let filteredId = videoId;
      if (videoId.startsWith('1')) {
        filteredId = videoId.substring(1);
        logger.log('[PlayerPage] Filtered ID (removed leading 1):', filteredId);
      }
      
      // Use the direct TeraBox embed URL format
      const teraboxEmbedUrl = `https://www.1024terabox.com/sharing/embed?surl=${filteredId}&autoplay=${autoplay ? 'true' : 'false'}&mute=${mute ? 'true' : 'false'}`;
      
      // Set the player URL
      setPlayerUrl(teraboxEmbedUrl);
      
      logger.log('[PlayerPage] Using TeraBox embed URL:', teraboxEmbedUrl);
    } catch (error) {
      logger.error('[PlayerPage] Error setting player URL:', error);
    }
  }, [videoId, autoplay, mute]);

  // Inject script when component mounts
  useEffect(() => {
    injectTabInterceptScript();
    
    // Add a click capture event listener at the document level
    const captureClicks = (e: MouseEvent) => {
      // Check if this might be a click that would open a new tab
      const target = e.target as HTMLElement;
      if (!target) return;
      
      // If the click target is inside our iframe, it's potentially going to open a new tab
      const iframe = iframeRef.current;
      if (iframe && iframe.contains(target)) {
        // First, update the counter if the click is in the ad button area
        if (showAdHelper) {
          const iframeRect = iframe.getBoundingClientRect();
          const adButtonX = iframeRect.left + (iframeRect.width / 2);
          const adButtonY = iframeRect.top + (iframeRect.height * 0.6);
          
          // Define a region around the ad button where clicks should be counted
          const clickRegionWidth = 240;
          const clickRegionHeight = 50;
          const isInAdButtonRegion = 
            e.clientX >= adButtonX - clickRegionWidth/2 &&
            e.clientX <= adButtonX + clickRegionWidth/2 &&
            e.clientY >= adButtonY - clickRegionHeight/2 &&
            e.clientY <= adButtonY + clickRegionHeight/2;
          
          if (isInAdButtonRegion) {
            logger.log('[PlayerPage] Click detected in ad button area');
            
            // Update the click counter
            setClickCount(prev => {
              const newCount = prev + 1;
              logger.log(`[PlayerPage] Ad click registered. Click count: ${newCount}/8`);
              
              if (newCount >= 8) {
                // Mark as completed to ensure the overlay stays hidden
                setClicksCompleted(true);
                clicksCompletedRef.current = true;
                
                // Hide the helper immediately and after a short delay to ensure it's gone
                setShowAdHelper(false);
                setTimeout(() => setShowAdHelper(false), 500);
                setTimeout(() => setShowAdHelper(false), 1000);
                
                logger.log('[PlayerPage] Clicks completed, hiding overlay');
                
                // Display a success notification
                showSuccessNotification();
              }
              
              return newCount;
            });
          }
        }
        
        logger.log('[PlayerPage] Captured potential ad click inside iframe');
        // Allow the clicks to pass through to the iframe
      }
    };
    
    // Add the listener with capture phase to intercept before the default behavior
    document.addEventListener('click', captureClicks, true);
    
    return () => {
      document.removeEventListener('click', captureClicks, true);
    };
  }, [showAdHelper]);

  // Effect to ensure helper is hidden when clicks are completed
  useEffect(() => {
    if (clicksCompleted) {
      setShowAdHelper(false);
    }
  }, [clicksCompleted]);

  // If no videoId is provided, show an error
  if (!videoId) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Error Loading Video</h1>
        <p className="mb-4">No video ID was provided.</p>
        <button 
          onClick={handleBackClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="player-page-container container mx-auto p-4">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content="terabox video player, terabox online player, terabox stream, watch terabox videos, terabox downloader, terabox streaming" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="video.other" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={`/video-thumbnail-${videoId}.jpg`} />
        <meta property="og:video" content={playerUrl || ''} />
        
        {/* Twitter */}
        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        
        {/* Video Schema Markup */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            "name": title,
            "description": pageDescription,
            "thumbnailUrl": `/video-thumbnail-${videoId}.jpg`,
            "uploadDate": new Date().toISOString(),
            "contentUrl": playerUrl || '',
            "embedUrl": playerUrl || '',
            "potentialAction": {
              "@type": "WatchAction",
              "target": window.location.href
            }
          })}
        </script>
      </Helmet>
      {/* Header section with title and back button */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold truncate">{title}</h1>
        <button 
          onClick={handleBackClick}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md flex items-center transition-colors"
        >
          <span className="mr-2">←</span> Back
        </button>
      </div>

      {/* Main content area */}
      <div className="player-content">
        {/* Instructions section - moved above the video player */}
        <div className="instructions-container relative p-4 bg-gray-800 text-white rounded-lg mb-6">
          <CloseButton />
          <h2 className="text-xl font-bold mb-2">Video Instructions</h2>
          
          {showAdHelper && !clicksCompleted ? (
            <div className="ad-helper-container">
              <div className="bg-gray-900 p-4 rounded-lg border-2 border-blue-500">
                <h3 className="text-lg font-bold text-blue-400 mb-2">
                  Ad Verification Required
                </h3>
                
                <p className="mb-4">
                  You need to click the <span className="font-bold text-blue-300">"Watch an advertisement"</span> button 8 times to access the video.
                </p>
                
                {/* Visual guidance */}
                <div className="ad-button-guidance flex items-center justify-center mb-4">
                  <div className="relative w-64 h-40 bg-gray-950 rounded border border-gray-700 flex items-center justify-center">
                    <div className="absolute top-2 left-2 text-xs text-gray-500">TeraBox Player</div>
                    
                    {/* Ad button representation */}
                    <div className="relative">
                      <div className="mb-2 text-yellow-400 text-sm font-bold animate-bounce">↓ CLICK HERE ↓</div>
                      <div className="py-2 px-4 bg-blue-600 text-white text-xs rounded-full animate-pulse">
                        Watch an advertisement
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Progress tracker */}
                <div className="progress-container">
                  <div className="flex justify-center gap-2 mb-2">
                    {[...Array(8)].map((_, i) => (
                      <div 
                        key={i}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          i < clickCount ? 'bg-green-500' : 'bg-gray-600'
                        }`}
                      >
                        {i < clickCount && <span className="text-white text-xs">✓</span>}
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-center">
                    Progress: <span className="font-bold text-green-400">{clickCount}/8</span> clicks
                  </p>
                  
                  <p className="text-center text-sm text-gray-400 mt-2">
                    Popup tabs will be automatically blocked. You don't need to view any ads.
                  </p>
                </div>
              </div>
            </div>
          ) : clicksCompleted ? (
            <div className="bg-green-600 p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-1">✅ Ad Verification Complete!</h3>
              <p>Your video is now ready to play.</p>
            </div>
          ) : (
            <p>The video is loading. Please wait...</p>
          )}
        </div>

        {/* Video player section */}
        <div className="video-player-container w-full relative pt-[56.25%] bg-black rounded-lg overflow-hidden mb-6">
          {playerUrl && (
            <iframe
              ref={iframeRef}
              src={playerUrl}
              className="absolute top-0 left-0 w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="TeraBox Video Player"
              onLoad={handleIframeLoad}
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
            ></iframe>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          Source: {url && <span className="break-all">{url}</span>}
        </p>
      </div>
    </div>
  );
}