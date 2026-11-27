/**
 * The Long Spring: a ride through the rot, in three modes (the mission, the endless ride, the hunt).
 * Engine, pixel art (drawn by code), UI and styles all live in this folder. The only files it loads are the
 * fourteen pictures of the memories, from /public/long-spring/memories.
 *
 *   import { LongSpring } from "@/games/long-spring";
 *   export default function Page() { return <LongSpring exitHref="/portfolio#games" />; }
 *
 * Add ?tune to the address to get sliders for speed, monsters and density.
 */
export { LongSpring, type LongSpringProps } from "./src/ui/LongSpring";
