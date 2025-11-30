"use client";

import Progress from "@badrap/bar-of-progress";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const progress = new Progress({
  size: 3,
  color: "#10b981",
  className: "bar-of-progress z-30 shadow-sm ",
  delay: 100,
});

// this fixes safari jumping to the bottom of the page
// when closing the search modal using the `esc` key
if (typeof window !== "undefined") {  
  progress.start();
  progress.finish();
}

const NavigationLoadingBar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    progress.finish();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e) => {
      const target = e.target.closest("a");
      if (target && target.href && target.href.startsWith(window.location.origin)) {
        const isSamePage = target.href === window.location.href;
        progress.start();

        // Finish immediately if navigating to the same page
        if (isSamePage) {
          setTimeout(() => progress.finish(), 0);
        }
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return null;
};

export { NavigationLoadingBar };
