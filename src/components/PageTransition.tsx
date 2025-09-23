import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);
  const location = useLocation();
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    // Only animate if path actually changed
    if (location.pathname !== prevPath) {
      // Start exit animation
      setIsVisible(false);
      
      // After exit animation completes, update content and start enter animation
      const timer = setTimeout(() => {
        setDisplayChildren(children);
        setPrevPath(location.pathname);
        setIsVisible(true);
      }, 300); // Match --transition-smooth duration

      return () => clearTimeout(timer);
    }
  }, [location.pathname, children, prevPath]);

  // Initial mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div 
      className={`
        page-transition
        ${isVisible 
          ? 'opacity-100 translate-y-0 translate-x-0' 
          : 'opacity-0 translate-y-2 -translate-x-1'
        }
      `}
      style={{
        transitionProperty: 'opacity, transform',
        transitionDuration: '300ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {displayChildren}
    </div>
  );
};