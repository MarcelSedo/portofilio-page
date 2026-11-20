"use client";

import { useEffect } from "react";

/**
 * A small side quest for people who open the developer console (F12).
 * Prints a greeting once per page load and adds window.marcel with a few commands.
 * Renders nothing on the page.
 */
const H = "font: 700 14px monospace; color: #0b1226; background: #f2b544; padding: 4px 8px;";
const T = "font: 13px/1.6 monospace; color: #5ec4b6;";
const D = "font: 13px/1.6 monospace;";
const C = "font: 700 13px monospace; color: #f2b544;";

const ART = String.raw`
   /\      ___________
  /__\    |  ________ |
  (••)    | |  >_    ||
 /|  |\   | |________||
  |__|    |___________|
  /  \       the dev
`;

type Api = {
  help: () => void;
  quest: () => void;
  answer: (word: string) => void;
  stack: () => void;
  hire: () => void;
};

export function ConsoleQuest() {
  useEffect(() => {
    const w = window as unknown as { marcel?: Api };
    if (w.marcel) return;

    const api: Api = {
      help() {
        console.log(
          "%cmarcel.quest()%c  a riddle\n%cmarcel.stack()%c  what this site is built with\n%cmarcel.hire()%c   the shortest path to me",
          C, D, C, D, C, D,
        );
      },
      quest() {
        console.log(
          "%c🧙 The wizard's riddle\n%cI have keys but open no locks.\nI have space but no room.\nYou can enter, but you can't go inside.\n\n%cAnswer with marcel.answer(\"…\")",
          H, D, T,
        );
      },
      answer(word) {
        const a = String(word ?? "").trim().toLowerCase();
        if (a === "keyboard" || a === "a keyboard" || a === "klávesnica") {
          console.log(
            "%c✓ Quest complete%c\n\nA keyboard. For many people it's the only way they use the web,\nso every part of this site works without a mouse.\nClose the console and try it: Tab, Enter, Esc. Even the village map and the game.\n\n%cReward: marcel.hire()",
            H, D, T,
          );
        } else {
          console.log("%cNot quite. Look down at your hands. 👀", T);
        }
      },
      stack() {
        console.table({
          Framework: "Next.js (App Router), React 19",
          Language: "TypeScript",
          Styles: "Tailwind CSS v4 + plain CSS",
          "Pixel art": "drawn by a Python script, so pictures and click targets line up",
          Accessibility: "native buttons and dialogs, focus management, reduced motion, forced colours",
          Backend: "none needed",
        });
      },
      hire() {
        console.log(
          "%cThanks for digging this deep.%c\nPeople who read consoles are my kind of people.\n\n%c→ " +
            `${location.origin}/contact`,
          H, D, C,
        );
      },
    };
    w.marcel = api;

    console.log(`%c${ART}`, "font: 12px/1.15 monospace; color: #5ec4b6;");
    console.log(
      "%cHello, fellow developer 👋%c\nYou opened the console, so you're my kind of visitor.\nThere's a side quest hidden here. Type %cmarcel.help()",
      H, D, C,
    );
  }, []);

  return null;
}
