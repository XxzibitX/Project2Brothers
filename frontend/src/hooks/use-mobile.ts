import * as React from "react";

export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(
    window.innerWidth < breakpoint,
  );

  React.useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", onResize);
    onResize();

    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}