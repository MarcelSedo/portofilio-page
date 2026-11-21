"""Clean the Wikidata rows, add hand-checked rows, write content/games/britain.ts."""
import re, json, sys

rows = [l.split("|") for l in open("tools/britain-data/wikidata-rows.txt", encoding="utf-8").read().splitlines() if l]

DROP = {
    # books: not literature, not British, duplicates, or not for a portfolio
    "Book of Common Prayer", "Novum Organum", "Hark! The Herald Angels Sing", "Common Sense", "The Age of Reason",
    "An Essay on the Principle of Population", "The Golden Bough", "The Road to Serfdom", "Philosophical Investigations",
    "Why Nations Fail: The Origins of Power, Prosperity, and Poverty", "An Essay Concerning Human Understanding",
    "The Portrait of a Lady", "The Turn of the Screw", "The White Man's Burden", "Fifty Shades of Grey", "Fanny Hill",
    "Predator's Gold", "Infernal Devices", "A Darkling Plain", "The Fellowship of the Ring",
    "Life, the Universe and Everything",
    # films: not British productions, or too many sequels
    "Zorba the Greek", "Bedknobs and Broomsticks", "K-PAX", "Déjà Vu", "Lucky Number Slevin", "United 93",
    "Resident Evil", "Alien vs. Predator", "Revolutionary Road", "X-Men: First Class", "Scott Pilgrim vs. the World",
    "Snow White and the Huntsman", "Warcraft", "Cinderella", "The Chronicles of Narnia: The Voyage of the Dawn Treader",
    "Lara Croft: Tomb Raider", "The Jackal", "Angel Heart", "Mamma Mia! Here We Go Again", "Johnny English Reborn",
    "Johnny English Strikes Again", "Mr. Bean's Holiday", "Harry Potter and the Half-Blood Prince",
    "Harry Potter and the Deathly Hallows – Part 1", "Sherlock Holmes: A Game of Shadows", "Batman Begins",
    "You Only Live Twice", "Diamonds Are Forever", "The Man with the Golden Gun", "Moonraker", "Octopussy",
    "A View to a Kill", "Licence to Kill", "The World Is Not Enough", "Spectre", "The League of Extraordinary Gentlemen",
    # art
    "Lake with Dead Trees (Catskill)", "The Subsiding of the Waters of the Deluge", "The Titan's Goblet", "The Oxbow",
    "The Architect's Dream", "The Bridge at Villeneuve-la-Garenne", "The Regatta at Molesey",
    "The Seine at Port-Marly, Piles of Sand", "The Captive King", "The Ladies Waldegrave", "Lady Caroline Howard",
    "Our English Coasts",
    # music
    "The Kiss", "Baa, Baa, Black Sheep", "Sing a Song of Sixpence", "Jack and Jill", "Hey Diddle Diddle",
    "There was an Old Woman Who Lived in a Shoe", "Sweet Child o' Mine", "November Rain", "Queen", "Keep Yourself Alive",
    "You're My Best Friend", "I Want to Break Free", "Who Wants to Live Forever", "Innuendo", "Piece of Mind",
    "Painkiller", "Screaming for Vengeance", "Playing the Angel", "Songs of Faith and Devotion", "Led Zeppelin II",
    "Kashmir", "Take Me Home", "Four", "Dire Straits", "Fragile", "Aftermath", "Time", "John Lennon/Plastic Ono Band",
    # stage
    "The Two Gentlemen of Verona", "Caesar and Cleopatra", "Candida", "The Devil's Disciple", "Widowers' Houses",
    "The Duchess of Padua", "A Woman of No Importance",
}
# same title in two categories: drop only in the named one
DROP_IN = {("music", "Viva la Vida"), ("film", "Casino Royale")}

YEAR = {"The Witches": 1983, "Don Juan": 1819, "The Canterville Ghost": 1887, "In the Bleak Midwinter": 1906,
        "Dante's Dream": 1871}
TITLE = {"Peter Pan": ("book", "Peter and Wendy"), "Frankenstein; or, The Modern Prometheus": ("book", "Frankenstein"),
         "The Pilgrim’s Progress": ("book", "The Pilgrim's Progress"),
         "Viva la Vida or Death and All His Friends": ("music", "Viva la Vida or Death and All His Friends")}

BAND = {
    "(I Can't Get No) Satisfaction": "The Rolling Stones", "Paint It Black": "The Rolling Stones",
    "Sympathy for the Devil": "The Rolling Stones", "Yesterday": "The Beatles", "Hey Jude": "The Beatles",
    "Strawberry Fields Forever": "The Beatles", "Something": "The Beatles", "While My Guitar Gently Weeps": "The Beatles",
    "Taxman": "The Beatles", "Now and Then": "The Beatles", "Whole Lotta Love": "Led Zeppelin",
    "Stairway to Heaven": "Led Zeppelin", "Bohemian Rhapsody": "Queen", "We Will Rock You": "Queen",
    "We Are the Champions": "Queen", "Another One Bites the Dust": "Queen", "Radio Ga Ga": "Queen",
    "The Show Must Go On": "Queen", "Under Pressure": "Queen and David Bowie", "Money": "Pink Floyd",
    "Shine On You Crazy Diamond": "Pink Floyd", "Wish You Were Here": "Pink Floyd", "Another Brick in the Wall": "Pink Floyd",
    "Wonderwall": "Oasis", "Stayin' Alive": "Bee Gees", "Layla": "Derek and the Dominos",
    "A Whiter Shade of Pale": "Procol Harum", "Paranoid": "Black Sabbath", "Personal Jesus": "Depeche Mode",
    "Sultans of Swing": "Dire Straits", "Every Breath You Take": "The Police", "Smoke on the Water": "Deep Purple",
    "Last Christmas": "Wham!", "My Generation": "The Who", "Viva la Vida or Death and All His Friends": "Coldplay",
}

out = []
seen = set()
for cat, qid, year, title, creator, fame in rows:
    if title in DROP or (cat, title) in DROP_IN:
        continue
    year = YEAR.get(title, int(year))
    if title in TITLE and TITLE[title][0] == cat:
        title = TITLE[title][1]
    if cat == "music":
        creator = BAND.get(title, creator)
    key = (cat, title)
    assert key not in seen, key
    seen.add(key)
    out.append([qid, title, year, creator, cat, int(fame)])

# hand-checked additions: well-documented first-publication / premiere years. (cat, title, year, creator, fame)
ADD = """
book|Utopia|1516|Thomas More|60
book|Gulliver's Travels|1726|Jonathan Swift|95
book|Pamela|1740|Samuel Richardson|35
book|Songs of Innocence|1789|William Blake|40
book|Mansfield Park|1814|Jane Austen|55
book|Northanger Abbey|1817|Jane Austen|58
book|Bleak House|1853|Charles Dickens|62
book|North and South|1855|Elizabeth Gaskell|45
book|A Tale of Two Cities|1859|Charles Dickens|84
book|On the Origin of Species|1859|Charles Darwin|90
book|The Mill on the Floss|1860|George Eliot|44
book|Silas Marner|1861|George Eliot|42
book|Far from the Madding Crowd|1874|Thomas Hardy|56
book|Jude the Obscure|1895|Thomas Hardy|40
book|Kim|1901|Rudyard Kipling|48
book|The Secret Agent|1907|Joseph Conrad|38
book|Howards End|1910|E. M. Forster|40
book|The Thirty-Nine Steps|1915|John Buchan|46
book|Women in Love|1920|D. H. Lawrence|36
book|The Waste Land|1922|T. S. Eliot|70
book|Cold Comfort Farm|1932|Stella Gibbons|20
book|Brighton Rock|1938|Graham Greene|34
book|The Power and the Glory|1940|Graham Greene|30
book|Wide Sargasso Sea|1966|Jean Rhys|28
book|The French Lieutenant's Woman|1969|John Fowles|32
book|Bridget Jones's Diary|1996|Helen Fielding|44
book|White Teeth|2000|Zadie Smith|40
book|Wolf Hall|2009|Hilary Mantel|48
film|Roundhay Garden Scene|1888|Louis Le Prince|60
film|Rescued by Rover|1905|Lewin Fitzhamon and Cecil Hepworth|30
film|The Lodger|1927|Alfred Hitchcock|40
film|Blackmail|1929|Alfred Hitchcock|38
film|The Private Life of Henry VIII|1933|Alexander Korda|35
film|Brief Encounter|1945|David Lean|62
film|A Matter of Life and Death|1946|Michael Powell and Emeric Pressburger|50
film|Great Expectations|1946|David Lean|48
film|The Red Shoes|1948|Michael Powell and Emeric Pressburger|58
film|Kind Hearts and Coronets|1949|Robert Hamer|45
film|The Ladykillers|1955|Alexander Mackendrick|46
film|A Hard Day's Night|1964|Richard Lester|60
film|Zulu|1964|Cy Endfield|50
film|Kes|1969|Ken Loach|44
film|The Italian Job|1969|Peter Collinson|55
film|Get Carter|1971|Mike Hodges|42
film|The Wicker Man|1973|Robin Hardy|50
film|Don't Look Now|1973|Nicolas Roeg|46
film|Withnail and I|1987|Bruce Robinson|40
film|The Wrong Trousers|1993|Nick Park|52
film|GoldenEye|1995|Martin Campbell|80
film|Chicken Run|2000|Peter Lord and Nick Park|70
film|Harry Potter and the Philosopher's Stone|2001|Chris Columbus|98
film|Love Actually|2003|Richard Curtis|72
film|Casino Royale|2006|Martin Campbell|90
film|No Time to Die|2021|Cary Joji Fukunaga|75
film|Aftersun|2022|Charlotte Wells|30
art|Gin Lane|1751|William Hogarth|70
art|Whistlejacket|1762|George Stubbs|75
art|Hannibal and his Army Crossing the Alps|1812|J. M. W. Turner|55
art|The Lady of Shalott|1888|John William Waterhouse|97
art|Hylas and the Nymphs|1896|John William Waterhouse|80
art|Going to the Match|1953|L. S. Lowry|55
art|Study after Velázquez's Portrait of Pope Innocent X|1953|Francis Bacon|82
art|Just what is it that makes today's homes so different, so appealing?|1956|Richard Hamilton|60
art|Movement in Squares|1961|Bridget Riley|50
art|Single Form|1964|Barbara Hepworth|35
art|Mr and Mrs Clark and Percy|1971|David Hockney|58
art|The Physical Impossibility of Death in the Mind of Someone Living|1991|Damien Hirst|78
art|Benefits Supervisor Sleeping|1995|Lucian Freud|62
art|My Bed|1998|Tracey Emin|72
art|Angel of the North|1998|Antony Gormley|80
art|Girl with Balloon|2002|Banksy|92
music|God Save the King|1745|Traditional|98
music|Auld Lang Syne|1788|Robert Burns|92
music|Move It|1958|Cliff Richard|30
music|Love Me Do|1962|The Beatles|62
music|War Requiem|1962|Benjamin Britten|70
music|Revolver|1966|The Beatles|66
music|Space Oddity|1969|David Bowie|60
music|The Dark Side of the Moon|1973|Pink Floyd|80
music|Candle in the Wind|1973|Elton John|50
music|"Heroes"|1977|David Bowie|52
music|Wuthering Heights|1978|Kate Bush|48
music|Sweet Dreams (Are Made of This)|1983|Eurythmics|50
music|Song for Athene|1993|John Tavener|25
music|Parklife|1994|Blur|40
music|(What's the Story) Morning Glory?|1995|Oasis|56
music|Wannabe|1996|Spice Girls|58
music|Skyfall|2012|Adele|60
music|Shape of You|2017|Ed Sheeran|64
stage|Richard III|1593|William Shakespeare|72
stage|Henry V|1599|William Shakespeare|66
stage|Much Ado About Nothing|1599|William Shakespeare|70
stage|Volpone|1606|Ben Jonson|45
stage|The Way of the World|1700|William Congreve|35
stage|The Beggar's Opera|1728|John Gay|50
stage|She Stoops to Conquer|1773|Oliver Goldsmith|42
stage|The School for Scandal|1777|Richard Brinsley Sheridan|44
stage|H.M.S. Pinafore|1878|Gilbert and Sullivan|52
stage|The Pirates of Penzance|1879|Gilbert and Sullivan|55
stage|The Mikado|1885|Gilbert and Sullivan|60
stage|Peter Pan|1904|J. M. Barrie|78
stage|Private Lives|1930|Noël Coward|40
stage|Murder in the Cathedral|1935|T. S. Eliot|36
stage|Blithe Spirit|1941|Noël Coward|42
stage|An Inspector Calls|1945|J. B. Priestley|56
stage|Peter Grimes|1945|Benjamin Britten|48
stage|The Mousetrap|1952|Agatha Christie|76
stage|Look Back in Anger|1956|John Osborne|50
stage|The Birthday Party|1958|Harold Pinter|40
stage|The Caretaker|1960|Harold Pinter|36
stage|Rosencrantz and Guildenstern Are Dead|1966|Tom Stoppard|52
stage|The Rocky Horror Show|1973|Richard O'Brien|62
stage|Equus|1973|Peter Shaffer|44
stage|Abigail's Party|1977|Mike Leigh|28
stage|Evita|1978|Andrew Lloyd Webber and Tim Rice|66
stage|Amadeus|1979|Peter Shaffer|58
stage|Educating Rita|1980|Willy Russell|34
stage|Cats|1981|Andrew Lloyd Webber|74
stage|Noises Off|1982|Michael Frayn|38
stage|Top Girls|1982|Caryl Churchill|30
stage|The Phantom of the Opera|1986|Andrew Lloyd Webber|85
stage|The Woman in Black|1987|Stephen Mallatratt|40
stage|Arcadia|1993|Tom Stoppard|40
stage|Blasted|1995|Sarah Kane|26
stage|Swan Lake|1995|Matthew Bourne|38
stage|Mamma Mia!|1999|Catherine Johnson|70
stage|The History Boys|2004|Alan Bennett|42
stage|Billy Elliot the Musical|2005|Elton John and Lee Hall|50
stage|War Horse|2007|Nick Stafford|56
stage|Jerusalem|2009|Jez Butterworth|36
stage|Matilda the Musical|2010|Dennis Kelly and Tim Minchin|58
stage|Harry Potter and the Cursed Child|2016|Jack Thorne|68
stage|Six|2017|Toby Marlow and Lucy Moss|46
"""
for line in ADD.strip().splitlines():
    cat, title, year, creator, fame = line.split("|")
    key = (cat, title)
    assert key not in seen, key
    seen.add(key)
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    out.append(["x-" + cat + "-" + slug, title, int(year), creator, cat, int(fame)])

# film motifs for the poster art (by hand; only the picture, never the year)
MOTIF = {}
def m(motif, *titles):
    for t in titles: MOTIF[t] = motif
m("noir", "The 39 Steps", "The Lady Vanishes", "The Third Man", "Frenzy", "The Lodger", "Blackmail", "Get Carter",
  "Lock, Stock and Two Smoking Barrels", "Snatch", "In Bruges", "Sherlock Holmes", "Enola Holmes", "Death on the Nile",
  "Murder on the Orient Express", "Brief Encounter")
m("action", "Dr. No", "From Russia with Love", "Goldfinger", "Thunderball", "On Her Majesty's Secret Service",
  "Live and Let Die", "The Spy Who Loved Me", "The Living Daylights", "Skyfall", "GoldenEye", "Casino Royale",
  "No Time to Die", "Kingsman: The Secret Service", "Baby Driver", "The Italian Job", "Kick-Ass", "The Guns of Navarone",
  "The Dark Knight")
m("war", "The Bridge on the River Kwai", "A Bridge Too Far", "1917", "Darkest Hour", "Zulu", "The Killing Fields",
  "The Boy in the Striped Pajamas", "The Zone of Interest", "Atonement", "The English Patient", "Hotel Rwanda")
m("history", "Lawrence of Arabia", "Gandhi", "Gladiator", "Kingdom of Heaven", "The Lion in Winter",
  "The Private Life of Henry VIII", "Hamlet", "Tom Jones", "Dangerous Liaisons", "The Mission", "The Other Boleyn Girl",
  "The Queen", "The King's Speech", "The Iron Lady", "12 Years a Slave", "The Last King of Scotland",
  "Girl with a Pearl Earring", "Anna Karenina", "Shakespeare in Love", "Pride & Prejudice", "My Week with Marilyn",
  "Les Misérables", "Great Expectations")
m("scifi", "2001: A Space Odyssey", "Alien", "Brazil", "Inception", "Interstellar", "Prometheus", "Ex Machina",
  "Annihilation", "A Clockwork Orange")
m("horror", "The Shining", "28 Days Later", "Shaun of the Dead", "The Wicker Man", "Don't Look Now")
m("comedy", "Monty Python and the Holy Grail", "Monty Python's Life of Brian", "A Fish Called Wanda", "Bean",
  "Johnny English", "Hot Fuzz", "The Full Monty", "Withnail and I", "Kind Hearts and Coronets", "The Ladykillers",
  "Dr. Strangelove", "Rescued by Rover", "Roundhay Garden Scene")
m("romance", "Four Weddings and a Funeral", "Notting Hill", "Bridget Jones's Diary", "Love Actually", "Me Before You",
  "The Danish Girl", "The Theory of Everything")
m("music", "Oliver!", "Mamma Mia!", "Pink Floyd – The Wall", "A Hard Day's Night", "The Red Shoes", "Billy Elliot",
  "Wonka")
m("sport", "Chariots of Fire")
m("adventure", "Around the World in 80 Days", "The Beach", "Midnight Express", "Slumdog Millionaire")
m("fantasy", "Harry Potter and the Goblet of Fire", "Harry Potter and the Order of the Phoenix",
  "Harry Potter and the Deathly Hallows – Part 2", "Harry Potter and the Philosopher's Stone", "Stardust",
  "The Brothers Grimm", "A Matter of Life and Death")
m("anim", "The Wrong Trousers", "Chicken Run", "Paddington", "Paddington 2")
m("drama", "Trainspotting", "The Hours", "Shame", "Kes", "Three Billboards Outside Ebbing, Missouri", "Aftersun")

missing = [r[1] for r in out if r[4] == "film" and r[1] not in MOTIF]
if missing:
    print("NO MOTIF:", missing); sys.exit(1)

out.sort(key=lambda r: (r[2], r[1]))
from collections import Counter
print(Counter(r[4] for r in out), len(out))
print("classics (>=50):", Counter(r[4] for r in out if r[5] >= 50))

def js(s): return json.dumps(s, ensure_ascii=False)
lines = []
for qid, title, year, creator, cat, fame in out:
    extra = f', {js(MOTIF[title])}' if cat == "film" else ""
    lines.append(f"  [{js(qid)}, {js(title)}, {year}, {js(creator)}, {js(cat)}, {fame}{extra}],")

HEAD = '''// Cards for Time Traveller: British culture, from Chaucer to now ({n} cards).
// Source: Wikidata (CC0), retrieved 21 Nov 2026 with the Wikidata Query Service, plus a hand-checked list.
// - Books, paintings and other art, music, stage works and films whose author, artist, composer, band
//   or director is British (writers from Ireland who worked in London, like Wilde and Shaw, are in).
// - year = first publication, first performance, the year a painting was finished, or first release.
// - fame = rank inside its own kind, 1–100, from the number of Wikipedia language editions (sitelinks).
//   It only decides the "Classics" deck. Hand-added rows have an estimated fame.
// - id = Wikidata id ("Q…"); hand-added rows have an "x-" id and link to a Wikipedia search instead.
// - Removed by hand: non-British works, non-fiction that is not part of the arts (with a few famous
//   exceptions), duplicates, most sequels, and a few wrong Wikidata dates (fixed: The Witches 1983,
//   Don Juan 1819, The Canterville Ghost 1887, In the Bleak Midwinter 1906, Dante's Dream 1871).
// - motif (films only) = which pixel poster to draw. Pictures only, never a hint about the year.

import type {{ Motif }} from "@/components/games/poster";

export type Kind = "book" | "art" | "music" | "stage" | "film";

export type CultureCard = {{
  id: string;
  title: string;
  year: number;
  creator: string;
  kind: Kind;
  fame: number;
  motif?: Motif;
}};

/** Cards with at least this fame (rank inside their kind) make up the "Classics" deck. */
export const CLASSIC_FAME = 50;

export const KINDS: Record<Kind, {{ label: string; plural: string; by: string; verb: string }}> = {{
  book: {{ label: "Book", plural: "Books and poems", by: "Written by", verb: "was first published in" }},
  art: {{ label: "Art", plural: "Paintings and art", by: "By", verb: "was finished in" }},
  music: {{ label: "Music", plural: "Music", by: "By", verb: "dates from" }},
  stage: {{ label: "Stage", plural: "Plays, musicals and opera", by: "By", verb: "was first staged in" }},
  film: {{ label: "Film", plural: "Films", by: "Directed by", verb: "came out in" }},
}};

type Row = [string, string, number, string, Kind, number, Motif?];

const rows: Row[] = [
'''.format(n=len(out))
TAIL = '''];

export const cards: CultureCard[] = rows.map(([id, title, year, creator, kind, fame, motif]) => ({
  id,
  title,
  year,
  creator,
  kind,
  fame,
  motif,
}));

/** Where the "more about it" link goes. */
export const sourceUrl = (c: CultureCard) =>
  c.id.startsWith("Q")
    ? `https://www.wikidata.org/wiki/${c.id}`
    : `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(`${c.title} ${c.creator}`)}`;
'''
open("content/games/britain.ts", "w", encoding="utf-8").write(HEAD + "\n".join(lines) + "\n" + TAIL)
