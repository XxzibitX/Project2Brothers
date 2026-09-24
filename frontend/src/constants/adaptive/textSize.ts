export const textSize = {
  sm: "text-sm md:text-xs",

  md: "text-lg md:text-sm",

  hg: "!text-2xl !md:text-xl !lg:text-xl",

  castom: (from: number | string, to: number | string) => {
    if ( typeof from === "number" || typeof to === "number" ) {
      return `!text-[${from}px] !md:text-[${to}px]`
    }
    return `!text-${from} !md:text-${to}`
  }
} as const;