# marcel-cv

Game-UI personal CV site. Next.js (App Router), TypeScript, React, Tailwind CSS v4.

## Run

```bash
npm install
cp .env.example .env.local   # fill in SMTP details for the contact form
npm run dev
```

## Structure

- `content/profile.ts` – **all copy and data**. Replace every `[placeholder]`.
- `app/page.tsx` – Recruiter mode (character sheet, abilities, inventory, quest log, contact)
- `app/hiring-manager/page.tsx` – Hiring manager mode (projects, accessibility approach, code)
- `app/explore/page.tsx` – Explore mode (quiz, trivia)
- `app/classic-cv/page.tsx` – plain, print-friendly CV (target of the skip link)
- `app/api/contact/route.ts` – contact form via nodemailer (honeypot + basic rate limit)
- `public/cv.pdf` – add your PDF CV here
- `public/avatar.png` – add your pixel avatar, then swap the placeholder in `components/CharacterSheet.tsx`

## Accessibility notes

- Modes are real links with `aria-current="page"`, not buttons.
- Ability bars are decorative (`aria-hidden`); the level is in the text.
- Pixel font only for small headings; body text uses Inter.
- `prefers-reduced-motion` is respected globally; focus outline is always visible.

## Pixel art assets

CC0 packs: https://kenney.nl/assets (check the licence of anything from elsewhere).
