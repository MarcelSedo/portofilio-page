/**
 * The Long Spring: an endless ride through the rot. Self-contained: engine, pixel art (drawn by code),
 * UI and styles all live in this folder, nothing is loaded from files.
 *
 *   import { LongSpring } from "@/games/long-spring";
 *   export default function Page() { return <LongSpring exitHref="/portfolio#games" />; }
 *
 * Add ?tune to the address to get sliders for speed, monsters and density.
 */
export { LongSpring, type LongSpringProps } from "./src/ui/LongSpring";
