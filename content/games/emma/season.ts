// "Emma: The Matchmaker of Bramblewick", season one.
// Emma Woodhouse is Jane Austen's (1815, public domain); Bramblewick and everyone in it are invented,
// but each love story borrows a famous Austen plot:
//
// A  Miss Ashby & Mr Ravel – THE SECRET ENGAGEMENT (Frank Churchill and Jane Fairfax, "Emma").
//    They fell in love at Weymouth last summer and are secretly engaged. Ravel's rich aunt would cut him
//    off for marrying "that Ashby girl" (her money comes from trade), so he flirts loudly with Emma to hide it.
//    An anonymous pianoforte arrives at Ashby Hall. Chain: pianoforte → Mr Twine (who paid the carriage) →
//    the aunt's letter at the Crown → Polly (Miss Ashby cries over letters from Weymouth) → Mrs Nettle (Weymouth).
//
// B  Miss Pryce & Mr Hale – THE ENGAGEMENT THAT ISN'T HIS (Edward, Elinor and Lucy Steele, "Sense and Sensibility").
//    Two quiet readers in love. Miss Lake boasts of a four-year secret engagement to "Mr Hale", so Eleanor gives
//    him up with dignity. Twist: Miss Lake means the curate's brother Robert, and is about to marry him.
//    Chain: Cowper marked "E. P." → Eleanor ("nothing can ever come of it") → Miss Lake at the ball →
//    Mrs Penny ("she writes to R. Hale") → the curate about his brother → Robert's letter in the rack.
//
// C  Mrs Whitlock & Captain Fenwick – PERSUADED (Anne Elliot and Captain Wentworth, "Persuasion").
//    Eight years ago her godmother, Lady Pemberton, persuaded her to break with a penniless sailor. She married
//    an old, rich man, now dead. The sailor returns a rich captain: proud, cold, and still in love.
//    Chain: Jenkins and the replanted roses → Lady Pemberton at the ball (then Whitlock House opens) →
//    the old letter → Clara → the Captain denies it → his half-written letter at the Crown.
//
// D  Kitty & Mr Brampton – THE FARMER REFUSED (Harriet Smith and Robert Martin, "Emma").
//    Brampton proposed by letter; Kitty, on Emma's own advice, refused him. Both are miserable.
//    Twist: Kitty's school fees are paid by Mr Twine the draper: he is her father.
//    Chain: the posy → Jenkins (swallows on the bridge) → Kitty ("you said a farmer was beneath me") →
//    Brampton Farm opens → Brampton → the second letter he dares not send.
//
// How talking works: a line can need something you already know (any one of `needs`). Until then the person
// says their `wait` line, which ends with Emma's hint about where to look. Clicking fast doesn't help.

import type { Clue, Scenario, Speaker } from "./types";

const c = (id: string, cat: Clue["cat"], about: string[], truth: boolean, supports: string | undefined, text: string, next?: string): Clue => ({
  id, cat, about, truth, supports, text, next,
});

const clues: Clue[] = [
  // ---------- Emma's instincts ----------
  c("i-kitty-hale", "instinct", ["kitty", "hale"], false, undefined, "Miss Fairweather is far too good for a farmer. I told her so myself. Mr Hale will do beautifully."),
  c("i-ravel-emma", "instinct", ["ravel"], false, undefined, "Mr Ravel pays me such marked attention. Poor man, he must be in love with me."),
  c("i-fenwick-ashby", "instinct", ["fenwick", "georgiana"], false, undefined, "A captain wants a fortune, and Miss Ashby has one. Nothing could be more suitable."),

  // ---------- A: the secret engagement ----------
  c("a-piano", "secret", ["georgiana"], true, "A", "A brand-new pianoforte at Ashby Hall, sent from London with no name and no note.", "Mr Twine unpacked it. He will know who paid for the carriage."),
  c("a-dancecard", "heart", ["georgiana", "ravel"], true, "A", "Miss Ashby's dance card from the last assembly. Every dance is marked “E. R.”", "E. R.? Edmund Ravel, surely."),
  c("a-georgiana", "heart", ["georgiana", "fenwick"], true, undefined, "Miss Ashby: “Captain Fenwick talks of nothing but the weather at sea. I should die of boredom.”", "So much for my plan for the Captain."),
  c("a-twine", "secret", ["ravel", "georgiana"], true, "A", "Mr Twine: “The carriage was paid by a gentleman's man from the Crown. Mr Ravel's valet, I'd swear to it.”", "Mr Ravel lodges at the Crown. I shall look in."),
  c("a-ravel", "heart", ["ravel"], false, undefined, "Mr Ravel: “Miss Woodhouse, you are the only lady in Bramblewick worth a compliment.”", "He flirts so openly. Almost as if he wanted to be seen flirting."),
  c("a-aunt", "obstacle", ["ravel", "georgiana"], true, "A", "A letter from Mr Ravel's aunt: “Marry that Ashby girl, and you shall not have one penny of mine.”", "So that is why he hides it! Polly at Ashby Hall will know how Miss Ashby bears it."),
  c("a-polly", "heart", ["georgiana"], true, "A", "Polly: “Miss Ashby plays that new pianoforte every night, and cries over letters from Weymouth.”", "Weymouth! Mrs Nettle never stops talking about her summer at Weymouth."),
  c("a-nettle", "past", ["georgiana", "ravel"], true, "A", "Mrs Nettle: “At Weymouth a young gentleman pulled a rich young lady out of the sea. Fair hair, pink bonnet. Miss Ashby, I'd bet my teeth on it.”", "Fair hair, a pink bonnet, and his valet paying for pianos. I see it all now."),
  c("a-order", "heart", ["ravel", "georgiana"], true, "A", "Mr Twine's order book: gloves for Mr Ravel in “Ashby rose”, the very shade of Miss Ashby's gown."),
  c("a-nettle-rumour", "rumour", ["ravel"], false, undefined, "Mrs Nettle: “Mr Ravel hasn't a penny. He's here to catch an heiress, mark my words.”", "Mrs Nettle is wrong at least twice a day."),
  c("a-tom", "heart", ["ravel", "georgiana"], true, "A", "Tom: “Mr Ravel gives me a shilling to carry notes to Ashby Hall. Every single day!”"),
  c("a-pemberton", "obstacle", ["ravel"], true, undefined, "Lady Pemberton: “Mr Ravel will be very rich, if his aunt doesn't cut him off. She has views on whom he marries.”"),
  c("a-lake-rumour", "rumour", ["ravel"], false, undefined, "Miss Lake: “Mr Ravel is engaged to a duchess in London, I'm told.”"),
  c("o-dance", "heart", ["georgiana", "ravel"], true, "A", "Miss Ashby and Mr Ravel dance as if there were no one else in the room.", "Mr Fiddle plays for them. Musicians notice everything."),
  c("a-fiddle", "heart", ["ravel", "georgiana"], true, "A", "Mr Fiddle: “Mr Ravel asks for ‘Miss Ashby's waltz’ three times a night. I didn't know it had a name.”"),
  c("x-ball-list", "heart", ["georgiana", "ravel"], true, "A", "The master of ceremonies' list: Mr Ravel stood up with Miss Ashby four times, and with nobody else."),
  c("a-polly-0", "heart", ["georgiana"], true, undefined, "Polly: “Miss Ashby has turned down three proposals this year. Says she's waiting for someone.”", "Waiting for whom? Ashby Hall might tell me more than Polly will."),

  // ---------- B: the engagement that isn't his ----------
  c("b-cowper", "heart", ["hale", "eleanor"], true, "B", "A volume of Cowper in the curate's study. A slip of paper marks a poem, initialled “E. P.”", "E. P.? Eleanor Pryce. She is back from her father's rounds now: Dr Pryce's house is open."),
  c("b-sermon", "heart", ["hale"], true, "B", "Sermon notes on Charity. In the margin, again and again, a single letter: “E.”"),
  c("b-hale-kitty", "heart", ["hale", "kitty"], true, undefined, "Mr Hale: “Miss Fairweather? A sweet girl. We've never spoken of anything but the weather.”", "Hm. That is not at all how I planned it."),
  c("b-eleanor", "heart", ["eleanor", "hale"], true, "B", "Miss Pryce: “Mr Hale lends me books. Nothing more can ever come of it.”", "“Can ever”? Something stands in the way. Miss Lake looks very pleased with herself lately. She'll be at the ball."),
  c("b-borrowed", "heart", ["eleanor", "hale"], true, "B", "Miss Pryce's list of borrowed books. Every one comes from the vicarage library."),
  c("b-violets", "heart", ["eleanor"], true, "B", "Violets pressed in Miss Pryce's prayer book, picked this week.", "Old Jenkins saw the curate picking violets. So they were not for Kitty."),
  c("b-lake", "obstacle", ["hale", "eleanor"], false, undefined, "Miss Lake: “I have been secretly engaged to Mr Hale these four years! Don't tell a soul.”", "Engaged to the curate? Mrs Penny sees every letter Miss Lake writes."),
  c("b-penny", "secret", ["hale"], true, "B", "Mrs Penny: “Miss Lake writes every week to ‘R. Hale, Esq., London’. Our curate is a T.”", "R. Hale? I must ask the curate whether he has a brother."),
  c("b-hale-brother", "past", ["hale"], true, "B", "Mr Hale: “My brother Robert writes that he means to marry, against our mother's wishes. He didn't say whom.”", "One letter would settle it. The post office rack is full tonight."),
  c("b-robert", "secret", ["hale", "eleanor"], true, "B", "A letter in the rack from Robert Hale: “My dearest Dorcas, we marry on Saturday, whatever Mother says.”", "So the curate is free, and does not even know it."),
  c("b-penny-0", "rumour", [], true, undefined, "Mrs Penny: “So many letters this season! Everybody in Bramblewick is either in love or in debt.”"),
  c("b-parcel", "heart", ["eleanor", "hale"], true, "B", "A parcel of new books for Miss Pryce. Paid for by the Reverend Mr Hale."),
  c("b-jenkins-rumour", "rumour", ["hale", "kitty"], false, undefined, "Old Jenkins: “Saw the curate picking violets by the school wall. For Miss Fairweather, sure as eggs.”", "Violets! Then my plan is working. Isn't it?"),
  c("b-pike-rumour", "rumour", ["hale", "georgiana"], false, undefined, "Major Pike: “The curate is sweet on the heiress. Saw him bow to her twice!”"),
  c("o-window", "heart", ["hale", "eleanor"], true, "B", "Mr Hale does not dance. He sits by the window with Miss Pryce, and they share one book."),

  // ---------- C: persuaded ----------
  c("c-jenkins", "past", ["clara", "fenwick"], true, "C", "Old Jenkins: “Mrs Whitlock had me replant the roses the Captain gave her, years ago. Odd thing for a widow to want.”", "Whitlock House is shut up tonight. She is at the ball with her godmother, Lady Pemberton."),
  c("c-pemberton", "obstacle", ["clara", "fenwick"], true, "C", "Lady Pemberton: “Clara listened to me once, and broke with a penniless sailor. I was right: he had nothing then.”", "Nothing then, and a fortune now. Clara has gone home: Whitlock House is open."),
  c("c-letter", "past", ["clara", "fenwick"], true, "C", "An old letter, eight years old: “My dear Clara, if you will wait for me, I shall come back a captain. F. F.”", "I must speak to Clara."),
  c("c-print", "past", ["clara", "fenwick"], true, "C", "A print of HMS Laconia above the mantel. The Captain's ship, as it happens."),
  c("c-clara", "heart", ["clara", "fenwick"], true, "C", "Mrs Whitlock: “I was persuaded once, against my heart. He has every right to despise me now.”", "Does he despise her? The Captain lodges at the Crown."),
  c("c-fenwick", "obstacle", ["fenwick", "clara"], false, undefined, "Captain Fenwick: “Mrs Whitlock? I scarcely knew her. Excuse me.”", "He left in such a hurry that he forgot his pen, and a half-written letter on the table."),
  c("c-halfletter", "secret", ["fenwick", "clara"], true, "C", "A half-written letter: “I can be silent no longer. You pierce my soul. I have loved none but you. F. F.”"),
  c("c-tom", "heart", ["fenwick", "clara"], true, "C", "Tom: “The Captain walks past Whitlock House every night, and never knocks.”"),
  c("c-tom-rumour", "rumour", ["fenwick", "georgiana"], false, undefined, "Tom: “The Captain asked me the way to Ashby Hall. Going courting the heiress, I reckon!”", "Ha! I knew it."),
  c("c-pike", "past", ["fenwick"], true, "C", "Major Pike: “Fenwick took the Laconia through a hurricane, and talks of nothing but a lady he lost.”"),
  c("o-door", "heart", ["fenwick", "clara"], true, "C", "Captain Fenwick stands by the door all evening, watching Mrs Whitlock. She very carefully does not look at him."),
  c("c-twine", "heart", ["fenwick", "clara"], true, "C", "Mr Twine: “The Captain bought grey gloves. For a lady just out of mourning, he said.”"),

  // ---------- D: the farmer refused ----------
  c("d-posy", "heart", ["kitty", "brampton"], true, "D", "Field flowers pressed in Miss Fairweather's copybook. They grow only along Brampton's lane.", "Old Jenkins knows every lane, and who walks it."),
  c("d-jenkins", "heart", ["kitty", "brampton"], true, "D", "Old Jenkins: “Mr Brampton and Miss Kitty count swallows on the bridge every Sunday. Silly pair.”", "Every Sunday? Then why is she so miserable? I must ask her."),
  c("d-kitty", "obstacle", ["kitty", "brampton"], true, "D", "Miss Fairweather: “I refused Mr Brampton's letter, Miss Woodhouse. You said a farmer was beneath me.”", "Oh. Oh dear. I did say that. To Brampton Farm, and quickly."),
  c("d-register", "past", ["kitty"], true, undefined, "The school register: Miss Fairweather's fees are paid every quarter by Mr Twine, the draper.", "Mr Twine? Whatever for?"),
  c("d-twine", "past", ["kitty", "brampton"], true, "D", "Mr Twine, quietly: “She's my daughter, miss. She doesn't know. I'd rather she had an honest farmer than a fine gentleman who'd look down on her.”", "Her father wants the farmer. And I told her he was beneath her."),
  c("d-brampton", "heart", ["brampton", "kitty"], true, "D", "Mr Brampton: “She refused me. I've written to her again, but I daren't send it.”", "Where has he put that letter?"),
  c("d-draft", "secret", ["brampton", "kitty"], true, "D", "The second letter: “Miss Fairweather, I ask once more, and then never again…”"),
  c("d-ribbon", "heart", ["brampton", "kitty"], true, "D", "A yellow ribbon folded in the farmhouse Bible. Miss Fairweather wears yellow ribbons."),
  c("d-drawer", "heart", ["brampton"], true, "D", "The ribbon drawer: the last yellow ribbon went to a farmer, “for his sister”. Mr Brampton has no sister."),
  c("d-pemberton", "obstacle", ["kitty", "brampton"], true, "D", "Lady Pemberton: “A farmer at my ball? Certainly not. And now that girl has spent all evening watching the door.”"),
  c("d-nettle-rumour", "rumour", ["kitty", "brampton"], false, undefined, "Mrs Nettle: “A farmer for our Kitty? Never! Miss Woodhouse says she's meant for a gentleman.”"),
  c("o-kitty", "heart", ["kitty"], true, "D", "Miss Fairweather keeps looking at the door. Whoever she is waiting for was not invited.", "Who wasn't invited? Lady Pemberton decides that."),
];

const green: Speaker[] = [
  { who: "nettle", lines: [{ clue: "a-nettle-rumour" }, { clue: "a-nettle", needs: ["a-polly"] }, { clue: "d-nettle-rumour", needs: ["d-kitty"] }],
    wait: "Mrs Nettle: “Bring me some real news, Miss Woodhouse, and I'll trade you mine!” Emma: Everyone in Ashby Hall's kitchen tells her everything. Has Polly said anything new?" },
  { who: "polly", lines: [{ clue: "a-polly-0" }, { clue: "a-polly", needs: ["a-aunt"] }],
    wait: "Polly: “I mustn't gossip about the family, miss.” Emma: Not unless she thinks I know already. Why would Mr Ravel hide anything? The Crown might say." },
  { who: "jenkins", lines: [{ clue: "c-jenkins" }, { clue: "b-jenkins-rumour" }, { clue: "d-jenkins", needs: ["d-posy"] }],
    wait: "Old Jenkins: “Gardens, miss. Ask me about somebody's flowers.” Emma: Whose flowers? There was a posy in the schoolroom…" },
  { who: "tom", lines: [{ clue: "a-tom" }, { clue: "c-tom-rumour" }, { clue: "c-tom", needs: ["c-clara"] }],
    wait: "Tom: “I only know what I'm paid to carry, miss.” Emma: Then I'll ask him again once I know whom the Captain really came back for." },
];

export const season: Scenario = {
  id: "season",
  title: "The Matchmaker of Bramblewick",
  map: "village",
  mapName: "Bramblewick",
  people: [
    { id: "georgiana", name: "Miss Georgiana Ashby", short: "Miss Ashby", role: "heiress of Ashby Hall", sex: "f" },
    { id: "eleanor", name: "Miss Eleanor Pryce", short: "Miss Pryce", role: "the doctor's daughter", sex: "f" },
    { id: "clara", name: "Mrs Clara Whitlock", short: "Mrs Whitlock", role: "a young widow", sex: "f" },
    { id: "kitty", name: "Miss Kitty Fairweather", short: "Miss Fairweather", role: "a parlour-boarder at the school", sex: "f" },
    { id: "ravel", name: "Mr Edmund Ravel", short: "Mr Ravel", role: "a gentleman from London", sex: "m" },
    { id: "hale", name: "The Reverend Mr Thomas Hale", short: "Mr Hale", role: "the curate", sex: "m" },
    { id: "fenwick", name: "Captain Frederick Fenwick", short: "Captain Fenwick", role: "of the Navy, home from sea", sex: "m" },
    { id: "brampton", name: "Mr John Brampton", short: "Mr Brampton", role: "farmer at Brampton Farm", sex: "m" },
  ],
  speakers: {
    emma: { name: "Emma Woodhouse", role: "of Hartfield, matchmaker" },
    nettle: { name: "Mrs Nettle", role: "knows everything first" },
    polly: { name: "Polly", role: "housemaid at Ashby Hall" },
    jenkins: { name: "Old Jenkins", role: "gardener to half the village" },
    tom: { name: "Tom", role: "the errand boy" },
    twine: { name: "Mr Twine", role: "the draper" },
    penny: { name: "Mrs Penny", role: "the postmistress" },
    pemberton: { name: "Lady Pemberton", role: "hostess of the ball, Mrs Whitlock's godmother" },
    pike: { name: "Major Pike", role: "retired, and loud" },
    lake: { name: "Miss Dorcas Lake", role: "never misses a dance" },
    fiddle: { name: "Mr Fiddle", role: "first violin" },
  },
  pairs: {
    A: { woman: "georgiana", man: "ravel" },
    B: { woman: "eleanor", man: "hale" },
    C: { woman: "clara", man: "fenwick" },
    D: { woman: "kitty", man: "brampton" },
  },
  clues,
  instincts: ["i-kitty-hale", "i-ravel-emma", "i-fenwick-ashby"],
  green,
  houses: [
    { id: "ashby", name: "Ashby Hall", blurb: "The grandest house in Bramblewick, and the heiress inside it.",
      people: [{ who: "georgiana", lines: [{ clue: "a-georgiana" }], wait: "" }],
      items: [{ id: "pianoforte", label: "A new pianoforte", clue: "a-piano" }, { id: "dance-card", label: "A dance card", clue: "a-dancecard" }] },
    { id: "vicarage", name: "The Vicarage", blurb: "Where the curate writes his sermons, or says he does.",
      people: [{ who: "hale", lines: [{ clue: "b-hale-kitty" }, { clue: "b-hale-brother", needs: ["b-penny"] }],
        wait: "Mr Hale talks kindly about the weather. Emma: Some letters seem to be going to a different Mr Hale. Mrs Penny would know." }],
      items: [{ id: "cowper", label: "A book of poems", clue: "b-cowper" }, { id: "sermon", label: "Sermon notes", clue: "b-sermon" }] },
    { id: "pryce", name: "Dr Pryce's House", blurb: "The doctor is out. His daughter is in, reading.",
      locked: { needs: ["b-cowper", "b-sermon"], text: "Nobody answers. A neighbour says Miss Pryce is out on her father's rounds. Emma: She reads more than anyone in the village. Whose books does she read? The vicarage might know." },
      people: [{ who: "eleanor", lines: [{ clue: "b-eleanor" }], wait: "" }],
      items: [{ id: "borrowed", label: "A list of books", clue: "b-borrowed" }, { id: "violets", label: "A prayer book", clue: "b-violets" }] },
    { id: "whitlock", name: "Whitlock House", blurb: "A fine house, lately in mourning.",
      locked: { needs: ["c-pemberton"], text: "The shutters are closed. The maid says Mrs Whitlock is at the Assembly Rooms with her godmother. Emma: Then so shall I be. Lady Pemberton never stops talking." },
      people: [{ who: "clara", lines: [{ clue: "c-clara", needs: ["c-letter", "c-print"] }],
        wait: "Mrs Whitlock is perfectly polite, and tells you nothing at all. Emma: There is a drawer standing a little open, and a ship on the wall." }],
      items: [{ id: "old-letter", label: "A drawer, a little open", clue: "c-letter" }, { id: "print", label: "A ship in a frame", clue: "c-print" }] },
    { id: "school", name: "Mrs Hollis's School", blurb: "Twenty girls, one piano and Miss Fairweather.",
      people: [{ who: "kitty", lines: [{ clue: "d-kitty", needs: ["d-jenkins", "o-kitty"] }],
        wait: "Miss Fairweather blushes and changes the subject. Emma: A blush is a clue in itself. Who gave her the flowers in her copybook?" }],
      items: [{ id: "posy", label: "A copybook with flowers", clue: "d-posy" }, { id: "register", label: "The school register", clue: "d-register" }] },
    { id: "farm", name: "Brampton Farm", blurb: "Plain, warm and smelling of bread.",
      locked: { needs: ["d-kitty"], text: "Mr Brampton is out in the fields until dark. Emma: I hardly know what I would say to him. Not yet. Miss Fairweather may know more than I do." },
      people: [{ who: "brampton", lines: [{ clue: "d-brampton" }], wait: "" }],
      items: [{ id: "draft", label: "A letter he dares not send", clue: "d-draft", needs: ["d-brampton"] }, { id: "ribbon", label: "The family Bible", clue: "d-ribbon" }] },
    { id: "inn", name: "The Crown Inn", blurb: "Two gentlemen lodge here. Both are single.",
      people: [
        { who: "ravel", lines: [{ clue: "a-ravel" }], wait: "" },
        { who: "fenwick", lines: [{ clue: "c-fenwick", needs: ["c-clara"] }],
          wait: "Captain Fenwick talks about the weather at sea. Emma: Miss Ashby was right, it is very dull. I need a better question, about someone he once knew here. The old gardener remembers everyone." },
      ],
      items: [
        { id: "aunt-letter", label: "A letter on Mr Ravel's table", clue: "a-aunt", needs: ["a-twine"] },
        { id: "half-letter", label: "A half-written letter", clue: "c-halfletter", needs: ["c-fenwick"] },
      ] },
    { id: "draper", name: "Twine's Drapery", blurb: "Ribbons, gloves and every secret in Bramblewick.",
      people: [{ who: "twine", lines: [{ clue: "a-twine", needs: ["a-piano"] }, { clue: "c-twine", needs: ["c-clara"] }, { clue: "d-twine", needs: ["d-register"] }],
        wait: "Mr Twine: “I never discuss my customers, Miss Woodhouse.” Emma: Unless one already knows something. Has anything new arrived in the village lately? A parcel, a pianoforte?" }],
      items: [{ id: "order-book", label: "The order book", clue: "a-order" }, { id: "ribbon-drawer", label: "The ribbon drawer", clue: "d-drawer" }] },
    { id: "post", name: "The Post Office", blurb: "Every letter in the village passes through here.",
      people: [{ who: "penny", lines: [{ clue: "b-penny-0" }, { clue: "b-penny", needs: ["b-lake"] }],
        wait: "Mrs Penny: “I never read the direction on a letter. Hardly ever.” Emma: Whose letters would I want to know about? Somebody at the ball has been boasting." }],
      items: [{ id: "letter-rack", label: "The letter rack", clue: "b-robert", needs: ["b-hale-brother"] }, { id: "parcel", label: "A parcel of books", clue: "b-parcel" }] },
  ],
  ball: {
    name: "The Assembly Rooms",
    blurb: "There is a ball every evening this week. Everyone comes, and everyone talks.",
    guests: [
      { who: "pemberton", lines: [{ clue: "a-pemberton" }, { clue: "c-pemberton", needs: ["c-jenkins"] }, { clue: "d-pemberton", needs: ["d-kitty", "o-kitty"] }],
        wait: "Lady Pemberton: “I never interfere, Miss Woodhouse. Well, once.” Emma: Once? With whom? Old Jenkins knows the history of every garden, and every gardener's employer." },
      { who: "pike", lines: [{ clue: "b-pike-rumour" }, { clue: "c-pike", needs: ["c-pemberton", "c-print"] }],
        wait: "Major Pike: “Fenwick? Fine fellow. Won't talk about himself, though.” Emma: The Major needs a nudge. The Captain's ship, or the Captain's past." },
      { who: "lake", lines: [{ clue: "a-lake-rumour" }, { clue: "b-lake", needs: ["b-eleanor"] }],
        wait: "Miss Lake simpers and says she has a secret. Emma: Everyone has a secret. I shall find out whose heart hers concerns: whose did Miss Pryce say was out of reach?" },
      { who: "fiddle", lines: [{ clue: "a-fiddle", needs: ["o-dance", "x-ball-list"] }],
        wait: "Mr Fiddle: “I only watch the dancers, miss, never the gossip.” Emma: Then let me watch the dancers too." },
    ],
    watch: [
      { id: "o-dance", label: "The couple in the middle of the room", clue: "o-dance" },
      { id: "o-window", label: "Two people by the window", clue: "o-window" },
      { id: "o-door", label: "A gentleman by the door", clue: "o-door" },
      { id: "o-kitty", label: "A young lady watching the door", clue: "o-kitty" },
    ],
    items: [{ id: "ball-list", label: "The dance list", clue: "x-ball-list" }],
  },
  intro: [
    "Good evening! I am Emma Woodhouse of Hartfield, and I have never once been wrong about a match. Well. Hardly ever.",
    "This spring, Bramblewick has four young ladies and four gentlemen, all single. It is a scandal, and I mean to put it right.",
    "Every heart in this village has a story. Follow each one: every clue will tell us where to go next, and some doors only open once we know something.",
    "When you think you know, come home to Hartfield and announce all four engagements at once. I shall tell you whether you are right, though perhaps not where you are wrong.",
  ],
  letters: {
    georgiana: { from: "Mrs Ravel, Grosvenor Street, London", good: "His aunt relented, the moment she heard the pianoforte. We dance every dance, and I play every evening. Edmund says I am his one jewel. I let him say it often." },
    eleanor: { from: "Mrs Hale, the Vicarage", good: "Robert married Miss Lake on the Saturday, and Thomas proposed on the Sunday, after the sermon. He reads to me every evening. I say nothing, and smile." },
    clara: { from: "Mrs Fenwick, aboard HMS Laconia", good: "Eight years late, and worth every one of them. My godmother says she was wrong. I have learned to sleep through a storm at sea. Frederick has not." },
    kitty: { from: "Mrs Brampton, Brampton Farm", good: "Father gave me away himself. We have two cows, a dog and forty-one kinds of bird. John counted. You were wrong about him, Miss Woodhouse, and I have never been so happy." },
  },
};
