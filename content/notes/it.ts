// IT and programming notes, written in English by Marcel.
import type { Note } from "./types";

/** A code block for NoteBody: "```lang\n…" */
const code = (lang: string, src: string) => "```" + lang + "\n" + src.trim();

export const itNotes: Note[] = [
  {
    slug: "scss-as-a-tool-for-design-thinking",
    category: "it",
    kind: "Essay",
    title: "SCSS as a tool for design thinking: from single decisions to a design system",
    date: "2026-11-17",
    excerpt:
      "We usually treat SCSS as a way to write CSS faster. I think it can also be a way to think about design: to name decisions, relate them and turn them into rules.",
    body: [
      "_An early draft of a conference talk. Comments and disagreements are very welcome._",

      "We usually treat SCSS as a convenience: variables and nesting so we can write and organise CSS faster. I'd like to look at it from a different angle. SCSS can also be a tool for thinking about design itself.",
      "Every interface is built from hundreds of small design decisions: a colour here, a margin there, a font size, a breakpoint, what a button looks like when it's disabled. In plain CSS these decisions end up scattered across stylesheets as loose values. SCSS lets us do something more interesting with them: abstract them, give them names and turn them into a system of rules.",
      "I came to this through work. I look after ID‑SK, the design system for Slovak government services, which grew out of GOV.UK Frontend. Reading GOV.UK's SCSS taught me more about what a design system is than any design tool did.",

      "## A design system is not a catalogue",
      "In a design tool like Figma we can define colour tokens, a type scale, spacing, components and their variants. That's genuinely useful. But it's easy to end up with a well-organised catalogue of decisions rather than a system.",
      "A system has an inner logic. It answers questions like these:",
      "- Why do we have exactly these colours, and how do they relate to each other?\n- Why does this component have more space around it than that one?\n- Which properties are universal and which depend on context?\n- Which rules are basic and which are derived?\n- Which combinations are allowed, and which break the system?",
      "These are questions about relationships, not values. And this is where code, and SCSS in particular, starts to help: it pushes us to write the relationships down.",

      "## What GOV.UK Frontend taught me",
      "GOV.UK Frontend organises its styles in layers that follow the idea of ITCSS, Harry Roberts's “inverted triangle”: from the most general and abstract at the top to the most specific at the bottom. Settings first (the scales, the palette, the breakpoints), then tools and helpers (functions and mixins), then base styles, objects, components and finally utilities and overrides.",
      "The triangle isn't only a folder structure. It's a question you have to answer every time you write a line of CSS: at which level does this decision belong? Is it a setting of the whole system, a rule that generates other rules, or a property of one component?",
      "The other thing GOV.UK does well is refuse values that aren't part of the system. Spacing, for example, comes from a fixed scale, and the helper function stops the build if you ask for a point that isn't on it. You can't sneak in a random 23px. The system has opinions, and it says them out loud.",

      "## From plain CSS to a system, in five steps",
      "This is the shape I'd like the workshop to take: start with ordinary CSS and transform it step by step. Here is the starting point, the kind of code every project has somewhere:",
      code(
        "css",
        `
.button {
  padding: 10px 15px;
  background: #1d70b8;
  color: #ffffff;
}
.button--danger { background: #d4351c; }

.card {
  padding: 30px;
  margin-bottom: 25px;
  border-left: 5px solid #1d70b8;
}

.alert {
  padding: 15px 20px;
  border: 5px solid #d4351c;
}`,
      ),
      "It works. But it can't answer any of the questions above. Is the card's blue the button's blue on purpose, or by coincidence? Why 30px and 25px? If the brand blue changes, how many places do we have to find?",

      "1. Name the values. The first step is the obvious one: variables. But naming is already a design act. As soon as you have to call something `$blue` or `$brand`, you notice that the same hex code was doing two different jobs.",
      code(
        "scss",
        `
$blue: #1d70b8;
$red: #d4351c;
$white: #ffffff;`,
      ),

      "2. Separate what a colour is from what it means. A palette says which colours exist. A second layer says what they are for. Now the card and the button don't share a colour by accident: they share a role.",
      code(
        "scss",
        `
@use "sass:map";

$palette: (
  "blue": #1d70b8,
  "red": #d4351c,
  "white": #ffffff,
  "black": #0b0c0c,
  "yellow": #ffdd00,
);

$roles: (
  "text": "black",
  "action": "blue",
  "on-action": "white",
  "error": "red",
  "on-error": "white",
  "focus": "yellow",
);

@function colour($role) {
  @if not map.has-key($roles, $role) {
    @error "Unknown colour role '#{$role}'. Use one of: #{map.keys($roles)}";
  }
  @return map.get($palette, map.get($roles, $role));
}`,
      ),

      "3. Turn preferences into rules. Instead of picking 30px and 25px by eye, define a scale and allow only its points. This is the step I find most important: a design decision becomes an explicit rule that can be checked. A value off the scale isn't a style question any more; it's an error.",
      code(
        "scss",
        `
// A scale like the one GOV.UK Frontend uses
$spacing-points: (
  0: 0, 1: 5px, 2: 10px, 3: 15px, 4: 20px,
  5: 25px, 6: 30px, 7: 40px, 8: 50px, 9: 60px,
);

@function spacing($point) {
  @if not map.has-key($spacing-points, $point) {
    @error "Spacing point #{$point} is not on the scale.";
  }
  @return map.get($spacing-points, $point);
}

.card {
  padding: spacing(6);
  margin-bottom: spacing(5);
}`,
      ),

      "4. Find what components have in common. Fifteen buttons in a design file are fifteen objects. In SCSS you have to ask what they share, what varies, and what never varies. The answer is a model of a button, not a collection of buttons.",
      code(
        "scss",
        `
@mixin button($role: "action") {
  display: inline-block;
  padding: spacing(2) spacing(3);
  border: 0;
  background: colour($role);
  color: colour("on-#{$role}");
}

.button { @include button; }
.button--danger { @include button("error"); }`,
      ),
      "Notice a small side effect. If someone asks for a button in a role that has no matching `on-` colour, the build fails. The system has just told us that this combination was never designed. In a catalogue, it would simply look slightly wrong on some page.",

      "5. Describe behaviour in context. Components aren't static pictures. A form field has a default state, an error state, a focus state, a disabled state, a mobile and a desktop layout. Mixins let us describe these as rules that any component can follow, so accessibility becomes part of the system rather than a fix applied later.",
      code(
        "scss",
        `
$breakpoints: ("tablet": 641px, "desktop": 769px);

@mixin from($breakpoint) {
  @media (min-width: map.get($breakpoints, $breakpoint)) {
    @content;
  }
}

@mixin focus-state {
  &:focus-visible {
    outline: 3px solid transparent; // stays visible in forced colours mode
    background: colour("focus");
    box-shadow: 0 -2px colour("focus"), 0 4px colour("text");
  }
}

.button {
  @include button;
  @include focus-state;

  @include from("tablet") {
    width: auto;
  }
}`,
      ),
      "After five steps the CSS that comes out is almost the same. What changed is that every value now has a reason, and the reasons are written down.",

      "## Isn't this what Tailwind does?",
      "Partly, and I want to be fair to it. Tailwind also has a theme: a spacing scale, a palette, breakpoints. It's fast, and many teams are productive with it.",
      "The difference I keep noticing is where the decisions live. With utility classes, the design rule is applied element by element, in the markup. The rule itself is implicit: it exists only as a pattern of repeated classes. Nothing forces you to name it. SCSS asks for the name first. Before you can write `@include button`, someone had to decide what a button is.",
      "So for me it isn't a question of which tool is better. It's a question of which kind of thinking each one encourages. Tailwind encourages composing. SCSS, used this way, encourages abstracting.",
      "And it isn't SCSS against modern CSS either. Custom properties are great for anything that changes at runtime, like themes. SCSS is good at what happens before the browser sees anything: logic, generation and validation. The two work well together. SCSS can generate the custom properties from the same maps:",
      code(
        "scss",
        `
:root {
  @each $role, $name in $roles {
    --colour-#{$role}: #{map.get($palette, $name)};
  }
}`,
      ),

      "## A philosopher's footnote",
      "There's an old distinction between the universal and the particular, between a rule and its application. A component on a page is a particular: one button, here, now. A design system is the structure of rules that makes such particulars possible and keeps them coherent.",
      "Design tools are very good at particulars. They show us what things look like. Code can be very good at the universal: it lets us say why things look the way they do, and check that they keep doing so. I think good design systems need both.",

      "## What I'd like to try",
      "For the talk I'd like to run a small experiment. Build the same tiny design system twice: once in Figma with variables, modes and components, and once in SCSS with maps, functions and mixins. Then compare not the results, but the questions each process made us ask. Where did we find hidden dependencies, redundancy or inconsistency? Did writing the system as code help us understand it better?",
      "My bet is that a real design system isn't just a set of visual components and token values. It's an abstract model of relationships, principles and rules. SCSS is one of the few everyday tools that lets us write that model down, explore it and test it.",
    ],
  },
  {
    slug: "how-not-to-put-an-llm-into-a-public-service",
    category: "it",
    kind: "Essay",
    title: "How (not) to put an LLM into a public service",
    date: "2026-11-17",
    excerpt:
      "A language model could help people talk to the state. Or it could become one more layer between them. The difference is rarely the model; it's the design around it.",
    body: [
      "_An early draft of a conference talk and discussion. I'd love to hear where you disagree._",

      "Most talk about AI in government is about efficiency: automating processes, cutting paperwork, saving civil servants' time. I'm interested in a different question. Can AI help the citizen talk to the state?",
      "Public digital services are usually built around how institutions are organised, not around how people think about their problems. To get anything done, you need to know what you're looking for, which office handles it, what the service is called, and how to read the administrative language around it. A language model could genuinely change that. It could help people find their way, explain procedures in plain words, help fill in forms, and make services more accessible.",
      "It can also make things worse. Here are the patterns I think are worth watching for, whoever builds the service.",

      "## Typical warning signs",
      "None of these is specific to one product. They show up again and again when a chat is added to an existing service, and you can usually spot them in the first round of usability testing:",
      "- People ignore the assistant, or use it only as a wizard for filters, because they don't know what it's for.\n- There are two ways to do the same thing, buttons and a text box, and people aren't sure which one they're supposed to use.\n- The assistant doesn't carry over what the user has already said, so they have to repeat themselves.\n- Help sits in a separate panel instead of in the places where people actually get stuck.\n- AI summaries sound fluent but don't make a complicated text any easier to understand, and don't say where their points come from.\n- Nobody tells people what not to type into the chat.",
      "Notice that none of these is a problem with the language model. Every one of them is a design problem.",

      "## The main mistake: AI as a layer, not as an answer",
      "The easiest way to add AI to a service is to put a chat on top of the interface that already exists. But if that interface has problems, such as an unclear information hierarchy, weak search, too much text or unclear forms, the chat doesn't fix them. It sits beside them and duplicates them. The user now has two interfaces to learn instead of one, and the problems of the first one are still there.",
      "I think this is the most common way to get AI in public services wrong. It starts from the technology (“we should have an assistant”) instead of from a user need (“people can't tell which services apply to them”). The result is a chatbot-shaped answer to a problem that was really about information architecture.",
      "A language model can't repair broken data or broken search either. If the underlying search returns the wrong results, a friendly summary on top of them just makes the wrong answer sound more convincing.",

      "## When it goes really wrong",
      "The stakes can be much higher than a confusing page. In 2024 [The Markup](https://themarkup.org/news/2024/03/29/nycs-ai-chatbot-tells-businesses-to-break-the-law) tested New York City's MyCity chatbot, built to help business owners navigate city rules, and found it confidently telling them things that were illegal: that employers could take a cut of workers' tips, or that businesses could refuse cash. The city added disclaimers and kept it running. In early 2026 the [new mayor announced](https://themarkup.org/artificial-intelligence/2026/01/30/mamdani-to-kill-the-nyc-ai-chatbot-we-caught-telling-businesses-to-break-the-law) he would shut it down.",
      "And the responsibility doesn't disappear into the machine. In Moffatt v. Air Canada (2024), a tribunal in British Columbia rejected the airline's argument that its chatbot was a separate entity responsible for its own words, and held the company liable for the wrong refund policy the bot had invented. If that applies to an airline, it applies to the state even more. Whatever an official assistant says, the institution says.",

      "## What doing it well looks like",
      "The UK's Government Digital Service has been testing [GOV.UK Chat](https://insidegovuk.blog.gov.uk/2026/03/16/5-things-we-learned-testing-gov-uk-chat-an-ai-assistant-for-government/) for about 18 months, with more than 10,000 users and 26,000 questions. What I find instructive isn't the technology but the restraint:",
      "- It answers only from GOV.UK guidance, and every answer links to the page it came from, so people can check it at the source.\n- It says it can make mistakes, and the onboarding explains what it's for, asks people to double-check answers, and says how conversation data is used.\n- It refuses questions outside government guidance, and asks a clarifying question when a query is ambiguous.\n- It doesn't handle personal information. The team's next step is to hand people over to the right department's support within the same interface.\n- It measures accuracy against the standard of published content, not against “good enough”. They report going from 76% to 90%, and they still treat the remaining 10% as the problem.",
      "There's also a legal floor now. Since August 2026, Article 50 of the EU AI Act requires that people are told, clearly and from the start, that they are interacting with an AI system. For a public service that's the minimum, not the goal.",

      "## Where AI fits, and where it doesn't",
      "For the talk I'd like to build a simple map. On one side, places where a language model can naturally complement an existing interface:",
      "- Translating the citizen's words into the state's words: “I'm starting a small bakery” into the right services and offices.\n- Explaining jargon and procedures in place, next to the official text, with a link to the source paragraph.\n- Summarising long documents, such as the conditions of a grant, while showing exactly where each point comes from.\n- Remembering what the user has already said, and using it, with their confirmation.\n- Offering plain-language or easy-read versions as an accessibility layer.",
      "On the other side, places where it's inappropriate or even harmful:",
      "- As a replacement for clear navigation, structure and search.\n- For decisions with legal consequences, such as eligibility, deadlines or obligations, unless a human-reviewed source backs every word.\n- As the only way to complete a task. A chat must never be a gate; it can only be a door next to the stairs.\n- Anywhere people might paste personal data without being told not to, or without knowing where it goes.\n- On top of data or search that are already wrong.",

      "## What I'd do instead",
      "If I were adding an assistant to a public service, I wouldn't start with the model at all.",
      "- Fix the page first: a clear hierarchy, the most important information first, one primary action, forms that explain themselves.\n- Give the assistant one job. Not “ask me anything”, but something like “tell me about your situation and I'll show you which services might fit, and why”.\n- One input model. Suggested answers as chips inside the conversation, not a separate set of buttons competing with it, and everything the user says carried into the filters, visibly, so they can check and correct it.\n- Put help where people struggle, next to the hard part of the page, not in a separate panel.\n- Every summary with links to the exact passages it summarises, and a plain statement that the official text is binding.\n- Tell people up front that they're talking to AI, what it can and can't do, and what not to type.\n- A way out: to the full text, to search, and to a human.\n- Test it early and often, with people who don't know the team, and with people using screen readers and other assistive technology.",

      "## The question I'd like to discuss",
      "I don't want to present AI as a universal solution, or as a threat. The interesting question is narrower: where does a language model make a public service genuinely clearer, more accessible and more centred on the citizen, and where does it just add another layer between the citizen and the state?",
      "My bet is that the best AI in public services will often be almost invisible: a better explanation in the right place, a form that remembers what you said, a search that understands your words. Not a chat window waiting in the corner for you to guess what to ask.",
    ],
  },
];
