import { useIsMobile } from "@/hooks/use-mobile";

export function useGridConfig() {
  const isLg = useIsMobile(1540);
  const isSm = useIsMobile(1280);
  const isXs = useIsMobile(1030);

  // if (isXs) {
  //   return {
  //     grid: "grid-cols-2",
  //     gridSpan: "col-span-2",
  //   };
  // }
  // if (isSm) {
  //   return {
  //     grid: "grid-cols-4",
  //     gridSpan: "col-span-4",
  //   };
  // }
  // if (isLg) {
  //   return {
  //     grid: "grid-cols-5",
  //     gridSpan: "col-span-5",
  //   };
  // }

  // return {
  //   grid: "grid-cols-6",
  //   gridSpan: "col-span-6",
  // };
  
  if (isXs) {
    return {
      grid: "grid-cols-2",
      gridSpan: "col-span-2",
    };
  }
  if (isSm) {
    return {
      grid: "grid-cols-2",
      gridSpan: "col-span-2",
    };
  }
  if (isLg) {
    return {
      grid: "grid-cols-5",
      gridSpan: "col-span-5",
    };
  }

  return {
    grid: "grid-cols-5",
    gridSpan: "col-span-5",
    isLg,
    isSm,
    isXs,
  };
}