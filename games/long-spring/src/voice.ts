/** the browser's own voice for now (a woman's, soft and slow, if the browser has one); a recorded voice can replace it later */
export function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const all = window.speechSynthesis.getVoices();
  const en = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
  const wanted = ["Moira", "Fiona", "Serena", "Kate", "Tessa", "Martha", "Stephanie", "Karen", "Samantha", "Libby", "Sonia", "Hazel", "Emily", "Maisie", "Google UK English Female", "Female"];
  for (const w of wanted) {
    const v = en.find((x) => x.name.includes(w));
    if (v) return v;
  }
  return en.find((v) => /en[-_](IE|GB)/i.test(v.lang)) ?? en[0] ?? null;
}
/** read a text aloud, slowly; returns a function that stops it */
export function speak(text: string, onEnd?: () => void): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onEnd?.();
    return () => {};
  }
  const sy = window.speechSynthesis;
  sy.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.82;
  u.pitch = 1.02;
  const v = pickVoice();
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else u.lang = "en-GB";
  let done = false;
  u.onend = u.onerror = () => {
    if (!done) {
      done = true;
      onEnd?.();
    }
  };
  sy.speak(u);
  return () => {
    done = true;
    sy.cancel();
  };
}
