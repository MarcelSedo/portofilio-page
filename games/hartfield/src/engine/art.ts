/** The pictures, drawn by tools/hartfield-art/build.py. */
import emma from "../assets/room-emma.png";
import gallery from "../assets/room-gallery.png";
import attic from "../assets/room-attic.png";
import hall from "../assets/room-hall.png";
import drawing from "../assets/room-drawing.png";
import dining from "../assets/room-dining.png";
import corridor from "../assets/room-corridor.png";
import kitchen from "../assets/room-kitchen.png";
import yard from "../assets/room-yard.png";
import stable from "../assets/room-stable.png";
import cast from "../assets/cast.png";
import seated from "../assets/seated.png";
import portraits from "../assets/portraits.png";
import icons from "../assets/icons.png";
import frame from "../assets/frame.png";
import frameDark from "../assets/frame-dark.png";
import titleRain from "../assets/title-rain.png";
import titleSun from "../assets/title-sun.png";

type Img = { src: string } | string;
const s = (i: Img) => (typeof i === "string" ? i : i.src);

export const ART = {
  rooms: { emma: s(emma), gallery: s(gallery), attic: s(attic), hall: s(hall), drawing: s(drawing), dining: s(dining), corridor: s(corridor), kitchen: s(kitchen), yard: s(yard), stable: s(stable) } as Record<string, string>,
  cast: s(cast), seated: s(seated), portraits: s(portraits), icons: s(icons),
  frame: s(frame), frameDark: s(frameDark), titleRain: s(titleRain), titleSun: s(titleSun),
};
