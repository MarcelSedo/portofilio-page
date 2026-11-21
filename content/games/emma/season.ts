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
// E  Miss Lyle & Colonel Hartley – THE DASHING ONE AND THE STEADY ONE (Marianne, Willoughby and Brandon, "Sense and Sensibility").
//    Sophia Lyle feels everything and adores Mr Willard, who carried her home in the rain. He is about to marry
//    an heiress for her money; years ago he ruined the Colonel's ward. The quiet Colonel rode all night for her.
// F  Miss Ward & Mr Grant – THE COUSIN NOBODY NOTICES (Fanny Price and Edmund Bertram, "Mansfield Park").
//    Edmund is dazzled by the lively Miss Crawley, who will not marry a clergyman. Fanny has loved him all along.
// G  Miss Morley & Mr Henry Tilden – THE GIRL WHO READS NOVELS (Catherine Morland and Henry Tilney, "Northanger Abbey").
//    General Tilden threw Kate out of Abbey House because the braggart Mr Thrupp lied about her fortune, twice.
//
// Every season picks four of these seven stories (and one more couple, just to confuse you), so the village
// is a little different each time.
//
// How talking works: a line can need something you already know (any one of `needs`). Until then the person
// says their `wait` line, which ends with Emma's hint about where to look. Clicking fast doesn't help.

import type { Clue, Scenario, Speaker } from "./types";

const c = (id: string, cat: Clue["cat"], about: string[], truth: boolean, supports: string | undefined, text: string, next?: string): Clue => ({
  id, cat, about, truth, supports, text, next,
});
/** a clue that belongs to more than one story (or to none: []) */
const t = (chain: string[], id: string, cat: Clue["cat"], about: string[], truth: boolean, supports: string | undefined, text: string, next?: string): Clue => ({
  ...c(id, cat, about, truth, supports, text, next),
  chain,
});

const clues: Clue[] = [
  // ---------- Emma's instincts ----------
  t(["D", "B"], "i-kitty-hale", "instinct", ["kitty", "hale"], false, undefined, "Miss Fairweather is far too good for a farmer. I told her so myself. Mr Hale will do beautifully."),
  t(["A"], "i-ravel-emma", "instinct", ["ravel"], false, undefined, "Mr Ravel pays me such marked attention. Poor man, he must be in love with me."),
  t(["C", "A"], "i-fenwick-ashby", "instinct", ["fenwick", "georgiana"], false, undefined, "A captain wants a fortune, and Miss Ashby has one. Nothing could be more suitable."),

  // ---------- A: the secret engagement ----------
  c("a-piano", "secret", ["georgiana"], true, "A", "A brand-new pianoforte at Ashby Hall, sent from London with no name and no note.", "Mr Twine unpacked it. He will know who paid for the carriage."),
  c("a-dancecard", "heart", ["georgiana", "ravel"], true, "A", "Miss Ashby's dance card from the last assembly. Every dance is marked “E. R.”", "E. R.? Edmund Ravel, surely."),
  t(["A", "C"], "a-georgiana", "heart", ["georgiana", "fenwick"], true, undefined, "Miss Ashby: “Captain Fenwick talks of nothing but the weather at sea. I should die of boredom.”", "So much for my plan for the Captain."),
  c("a-twine", "secret", ["ravel", "georgiana"], true, "A", "Mr Twine: “The carriage was paid by a gentleman's man from the Crown. Mr Ravel's valet, I'd swear to it.”", "Mr Ravel lodges at the Crown. I shall look in."),
  t(["A"], "a-ravel", "heart", ["ravel"], false, undefined, "Mr Ravel: “Miss Woodhouse, you are the only lady in Bramblewick worth a compliment.”", "He flirts so openly. Almost as if he wanted to be seen flirting."),
  c("a-aunt", "obstacle", ["ravel", "georgiana"], true, "A", "A letter from Mr Ravel's aunt: “Marry that Ashby girl, and you shall not have one penny of mine.”", "So that is why he hides it! Polly at Ashby Hall will know how Miss Ashby bears it."),
  c("a-polly", "heart", ["georgiana"], true, "A", "Polly: “Miss Ashby plays that new pianoforte every night, and cries over letters from Weymouth.”", "Weymouth! Mrs Nettle never stops talking about her summer at Weymouth."),
  c("a-nettle", "past", ["georgiana", "ravel"], true, "A", "Mrs Nettle: “At Weymouth a young gentleman pulled a rich young lady out of the sea. Fair hair, pink bonnet. Miss Ashby, I'd bet my teeth on it.”", "Fair hair, a pink bonnet, and his valet paying for pianos. I see it all now."),
  c("a-order", "heart", ["ravel", "georgiana"], true, "A", "Mr Twine's order book: gloves for Mr Ravel in “Ashby rose”, the very shade of Miss Ashby's gown."),
  t(["A"], "a-nettle-rumour", "rumour", ["ravel"], false, undefined, "Mrs Nettle: “Mr Ravel hasn't a penny. He's here to catch an heiress, mark my words.”", "Mrs Nettle is wrong at least twice a day."),
  c("a-tom", "heart", ["ravel", "georgiana"], true, "A", "Tom: “Mr Ravel gives me a shilling to carry notes to Ashby Hall. Riddles, they are. Miss Ashby hides them in her music.”", "In her music! The pianoforte at Ashby Hall."),
  c("a-charade", "secret", ["ravel", "georgiana"], true, "A", "Mr Ravel's charade, solved: WILLOW. “Beneath it I'll wait for you, out of sight.”", "The willow by the pond! I shall take an evening walk there."),
  t(["A"], "o-willow", "heart", ["georgiana", "ravel"], true, "A", "Under the willow by the pond: Miss Ashby and Mr Ravel, her hand in his. Not a flirt in sight."),
  t(["A"], "a-pemberton", "obstacle", ["ravel"], true, undefined, "Lady Pemberton: “Mr Ravel will be very rich, if his aunt doesn't cut him off. She has views on whom he marries.”"),
  t(["A"], "a-lake-rumour", "rumour", ["ravel"], false, undefined, "Miss Lake: “Mr Ravel is engaged to a duchess in London, I'm told.”"),
  t(["A"], "o-dance", "heart", ["georgiana", "ravel"], true, "A", "Miss Ashby and Mr Ravel dance as if there were no one else in the room.", "Mr Fiddle plays for them. Musicians notice everything."),
  c("a-fiddle", "heart", ["ravel", "georgiana"], true, "A", "Mr Fiddle: “Mr Ravel asks for ‘Miss Ashby's waltz’ three times a night. I didn't know it had a name.”"),
  t(["A"], "x-ball-list", "heart", ["georgiana", "ravel"], true, "A", "The master of ceremonies' list: Mr Ravel stood up with Miss Ashby four times, and with nobody else."),
  t(["A"], "a-polly-0", "heart", ["georgiana"], true, undefined, "Polly: “Miss Ashby has turned down three proposals this year. Says she's waiting for someone.”", "Waiting for whom? Ashby Hall might tell me more than Polly will."),

  // ---------- B: the engagement that isn't his ----------
  c("b-cowper", "heart", ["hale", "eleanor"], true, "B", "A volume of Cowper in the curate's study. A slip of paper marks a poem, initialled “E. P.”", "E. P.? Eleanor Pryce. She is back from her father's rounds now: Dr Pryce's house is open."),
  c("b-sermon", "heart", ["hale"], true, "B", "Sermon notes on Charity. In the margin, again and again, a single letter: “E.”"),
  t(["B", "D"], "b-hale-kitty", "heart", ["hale", "kitty"], true, undefined, "Mr Hale: “Miss Fairweather? A sweet girl. We've never spoken of anything but the weather.”", "Hm. That is not at all how I planned it."),
  c("b-eleanor", "heart", ["eleanor", "hale"], true, "B", "Miss Pryce: “Mr Hale lends me books. Nothing more can ever come of it.”", "“Can ever”? Something stands in the way. Miss Lake looks very pleased with herself lately. She'll be at the ball."),
  c("b-borrowed", "heart", ["eleanor", "hale"], true, "B", "Miss Pryce's list of borrowed books. Every one comes from the vicarage library."),
  c("b-violets", "heart", ["eleanor"], true, "B", "Violets pressed in Miss Pryce's prayer book, picked this week.", "Old Jenkins saw the curate picking violets. So they were not for Kitty."),
  t(["B"], "b-lake", "obstacle", ["hale", "eleanor"], false, undefined, "Miss Lake: “I have been secretly engaged to Mr Hale these four years! Don't tell a soul.”", "Engaged to the curate? Mrs Penny sees every letter Miss Lake writes."),
  c("b-penny", "secret", ["hale"], true, "B", "Mrs Penny: “Miss Lake writes every week to ‘R. Hale, Esq., London’. Our curate is a T.”", "R. Hale? I must ask the curate whether he has a brother."),
  c("b-hale-brother", "past", ["hale"], true, "B", "Mr Hale: “My brother Robert writes that he means to marry, against our mother's wishes. He didn't say whom.”", "One letter would settle it. The post office rack is full tonight."),
  c("b-robert", "secret", ["hale", "eleanor"], true, "B", "A letter in the rack from Robert Hale: “My dearest Dorcas, we marry on Saturday, whatever Mother says.”", "So the curate is free, and does not even know it."),
  t([], "b-penny-0", "rumour", [], true, undefined, "Mrs Penny: “So many letters this season! Everybody in Bramblewick is either in love or in debt.”"),
  c("b-parcel", "heart", ["eleanor", "hale"], true, "B", "A parcel of new books for Miss Pryce. Paid for by the Reverend Mr Hale."),
  t(["B", "D"], "b-jenkins-rumour", "rumour", ["hale", "kitty"], false, undefined, "Old Jenkins: “Saw the curate picking violets by the school wall. For Miss Fairweather, sure as eggs.”", "Violets! Then my plan is working. Isn't it?"),
  t(["B", "A"], "b-pike-rumour", "rumour", ["hale", "georgiana"], false, undefined, "Major Pike: “The curate is sweet on the heiress. Saw him bow to her twice!”"),
  t(["B"], "o-window", "heart", ["hale", "eleanor"], true, "B", "Mr Hale does not dance. He sits by the window with Miss Pryce, and they share one book."),

  // ---------- C: persuaded ----------
  c("c-jenkins", "past", ["clara", "fenwick"], true, "C", "Old Jenkins: “Mrs Whitlock had me replant the roses the Captain gave her, years ago. Odd thing for a widow to want.”", "Whitlock House is shut up tonight. She is at the ball with her godmother, Lady Pemberton."),
  c("c-pemberton", "obstacle", ["clara", "fenwick"], true, "C", "Lady Pemberton: “Clara listened to me once, and broke with a penniless sailor. I was right: he had nothing then.”", "Nothing then, and a fortune now. Clara has gone home: Whitlock House is open."),
  c("c-letter", "past", ["clara", "fenwick"], true, "C", "An old letter, eight years old: “My dear Clara, if you will wait for me, I shall come back a captain. F. F.”", "I must speak to Clara."),
  c("c-print", "past", ["clara", "fenwick"], true, "C", "A print of HMS Laconia above the mantel. The Captain's ship, as it happens."),
  c("c-clara", "heart", ["clara", "fenwick"], true, "C", "Mrs Whitlock: “I was persuaded once, against my heart. He has every right to despise me now.”", "Does he despise her? The Captain lodges at the Crown."),
  t(["C"], "c-fenwick", "obstacle", ["fenwick", "clara"], false, undefined, "Captain Fenwick: “Mrs Whitlock? I scarcely knew her. Excuse me.”", "He left in such a hurry that he forgot his pen, and a half-written letter on the table."),
  c("c-halfletter", "secret", ["fenwick", "clara"], true, "C", "The Captain's torn letter, pieced together: “You pierce my soul. I am half agony, half hope… I have loved none but you. F. F.”", "He must send it. Or I shall."),
  c("c-tom", "heart", ["fenwick", "clara"], true, "C", "Tom: “The Captain walks past Whitlock House every night, and never knocks.”"),
  t(["C", "A"], "c-tom-rumour", "rumour", ["fenwick", "georgiana"], false, undefined, "Tom: “The Captain asked me the way to Ashby Hall. Going courting the heiress, I reckon!”", "Ha! I knew it."),
  c("c-pike", "past", ["fenwick"], true, "C", "Major Pike: “Fenwick took the Laconia through a hurricane, and talks of nothing but a lady he lost.”"),
  t(["C"], "o-door", "heart", ["fenwick", "clara"], true, "C", "Captain Fenwick stands by the door all evening, watching Mrs Whitlock. She very carefully does not look at him."),
  c("c-twine", "heart", ["fenwick", "clara"], true, "C", "Mr Twine: “The Captain bought grey gloves. For a lady just out of mourning, he said.”"),

  // ---------- D: the farmer refused ----------
  c("d-posy", "heart", ["kitty", "brampton"], true, "D", "Field flowers pressed in Miss Fairweather's copybook. They grow only along Brampton's lane.", "Old Jenkins knows every lane, and who walks it."),
  c("d-jenkins", "heart", ["kitty", "brampton"], true, "D", "Old Jenkins: “Mr Brampton and Miss Kitty count swallows on the bridge every Sunday. Silly pair.”", "Every Sunday? Then why is she so miserable? I must ask her."),
  c("d-kitty", "obstacle", ["kitty", "brampton"], true, "D", "Miss Fairweather: “I refused Mr Brampton's letter, Miss Woodhouse. You said a farmer was beneath me.”", "Oh. Oh dear. I did say that. To Brampton Farm, and quickly."),
  t(["D"], "d-register", "past", ["kitty"], true, undefined, "The school register: Miss Fairweather's fees are paid every quarter by Mr Twine, the draper.", "Mr Twine? Whatever for?"),
  c("d-twine", "past", ["kitty", "brampton"], true, "D", "Mr Twine, quietly: “She's my daughter, miss. She doesn't know. I'd rather she had an honest farmer than a fine gentleman who'd look down on her.”", "Her father wants the farmer. And I told her he was beneath her."),
  c("d-brampton", "heart", ["brampton", "kitty"], true, "D", "Mr Brampton: “She refused me. I've written to her again, but I daren't send it.”", "Where has he put that letter?"),
  c("d-riddle", "heart", ["kitty", "brampton"], true, "D", "Kitty's riddle book, solved: SPARROW. Under it, in a farmer's square hand: “J. B.”", "J. B.: John Brampton. A sparrow on the bridge, waiting for an answer."),
  c("d-draft", "secret", ["brampton", "kitty"], true, "D", "The second letter: “Miss Fairweather, I ask once more, and then never again…”"),
  c("d-ribbon", "heart", ["brampton", "kitty"], true, "D", "A yellow ribbon folded in the farmhouse Bible. Miss Fairweather wears yellow ribbons."),
  c("d-drawer", "heart", ["brampton"], true, "D", "The ribbon drawer: the last yellow ribbon went to a farmer, “for his sister”. Mr Brampton has no sister."),
  t(["D"], "d-pemberton", "obstacle", ["kitty", "brampton"], true, "D", "Lady Pemberton: “A farmer at my ball? Certainly not. And now that girl has spent all evening watching the door.”"),
  t(["D"], "d-nettle-rumour", "rumour", ["kitty", "brampton"], false, undefined, "Mrs Nettle: “A farmer for our Kitty? Never! Miss Woodhouse says she's meant for a gentleman.”"),
  t(["D"], "o-kitty", "heart", ["kitty"], true, "D", "Miss Fairweather keeps looking at the door. Whoever she is waiting for was not invited.", "Who wasn't invited? Lady Pemberton decides that."),

  // ---------- E: the dashing one and the steady one ----------
  t(["E"], "i-sophia-willard", "instinct", ["sophia", "willard"], false, undefined, "Mr Willard and Miss Lyle! Romance itself. I shall take all the credit."),
  t(["E"], "e-ankle", "past", ["sophia"], true, undefined, "A muddy shawl by the fire. Miss Lyle turned her ankle on the hill in the rain last week, and Mr Willard carried her home.", "Mr Willard! He lodges at the Crown."),
  t(["E"], "e-sophia", "heart", ["sophia", "hartley"], true, undefined, "Miss Lyle: “Mr Willard reads Cowper exactly as it should be read. Colonel Hartley? He is five-and-thirty, and wears flannel waistcoats!”", "Poor Colonel. Mrs Lyle may see more than her daughter does."),
  t(["E"], "e-willard", "rumour", ["sophia"], false, undefined, "Mr Willard: “Miss Lyle? A charming girl. I have a lock of her hair, you know. I shall be quite settled by Michaelmas.”", "He boasts a good deal. Mrs Penny will know whom he writes to."),
  t(["E"], "e-penny", "secret", ["sophia"], true, undefined, "Mrs Penny: “Mr Willard writes every day to a Miss Grey of Grosvenor Street. Fifty thousand pounds, they say she has.”", "Fifty thousand pounds! Then what is he doing with Miss Lyle's hair? There was a torn letter at Lyle Cottage."),
  c("e-coldletter", "obstacle", ["sophia"], true, "E", "Mr Willard's letter, pieced together: he is to marry Miss Grey, and he returns Miss Lyle's lock of hair. She has not stopped crying since.", "And who rode for the doctor in the night? Cleve Lodge, the Colonel's house."),
  c("e-mother", "heart", ["hartley", "sophia"], true, "E", "Mrs Lyle: “The Colonel calls every day, sits an hour, and says almost nothing. But he listens to Sophia play as if it were church.”", "He listens. Cleve Lodge will open to me now. And Old Jenkins does the Colonel's garden."),
  c("e-jenkins", "heart", ["hartley", "sophia"], true, "E", "Old Jenkins: “The Colonel paid me to put rails along the hill path, after Miss Lyle fell. Said I wasn't to tell her.”", "So the hill is safe because of him. Major Pike served with the Colonel."),
  c("e-pike", "past", ["hartley"], true, "E", "Major Pike: “Hartley? Brought up an old love's daughter, Eliza, after her mother died. Some young blackguard ran off with the girl and left her with nothing.”", "Some young blackguard? Is there a letter about it at Cleve Lodge?"),
  c("e-letter", "secret", ["hartley"], true, "E", "A letter in the Colonel's desk, from Eliza: “He left me with nothing, and with a child. His name was John Willard.”", "Miss Lyle must hear of this, from someone kind."),
  c("e-colonel", "heart", ["hartley", "sophia"], true, "E", "Colonel Hartley: “I rode through the night to fetch her mother and the doctor. I would ride further. Please don't tell her it was I.”"),
  c("e-music", "heart", ["hartley", "sophia"], true, "E", "Music on the Colonel's stand: Miss Lyle's favourite songs, copied out in his own hand, every one."),
  t(["E"], "e-nettle-rumour", "rumour", ["sophia"], false, undefined, "Mrs Nettle: “Miss Lyle and Mr Willard will be married by Michaelmas, everybody says so!”"),

  // ---------- F: the cousin nobody notices ----------
  t(["F"], "i-edmund-crawley", "instinct", ["edmund"], false, undefined, "Mr Grant and that dazzling Miss Crawley. Even I could not have arranged it better."),
  t(["F"], "f-script", "secret", ["edmund", "fanny"], true, undefined, "The cast list for the Grange theatricals, ‘Lovers' Vows’: Mr Grant plays the lover opposite Miss Crawley. Miss Ward's name is crossed out. She refused to act.", "She refused? Miss Ward will be in the cold little east room."),
  c("f-fanny", "heart", ["fanny", "edmund"], true, "F", "Miss Ward: “Edmund has always been kind to me. He will marry Miss Crawley, and I shall be glad for him. I shall.”", "“I shall.” Twice. Miss Crawley is at the ball: I'll see for myself."),
  t(["F"], "f-crawley", "obstacle", ["edmund"], true, undefined, "Miss Crawley: “Edmund Grant? Charming. But he means to be a clergyman! A clergyman is nothing. He must give it up, if he wants me.”", "He'll never give it up. What does Mr Grant say of her?"),
  t(["F"], "f-edmund", "heart", ["edmund", "fanny"], true, undefined, "Mr Grant: “Miss Crawley is all that is lively. If only she did not laugh at the Church. Fanny? Fanny is… Fanny is always there.”", "Always there. There was a letter on his desk."),
  c("f-letter", "obstacle", ["edmund", "fanny"], true, "F", "Mr Grant's letter to his father: “Miss Crawley asks me to give up the Church. I cannot. Only Fanny has ever understood why.”"),
  c("f-polly", "heart", ["fanny", "edmund"], true, "F", "Polly: “My cousin's in service at Elmwood Grange. Miss Ward sits in the cold east room, and Mr Grant is the only one who ever thinks to have a fire lit for her.”", "Elmwood Grange, then."),
  c("f-tom", "heart", ["fanny", "edmund"], true, "F", "Tom: “Miss Ward walks to the church every morning to hear Mr Grant practise his sermons. Nobody else will listen to 'em.”"),
  c("f-twine", "heart", ["edmund", "fanny"], true, "F", "Mr Twine: “Mr Grant bought a plain gold chain, for a cross. Miss Crawley bought a necklace the same day, for the same cross. Funny.”", "Two chains for one cross. Which does Miss Ward wear? Her workbox might tell."),
  c("f-chain", "heart", ["fanny", "edmund"], true, "F", "Miss Ward's riddle, solved: CHAIN. She wears her cross on Mr Grant's plain gold chain, and keeps Miss Crawley's necklace in a drawer."),
  t(["F"], "f-nettle-rumour", "rumour", ["edmund"], false, undefined, "Mrs Nettle: “Mr Grant and Miss Crawley are as good as engaged! A London lady, and so lively!”"),

  // ---------- G: the girl who reads novels ----------
  t(["G"], "i-kate-thrupp", "instinct", ["kate"], false, undefined, "Mr Thrupp has a gig and a great deal to say. Just the thing for a young lady who loves adventures."),
  c("g-ledger", "heart", ["kate", "henry"], true, "G", "The library ledger: Miss Morley has borrowed ‘The Mysteries of Udolpho’ four times. So has Mr Henry Tilden, always the week after.", "He reads what she reads! Miss Morley lodges upstairs."),
  c("g-kate", "heart", ["kate", "henry"], true, "G", "Miss Morley: “Mr Tilden laughs at my novels, but he has read them all. He asked me to Abbey House, and then the General sent me away without a word!”", "Sent away? Abbey House will let me in now: I want a word with the General."),
  c("g-margin", "secret", ["henry", "kate"], true, "G", "A note in the library's Udolpho, in a man's hand: “K. — the Abbey has a black chest in the blue room. You will adore it. H. T.”", "A black chest! In a novel that means a murder. At Abbey House it may mean something else."),
  t(["G"], "g-general", "obstacle", ["kate", "henry"], true, undefined, "General Tilden: “Miss Morley? A fortune-hunter. Mr Thrupp told me so himself, after telling me she had thousands.”", "Mr Thrupp tells everyone everything. He'll be at the ball."),
  t(["G"], "g-thrupp-rumour", "rumour", ["kate"], false, undefined, "Mr Thrupp: “Kate Morley? Mad for me. Mad for my gig, anyway. Fastest gig in the county.”"),
  c("g-thrupp", "obstacle", ["kate", "henry"], true, "G", "Mr Thrupp: “I told the General she was rich, when I meant to marry her. Then I told him she was a beggar, when she wouldn't have me. Ha!”", "So the General believed both. Does Henry know?"),
  c("g-laundry", "secret", ["kate", "henry"], true, "G", "Inside the dreadful black chest: a laundry list. Pinned to it, a note: “Dear K., forgive me, I could not resist. I love you for every horrid novel you ever read. H.”"),
  c("g-henry", "heart", ["henry", "kate"], true, "G", "Mr Henry Tilden: “My father has insulted her. Tomorrow I ride to Miss Morley to beg her pardon, and her hand, whatever he says.”"),
  c("g-penny", "heart", ["henry", "kate"], true, "G", "Mrs Penny: “A letter every morning from Abbey House to the library. Same hand. Very small, very neat, and very long.”"),
  t(["G"], "g-nettle-rumour", "rumour", ["kate"], false, undefined, "Mrs Nettle: “Miss Morley thinks the General murdered his wife! Reads too many novels, that girl.”"),
];

const green: Speaker[] = [
  { who: "nettle", wait: "Mrs Nettle: “Bring me some real news, Miss Woodhouse, and I'll trade you mine!”",
    lines: [
      { clue: "a-nettle-rumour" }, { clue: "e-nettle-rumour" }, { clue: "f-nettle-rumour" }, { clue: "g-nettle-rumour" },
      { clue: "a-nettle", needs: ["a-polly"], hint: "Everyone in Ashby Hall's kitchen tells her everything. Has Polly said anything new?" },
      { clue: "d-nettle-rumour", needs: ["d-kitty"] },
    ] },
  { who: "polly", wait: "Polly: “I mustn't gossip about the family, miss.”",
    lines: [
      { clue: "a-polly-0" }, { clue: "f-polly" },
      { clue: "a-polly", needs: ["a-aunt"], hint: "Not unless she thinks I know already. Why would Mr Ravel hide anything? The Crown might say." },
    ] },
  { who: "jenkins", wait: "Old Jenkins: “Gardens, miss. Ask me about somebody's flowers.”",
    lines: [
      { clue: "c-jenkins" }, { clue: "b-jenkins-rumour" },
      { clue: "d-jenkins", needs: ["d-posy"], hint: "Whose flowers? There was a posy in the schoolroom…" },
      { clue: "e-jenkins", needs: ["e-mother"], hint: "He does the Colonel's garden too. What does the Colonel do for Miss Lyle? Mrs Lyle would know." },
    ] },
  { who: "tom", wait: "Tom: “I only know what I'm paid to carry, miss.”",
    lines: [
      { clue: "a-tom" }, { clue: "c-tom-rumour" },
      { clue: "c-tom", needs: ["c-clara"], hint: "I'll ask him again once I know whom the Captain really came back for." },
      { clue: "f-tom", needs: ["f-fanny"], hint: "Tom runs everywhere. Whom does Miss Ward walk out to hear? I should ask her first." },
    ] },
];

export const season: Scenario = {
  id: "season",
  title: "The Matchmaker of Bramblewick",
  map: "village",
  mapName: "Bramblewick",
  castSize: 4,
  chains: {
    A: { title: "The secret engagement", plot: "Emma: Frank Churchill and Jane Fairfax", reveal: "They have been secretly engaged since Weymouth. Mr Ravel only flirted with Emma to hide it from his aunt." },
    B: { title: "The engagement that isn't his", plot: "Sense and Sensibility: Edward, Elinor and Lucy Steele", reveal: "Miss Lake was engaged to the curate's brother Robert all along. Mr Hale was free, and never knew it." },
    C: { title: "Persuaded", plot: "Persuasion: Anne Elliot and Captain Wentworth", reveal: "Eight years ago she was persuaded to give him up. He came back a captain, and never stopped loving her." },
    D: { title: "The farmer refused", plot: "Emma: Harriet Smith and Robert Martin", reveal: "Kitty refused him on Emma's own advice. Her father, Mr Twine the draper, wanted the farmer all along." },
    E: { title: "The dashing one and the steady one", plot: "Sense and Sensibility: Marianne, Willoughby and Colonel Brandon", reveal: "Mr Willard was marrying an heiress for her money. The quiet Colonel rode all night for her, and said nothing." },
    F: { title: "The cousin nobody notices", plot: "Mansfield Park: Fanny Price and Edmund Bertram", reveal: "Mr Grant was dazzled by Miss Crawley, who will not marry a clergyman. Fanny had loved him all along." },
    G: { title: "The girl who reads novels", plot: "Northanger Abbey: Catherine Morland and Henry Tilney", reveal: "Mr Thrupp lied to the General about her fortune, twice. Henry loves her for every horrid novel she ever read." },
  },
  people: [
    { id: "georgiana", name: "Miss Georgiana Ashby", short: "Miss Ashby", role: "heiress of Ashby Hall", sex: "f", chain: "A",
      idle: "Miss Ashby: “Marriage? Not this season, Miss Woodhouse. I have a new pianoforte to learn.”" },
    { id: "eleanor", name: "Miss Eleanor Pryce", short: "Miss Pryce", role: "the doctor's daughter", sex: "f", chain: "B",
      idle: "Miss Pryce: “I am reading, Miss Woodhouse. It is the only sensible thing to do in spring.”" },
    { id: "clara", name: "Mrs Clara Whitlock", short: "Mrs Whitlock", role: "a young widow", sex: "f", chain: "C",
      idle: "Mrs Whitlock: “I am out of mourning, not out of my senses. I shall not marry again this year.”" },
    { id: "kitty", name: "Miss Kitty Fairweather", short: "Miss Fairweather", role: "a parlour-boarder at the school", sex: "f", chain: "D",
      idle: "Miss Fairweather: “Mrs Hollis says I'm too young to think of anything but French verbs.”" },
    { id: "sophia", name: "Miss Sophia Lyle", short: "Miss Lyle", role: "who feels everything", sex: "f", chain: "E",
      idle: "Miss Lyle: “I shall never love anyone, Miss Woodhouse. Nobody in Bramblewick reads poetry properly.”" },
    { id: "fanny", name: "Miss Fanny Ward", short: "Miss Ward", role: "the poor cousin at Elmwood Grange", sex: "f", chain: "F",
      idle: "Miss Ward: “Oh, I don't think anyone would want me, Miss Woodhouse. I'm quite happy as I am.”" },
    { id: "kate", name: "Miss Kate Morley", short: "Miss Morley", role: "who lodges over the library", sex: "f", chain: "G",
      idle: "Miss Morley: “I'm in the middle of a novel with a ghost in it. Do you think there are ghosts in Bramblewick?”" },
    { id: "ravel", name: "Mr Edmund Ravel", short: "Mr Ravel", role: "a gentleman from London", sex: "m", chain: "A",
      idle: "Mr Ravel: “I am only passing through, Miss Woodhouse. Bramblewick is charming, and very quiet.”" },
    { id: "hale", name: "The Reverend Mr Thomas Hale", short: "Mr Hale", role: "the curate", sex: "m", chain: "B",
      idle: "Mr Hale: “A curate's stipend keeps one very single, Miss Woodhouse.”" },
    { id: "fenwick", name: "Captain Frederick Fenwick", short: "Captain Fenwick", role: "of the Navy, home from sea", sex: "m", chain: "C",
      idle: "Captain Fenwick: “I go back to sea in a month. A sailor should not marry, ma'am.”" },
    { id: "brampton", name: "Mr John Brampton", short: "Mr Brampton", role: "farmer at Brampton Farm", sex: "m", chain: "D",
      idle: "Mr Brampton: “Lambing season, miss. I've no time to think of anything else.”" },
    { id: "hartley", name: "Colonel James Hartley", short: "Colonel Hartley", role: "of Cleve Lodge, five-and-thirty", sex: "m", chain: "E",
      idle: "Colonel Hartley: “I am too old for such things, Miss Woodhouse. Five-and-thirty.”" },
    { id: "edmund", name: "Mr Edmund Grant", short: "Mr Grant", role: "of Elmwood Grange, soon to be ordained", sex: "m", chain: "F",
      idle: "Mr Grant: “I am to be ordained at Christmas. I think of nothing else, I promise you.”" },
    { id: "henry", name: "Mr Henry Tilden", short: "Mr Tilden", role: "the General's younger son, of Abbey House", sex: "m", chain: "G",
      idle: "Mr Tilden: “Marriage, Miss Woodhouse? I haven't finished the novel I'm reading.”" },
  ],
  speakers: {
    emma: { name: "Emma Woodhouse", role: "of Hartfield, matchmaker" },
    nettle: { name: "Mrs Nettle", role: "knows everything first" },
    polly: { name: "Polly", role: "housemaid at Ashby Hall" },
    jenkins: { name: "Old Jenkins", role: "gardener to half the village" },
    tom: { name: "Tom", role: "the errand boy" },
    twine: { name: "Mr Twine", role: "the draper" },
    penny: { name: "Mrs Penny", role: "the postmistress" },
    pemberton: { name: "Lady Pemberton", role: "hostess of the ball" },
    pike: { name: "Major Pike", role: "retired, and loud" },
    lake: { name: "Miss Dorcas Lake", role: "never misses a dance" },
    fiddle: { name: "Mr Fiddle", role: "first violin" },
    mrslyle: { name: "Mrs Lyle", role: "Sophia's mother" },
    willard: { name: "Mr John Willard", role: "dashing, and lodging at the Crown" },
    crawley: { name: "Miss Mary Crawley", role: "lively, from London" },
    general: { name: "General Tilden", role: "of Abbey House" },
    thrupp: { name: "Mr John Thrupp", role: "has a gig, and talks about it" },
  },
  pairs: {
    A: { woman: "georgiana", man: "ravel" },
    B: { woman: "eleanor", man: "hale" },
    C: { woman: "clara", man: "fenwick" },
    D: { woman: "kitty", man: "brampton" },
    E: { woman: "sophia", man: "hartley" },
    F: { woman: "fanny", man: "edmund" },
    G: { woman: "kate", man: "henry" },
  },
  clues,
  instincts: ["i-kitty-hale", "i-ravel-emma", "i-fenwick-ashby", "i-sophia-willard", "i-edmund-crawley", "i-kate-thrupp"],
  green,
  houses: [
    { id: "ashby", chain: "A", name: "Ashby Hall", blurb: "The grandest house in Bramblewick, and the heiress inside it.",
      away: "The shutters are closed. Miss Ashby has gone to Bath for the season.",
      people: [{ who: "georgiana", lines: [{ clue: "a-georgiana" }], wait: "" }],
      items: [
        { id: "pianoforte", label: "A new pianoforte", clue: "a-piano" },
        { id: "dance-card", label: "A dance card", clue: "a-dancecard" },
        { id: "music-note", label: "A note folded into the music", clue: "a-charade", puzzle: "willow", needs: ["a-tom", "a-polly"] },
      ] },
    { id: "vicarage", chain: "B", name: "The Vicarage", blurb: "Where the curate writes his sermons, or says he does.",
      away: "A note on the door: the curate is visiting his mother in Kent.",
      people: [{ who: "hale", lines: [{ clue: "b-hale-kitty" }, { clue: "b-hale-brother", needs: ["b-penny"], hint: "Some letters seem to be going to a different Mr Hale. Mrs Penny would know." }],
        wait: "Mr Hale talks kindly about the weather." }],
      items: [{ id: "cowper", label: "A book of poems", clue: "b-cowper" }, { id: "sermon", label: "Sermon notes", clue: "b-sermon" }] },
    { id: "pryce", chain: "B", name: "Dr Pryce's House", blurb: "The doctor is out. His daughter is in, reading.",
      away: "Dr Pryce and his daughter are away in London.",
      locked: { needs: ["b-cowper", "b-sermon"], text: "Nobody answers. A neighbour says Miss Pryce is out on her father's rounds. Emma: She reads more than anyone in the village. Whose books does she read? The vicarage might know." },
      people: [{ who: "eleanor", lines: [{ clue: "b-eleanor" }], wait: "" }],
      items: [{ id: "borrowed", label: "A list of books", clue: "b-borrowed" }, { id: "violets", label: "A prayer book", clue: "b-violets" }] },
    { id: "whitlock", chain: "C", name: "Whitlock House", blurb: "A fine house, lately in mourning.",
      away: "Whitlock House is let to strangers this spring.",
      locked: { needs: ["c-pemberton"], text: "The shutters are closed. The maid says Mrs Whitlock is at the Assembly Rooms with her godmother. Emma: Then so shall I be. Lady Pemberton never stops talking." },
      people: [{ who: "clara", lines: [{ clue: "c-clara", needs: ["c-letter", "c-print"], hint: "There is a drawer standing a little open, and a ship on the wall." }],
        wait: "Mrs Whitlock is perfectly polite, and tells you nothing at all." }],
      items: [{ id: "old-letter", label: "A drawer, a little open", clue: "c-letter" }, { id: "print", label: "A ship in a frame", clue: "c-print" }] },
    { id: "school", chain: "D", name: "Mrs Hollis's School", blurb: "Twenty girls, one piano and Miss Fairweather.",
      away: "Mrs Hollis's girls are at home for the holidays.",
      people: [{ who: "kitty", lines: [{ clue: "d-kitty", needs: ["d-jenkins", "o-kitty"], hint: "A blush is a clue in itself. Who gave her the flowers in her copybook?" }],
        wait: "Miss Fairweather blushes and changes the subject." }],
      items: [
        { id: "posy", label: "A copybook with flowers", clue: "d-posy" },
        { id: "register", label: "The school register", clue: "d-register" },
        { id: "riddle-book", label: "Miss Fairweather's riddle book", clue: "d-riddle", puzzle: "sparrow" },
      ] },
    { id: "farm", chain: "D", name: "Brampton Farm", blurb: "Plain, warm and smelling of bread.",
      away: "Mr Brampton is at market in Highbury all week.",
      locked: { needs: ["d-kitty"], text: "Mr Brampton is out in the fields until dark. Emma: I hardly know what I would say to him. Not yet. Miss Fairweather may know more than I do." },
      people: [{ who: "brampton", lines: [{ clue: "d-brampton" }], wait: "" }],
      items: [{ id: "draft", label: "A letter he dares not send", clue: "d-draft", needs: ["d-brampton"] }, { id: "ribbon", label: "The family Bible", clue: "d-ribbon" }] },
    { id: "lyle", chain: "E", name: "Lyle Cottage", blurb: "A piano, a great many poems and a broken heart, or nearly.",
      away: "Lyle Cottage is shut. Mrs Lyle and her daughter are visiting cousins in Devon.",
      people: [
        { who: "sophia", lines: [{ clue: "e-sophia" }], wait: "" },
        { who: "mrslyle", chain: "E", lines: [{ clue: "e-mother", needs: ["e-sophia"], hint: "She'll speak of the Colonel once I've heard what Sophia thinks of him." }],
          wait: "Mrs Lyle: “Sophia feels everything, Miss Woodhouse. Everything.”" },
      ],
      items: [
        { id: "shawl", label: "A muddy shawl", clue: "e-ankle" },
        { id: "torn", label: "A letter torn in two", clue: "e-coldletter", puzzle: "willard", needs: ["e-penny"] },
      ] },
    { id: "cleve", chain: "E", name: "Cleve Lodge", blurb: "The Colonel's house: orderly, quiet, and full of music nobody hears.",
      away: "The Colonel is away with his regiment.",
      locked: { needs: ["e-mother"], text: "The Colonel's man says he is out riding. Emma: Mrs Lyle knows the Colonel's habits better than anyone." },
      people: [{ who: "hartley", lines: [{ clue: "e-colonel", needs: ["e-coldletter", "e-letter"], hint: "He won't speak of feelings. Not unless I know what has happened to Miss Lyle, or to him." }],
        wait: "Colonel Hartley bows, and says very little." }],
      items: [{ id: "music", label: "Music on the stand", clue: "e-music" }, { id: "desk", label: "A locked desk, unlocked", clue: "e-letter", needs: ["e-pike"] }] },
    { id: "grange", chain: "F", name: "Elmwood Grange", blurb: "A large house rehearsing a play nobody should be in.",
      away: "The family at Elmwood Grange is in Portsmouth.",
      people: [
        { who: "fanny", lines: [{ clue: "f-fanny" }], wait: "" },
        { who: "edmund", lines: [{ clue: "f-edmund", needs: ["f-crawley"], hint: "He talks only of Miss Crawley. I should meet her first: she'll be at the ball." }],
          wait: "Mr Grant is learning his lines, and barely looks up." },
      ],
      items: [
        { id: "script", label: "A play script", clue: "f-script" },
        { id: "workbox", label: "Miss Ward's workbox", clue: "f-chain", puzzle: "chain", needs: ["f-twine", "f-fanny"] },
        { id: "grant-letter", label: "A letter on the desk", clue: "f-letter", needs: ["f-edmund"] },
      ] },
    { id: "library", chain: "G", name: "The Circulating Library", blurb: "Novels, horrid novels, and Miss Morley upstairs.",
      away: "The library is open, but its lodger is away.",
      people: [{ who: "kate", lines: [{ clue: "g-kate" }], wait: "" }],
      items: [{ id: "ledger", label: "The lending ledger", clue: "g-ledger" }, { id: "udolpho", label: "A worn copy of Udolpho", clue: "g-margin" }] },
    { id: "abbey", chain: "G", name: "Abbey House", blurb: "Gothic windows, a General and a great many locked doors.",
      away: "Abbey House is shut. The General is in town.",
      locked: { needs: ["g-kate"], text: "A footman says the General is not at home to strangers. Emma: Who has lately been a guest at Abbey House? The library might know." },
      people: [
        { who: "general", chain: "G", lines: [{ clue: "g-general" }], wait: "" },
        { who: "henry", lines: [{ clue: "g-henry", needs: ["g-thrupp", "g-laundry"], hint: "He won't say a word against his father yet. What did the General hear about Miss Morley, and from whom?" }],
          wait: "Mr Tilden is charming, and talks about novels." },
      ],
      items: [{ id: "chest", label: "A black chest in the blue room", clue: "g-laundry", puzzle: "laundry", needs: ["g-margin"] }] },
    { id: "inn", name: "The Crown Inn", blurb: "Gentlemen lodge here. All of them single.",
      people: [
        { who: "ravel", lines: [{ clue: "a-ravel" }], wait: "" },
        { who: "fenwick", lines: [{ clue: "c-fenwick", needs: ["c-clara"], hint: "I need a better question, about someone he once knew here. The old gardener remembers everyone." }],
          wait: "Captain Fenwick talks about the weather at sea." },
        { who: "willard", chain: "E", lines: [{ clue: "e-willard" }], wait: "" },
      ],
      items: [
        { id: "aunt-letter", label: "A letter on Mr Ravel's table", clue: "a-aunt", needs: ["a-twine"] },
        { id: "half-letter", label: "Scraps of paper in the grate", clue: "c-halfletter", needs: ["c-fenwick"], puzzle: "letter" },
      ] },
    { id: "draper", name: "Twine's Drapery", blurb: "Ribbons, gloves and every secret in Bramblewick.",
      people: [{ who: "twine", wait: "Mr Twine: “I never discuss my customers, Miss Woodhouse.”", lines: [
        { give: { item: "string", text: "Mr Twine: “A violin string? For Mr Fiddle? No charge, miss. The village can't dance without him.”" }, needs: ["q-string"], chain: "A" },
        { clue: "a-twine", needs: ["a-piano"], hint: "Has anything new arrived in the village lately? A parcel, a pianoforte?" },
        { clue: "c-twine", needs: ["c-clara"], hint: "Gloves are always bought for someone. Whom does the Captain think about?" },
        { clue: "d-twine", needs: ["d-register"], hint: "The school register might show whose money pays for whom." },
        { clue: "f-twine", needs: ["f-script"], hint: "Theatricals need costumes, and presents. Elmwood Grange is putting on a play." },
      ] }],
      items: [{ id: "order-book", label: "The order book", clue: "a-order" }, { id: "ribbon-drawer", label: "The ribbon drawer", clue: "d-drawer" }] },
    { id: "post", name: "The Post Office", blurb: "Every letter in the village passes through here.",
      people: [{ who: "penny", wait: "Mrs Penny: “I never read the direction on a letter. Hardly ever.”", lines: [
        { clue: "b-penny-0" },
        { quest: { flag: "q-spectacles", text: "Mrs Penny: “Miss Lake's letters? I'd tell you the direction if I could read it! I've lost my spectacles. I was feeding the ducks this morning…” Emma: The pond, then. I shall look along the water." }, needs: ["b-lake"], chain: "B",
          hint: "Somebody at the ball has been boasting about an engagement. Whose letters would I want to know about?" },
        { clue: "b-penny", item: "spectacles", remind: "Mrs Penny: “Have you found my spectacles? I'm sure I had them by the ducks.” Emma: Something by the water. Among the reeds, perhaps." },
        { clue: "e-penny", needs: ["e-willard"], hint: "Who in this village writes to London every day? The gentleman at the Crown boasts a good deal." },
        { clue: "g-penny", needs: ["g-kate"], hint: "Has anyone been writing to the library lately? Miss Morley might know." },
      ] }],
      items: [{ id: "letter-rack", label: "The letter rack", clue: "b-robert", needs: ["b-hale-brother"] }, { id: "parcel", label: "A parcel of books", clue: "b-parcel" }] },
  ],
  ball: {
    name: "The Assembly Rooms",
    blurb: "There is a ball every evening this week. Everyone comes, and everyone talks.",
    guests: [
      { who: "pemberton", wait: "Lady Pemberton: “I never interfere, Miss Woodhouse. Hardly ever.”", lines: [
        { clue: "a-pemberton" },
        { clue: "c-pemberton", needs: ["c-jenkins"], hint: "Hardly ever? With whom? Old Jenkins knows the history of every garden, and every gardener's employer." },
        { clue: "d-pemberton", needs: ["d-kitty", "o-kitty"] },
      ] },
      { who: "pike", wait: "Major Pike: “What? Speak up, Miss Woodhouse!”", lines: [
        { clue: "b-pike-rumour" },
        { clue: "c-pike", needs: ["c-pemberton", "c-print"], hint: "The Major needs a nudge. The Captain's ship, or the Captain's past." },
        { clue: "e-pike", needs: ["e-jenkins"], hint: "The Major served in India. So did the Colonel. What has the Colonel been doing quietly?" },
      ] },
      { who: "lake", wait: "Miss Lake simpers and says she has a secret.", lines: [
        { clue: "a-lake-rumour" },
        { clue: "b-lake", needs: ["b-eleanor"], hint: "Everyone has a secret. Whose heart did Miss Pryce say was out of reach?" },
      ] },
      { who: "fiddle", wait: "Mr Fiddle: “I only watch the dancers, miss, never the gossip.”", lines: [
        { quest: { flag: "q-string", text: "Mr Fiddle: “Ping! My E string, in the middle of the waltz. Mr Twine sells catgut, if you'd be so kind, Miss Woodhouse?” Emma: To Twine's, then." }, needs: ["o-dance", "x-ball-list"], chain: "A",
          hint: "Then let me watch the dancers too." },
        { clue: "a-fiddle", item: "string", remind: "Mr Fiddle: “No string, no waltz, I'm afraid.” Emma: Mr Twine's drapery sells everything." },
      ] },
      { who: "crawley", chain: "F", wait: "Miss Crawley: “Darling Miss Woodhouse! Have you come to watch me be admired?”", lines: [{ clue: "f-crawley" }] },
      { who: "thrupp", chain: "G", wait: "Mr Thrupp: “Upon my soul, what a ball! Have you seen my horse?”", lines: [
        { clue: "g-thrupp-rumour" },
        { clue: "g-thrupp", needs: ["g-general"], hint: "He boasts about everything. I need something to ask him about. Who was sent away from Abbey House, and why?" },
      ] },
    ],
    watch: [
      { id: "o-dance", label: "The couple in the middle of the room", clue: "o-dance" },
      { id: "o-window", label: "Two people by the window", clue: "o-window" },
      { id: "o-door", label: "A gentleman by the door", clue: "o-door" },
      { id: "o-kitty", label: "A young lady watching the door", clue: "o-kitty" },
    ],
    items: [{ id: "ball-list", label: "The dance list", clue: "x-ball-list" }],
  },
  things: {
    spectacles: { name: "Mrs Penny's spectacles", icon: "👓" },
    string: { name: "A violin string", icon: "🎻" },
  },
  spots: [
    { id: "willow", label: "The willow by the pond", needs: ["a-charade"], clue: "o-willow", people: [["georgiana", 0, 0], ["ravel", 10, 0]] },
    { id: "reeds", label: "The reeds by the pond", needs: ["q-spectacles"], give: { item: "spectacles", text: "Something glints among the reeds by the pond: Mrs Penny's spectacles!" } },
  ],
  puzzles: [
    {
      id: "willow", kind: "charade", title: "A note for Ashby Hall",
      intro: "Folded into Miss Ashby's music: a charade in Mr Ravel's hand. Solve it, and you'll know where they meet.",
      verse: ["My first is the wish of a heart that is bold;", "my second, its cry when the evening turns cold.", "My whole bends its head by the water at night:", "beneath it I'll wait for you, out of sight."],
      answer: "WILLOW", extra: "ARNE", clue: "a-charade",
    },
    {
      id: "sparrow", kind: "charade", title: "Miss Fairweather's riddle book",
      intro: "Kitty copies riddles into a little book, as young ladies do. The last one isn't in her hand.",
      verse: ["My first is a fight that is friendly and fair;", "my second, the line of the girls on the stair.", "My whole is a bird on the bridge every day,", "who waits for an answer, and won't fly away."],
      answer: "SPARROW", extra: "LIT", clue: "d-riddle",
    },
    {
      id: "letter", kind: "letter", title: "Scraps in the grate",
      intro: "Captain Fenwick tore up his letter and threw it in the grate, but the fire had gone out. Put the strips back in order.",
      strips: [
        "I can be silent no longer.",
        "I must speak to you by such means as are within my reach.",
        "You pierce my soul. I am half agony, half hope.",
        "Tell me not that I am too late,",
        "that such precious feelings are gone for ever.",
        "I have loved none but you. F. F.",
      ],
      clue: "c-halfletter",
    },
    {
      id: "willard", kind: "letter", title: "A letter torn in two",
      intro: "Miss Lyle tore this letter in half and could not bring herself to burn it. Put the strips back in order.",
      strips: [
        "Madam, I am honoured by your letter,",
        "but I fear you have mistaken my attentions.",
        "My affections have long been engaged elsewhere,",
        "and I am shortly to be married to Miss Grey.",
        "I return, with my compliments, the lock of hair",
        "which you were so obliging as to give me. J. W.",
      ],
      clue: "e-coldletter",
    },
    {
      id: "chain", kind: "charade", title: "Miss Ward's workbox",
      intro: "Under the needles in Miss Ward's workbox, a riddle copied out in her small, careful hand.",
      verse: ["Two gifts for one cross: the first was too fine,", "the second was plain, and he meant it as mine.", "I wear the plain one and I don't say a word:", "my whole holds the cross like a nest holds a bird."],
      answer: "CHAIN", extra: "ROSE", clue: "f-chain",
    },
    {
      id: "laundry", kind: "charade", title: "The black chest in the blue room",
      intro: "Miss Morley was sure the black chest at Abbey House hid something dreadful. Someone has left a riddle on the lid.",
      verse: ["Within the black chest, by the light of a taper,", "you'll find the dread secret: a list on old paper.", "Six shirts and two cravats, four stockings, a band:", "my whole is the horror that comes to your hand."],
      answer: "LAUNDRY", extra: "GHOS", clue: "g-laundry",
    },
  ],
  questions: {
    georgiana: [
      { q: "Why does Mr Ravel flirt so loudly with Emma?", options: ["To hide a secret engagement", "Because he is in love with Emma", "To make Captain Fenwick jealous"], answer: 0 },
      { q: "Who sent the pianoforte to Ashby Hall?", options: ["Her late father's lawyer", "Mr Ravel, through his valet", "Captain Fenwick"], answer: 1 },
    ],
    eleanor: [
      { q: "Why has Miss Pryce given up hope?", options: ["Her father forbids it", "Mr Hale loves Miss Fairweather", "Miss Lake says she is engaged to “Mr Hale”"], answer: 2 },
      { q: "Whom is Miss Lake really going to marry?", options: ["Robert, the curate's brother", "The curate himself", "Major Pike"], answer: 0 },
    ],
    clara: [
      { q: "What parted Mrs Whitlock and the Captain eight years ago?", options: ["He married someone else", "Her godmother persuaded her", "He was lost at sea"], answer: 1 },
      { q: "What did the Captain throw in the grate?", options: ["A bill from Mr Twine", "His commission", "A letter saying he still loves her"], answer: 2 },
    ],
    kitty: [
      { q: "Why did Miss Fairweather refuse Mr Brampton?", options: ["Emma told her a farmer was beneath her", "She loves the curate", "Her father forbade it"], answer: 0 },
      { q: "Who is Kitty's father?", options: ["Major Pike", "Mr Twine, the draper", "Nobody knows"], answer: 1 },
    ],
    sophia: [
      { q: "To whom does Mr Willard write every day?", options: ["His tailor", "Miss Lyle's mother", "Miss Grey, an heiress in London"], answer: 2 },
      { q: "Who made the hill path safe after Miss Lyle fell?", options: ["Colonel Hartley", "Mr Willard", "The parish"], answer: 0 },
    ],
    fanny: [
      { q: "Why will Miss Crawley never marry Mr Grant?", options: ["He has no money", "He will not give up the Church", "He loves his cousin openly"], answer: 1 },
      { q: "Which chain does Miss Ward wear her cross on?", options: ["Miss Crawley's necklace", "None: she lost it", "The plain one Mr Grant bought"], answer: 2 },
    ],
    kate: [
      { q: "Why did the General send Miss Morley away?", options: ["Mr Thrupp told him she was poor", "She accused him of murder", "Henry asked him to"], answer: 0 },
      { q: "What was in the black chest?", options: ["A dead wife's letters", "A laundry list", "The General's will"], answer: 1 },
    ],
  },
  cameos: [
    { id: "mrsbennet", name: "Mrs Bennet", book: "Pride and Prejudice", lines: [
      { text: "You take delight in vexing me. You have no compassion for my poor nerves.", when: "start" },
      { text: "A single man of large fortune; four or five thousand a year. What a fine thing for our girls!" },
      { text: "If I can but see one of my daughters happily settled at Netherfield, and all the others equally well married, I shall have nothing to wish for.", when: "matched" },
    ] },
    { id: "lizzy", name: "Elizabeth Bennet", book: "Pride and Prejudice", lines: [
      { text: "I could easily forgive his pride, if he had not mortified mine.", when: "start" },
      { text: "I dearly love a laugh." },
      { text: "Till this moment I never knew myself.", when: "wrong" },
    ] },
    { id: "darcy", name: "Mr Darcy", book: "Pride and Prejudice", lines: [
      { text: "She is tolerable; but not handsome enough to tempt me.", when: "start" },
      { text: "In vain have I struggled. It will not do." },
      { text: "I have been meditating on the very great pleasure which a pair of fine eyes in the face of a pretty woman can bestow.", when: "found25" },
    ] },
    { id: "collins", name: "Mr Collins", book: "Pride and Prejudice", lines: [
      { text: "My reasons for marrying are, first, that I think it a right thing for every clergyman in easy circumstances (like myself) to set the example of matrimony in his parish.", when: "start" },
      { text: "It is usual with young ladies to reject the addresses of the man whom they secretly mean to accept, when he first applies for their favour.", when: "wrong" },
    ] },
    { id: "ladycath", name: "Lady Catherine de Bourgh", book: "Pride and Prejudice", lines: [
      { text: "If I had ever learnt, I should have been a great proficient.", when: "start" },
      { text: "I am not to be trifled with.", when: "found10" },
    ] },
    { id: "woodhouse", name: "Mr Woodhouse", book: "Emma", lines: [
      { text: "Pray do not make any more matches; they are silly things, and break up one's family circle grievously.", when: "start" },
      { text: "What a pity it is that Mr. Weston ever thought of her!", when: "matched" },
    ] },
    { id: "bates", name: "Miss Bates", book: "Emma", lines: [
      { text: "I shall be sure to say three dull things as soon as ever I open my mouth, shan't I?", when: "start" },
    ] },
    { id: "knightley", name: "Mr Knightley", book: "Emma", lines: [
      { text: "Better be without sense, than misapply it as you do.", when: "start" },
      { text: "It was badly done, indeed!", when: "wrong" },
      { text: "If I loved you less, I might be able to talk about it more.", when: "finale" },
    ] },
  ],
  intro: [
    "Good evening! I am Emma Woodhouse of Hartfield, and I have never once been wrong about a match. Well. Hardly ever.",
    "This spring, Bramblewick is simply full of single young people. Four couples, I am quite certain, belong together. The rest are… distractions.",
    "Every heart in this village has a story. Follow each one: every clue tells us where to go next, and some doors only open once we know something.",
    "Before I announce anything, I shall ask you a question or two about each young lady, to be sure you have really listened. Then: the ball, and the announcement!",
  ],
  letters: {
    georgiana: { from: "Mrs Ravel, Grosvenor Street, London", good: "His aunt relented, the moment she heard the pianoforte. We dance every dance, and I play every evening. Edmund says I am his one jewel. I let him say it often." },
    eleanor: { from: "Mrs Hale, the Vicarage", good: "Robert married Miss Lake on the Saturday, and Thomas proposed on the Sunday, after the sermon. He reads to me every evening. I say nothing, and smile." },
    clara: { from: "Mrs Fenwick, aboard HMS Laconia", good: "Eight years late, and worth every one of them. My godmother says she was wrong. I have learned to sleep through a storm at sea. Frederick has not." },
    kitty: { from: "Mrs Brampton, Brampton Farm", good: "Father gave me away himself. We have two cows, a dog and forty-one kinds of bird. John counted. You were wrong about him, Miss Woodhouse, and I have never been so happy." },
    sophia: { from: "Mrs Hartley, Cleve Lodge", good: "I was seventeen and certain one could love only once. James never told me I was wrong. He simply rode through the night, and copied out my songs, and waited. He wears flannel waistcoats. I have grown fond of flannel." },
    fanny: { from: "Mrs Grant, the Parsonage, Elmwood", good: "Edmund says he was a long time seeing what was in front of him. I say I was a long time saying nothing. Miss Crawley sent a necklace for the wedding. I wore the plain chain." },
    kate: { from: "Mrs Henry Tilden, the Parsonage, Woodston", good: "The General apologised, eventually, which Henry says is less likely than anything in a novel. I still read them. Henry reads them after me, and laughs in all the right places." },
  },
};
