// The catalogue. Each drop is one spread of the book: its first product is the
// featured piece on the left page, the rest are listed on the right page.
// Photos are placeholders: replace images/<img>-800.webp and -400.webp with real shots.
// The catalogue uses cut-out versions (<img>-cut-800.webp / -cut-400.webp) with a transparent background.
const APPAREL = ["XS", "S", "M", "L", "XL"];
const ONE = ["One size"];

const DROPS = [
  {
    id: "first-light", no: "01", name: "First Light", date: "Spring 2026",
    story: "The first release. Heavy cotton basics in deep forest green, cut to be worn every day and kept for years.",
    products: [
      { id: "orbit-hoodie", name: "Orbit Hoodie", price: 90, img: "hoodie", sizes: APPAREL,
        desc: "Heavyweight brushed fleece with a double-layer hood." },
      { id: "north-crew", name: "North Crew", price: 120, img: "crewneck", sizes: APPAREL,
        desc: "Loopback cotton with a relaxed shoulder." },
      { id: "halo-tee", name: "Halo Tee", price: 40, img: "tee-w", sizes: APPAREL,
        desc: "Soft combed jersey with a slim crew neck." },
      { id: "night-beanie", name: "Night Beanie", price: 35, img: "beanie", sizes: ONE,
        desc: "Chunky rib knit with a deep cuff." },
    ],
  },
  {
    id: "night-shift", no: "02", name: "Night Shift", date: "Autumn 2026",
    story: "Built for cold nights out. Quilted outerwear and layers that keep their shape after dark.",
    products: [
      { id: "comet-puffer", name: "Comet Puffer", price: 190, img: "puffer", sizes: APPAREL,
        desc: "Box-quilted, water-resistant shell with a high funnel neck." },
      { id: "drift-vest", name: "Drift Vest", price: 140, img: "light-puffer", sizes: APPAREL,
        desc: "Diamond-quilted, light enough to layer." },
      { id: "halo-vest", name: "Halo Puffer Vest", price: 150, img: "puffer-2", sizes: APPAREL,
        desc: "Channel-quilted down vest with a two-way zip." },
      { id: "run-short", name: "Night Run Short", price: 45, img: "shorts", sizes: APPAREL,
        desc: "Quick-dry woven short with a soft waistband." },
    ],
  },
  {
    id: "orbit", no: "03", name: "Orbit", date: "Winter 2026",
    story: "Earth tones and deep sea blues. The Orbit set, made to be worn together or apart.",
    products: [
      { id: "orbit-hoodie-earth", name: "Orbit Hoodie, Earth", price: 90, img: "hoodie-clay", sizes: APPAREL,
        desc: "Garment-dyed brown, so every piece wears in its own way." },
      { id: "orbit-hoodie-sea", name: "Orbit Hoodie, Deep Sea", price: 90, img: "hoodie-ocean", sizes: APPAREL,
        desc: "The Orbit in a cool, dark blue." },
      { id: "transit-sweatpant", name: "Transit Sweatpant", price: 85, img: "sweatpants", sizes: APPAREL,
        desc: "Tapered fleece with deep side pockets." },
      { id: "carry-sling", name: "Carry Sling", price: 70, img: "frontpack", sizes: ONE,
        desc: "Roomy crossbody with a quick-release buckle." },
    ],
  },
];

const PRODUCTS = DROPS.flatMap((d) => d.products.map((p) => ({ ...p, drop: d.name })));
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

// Extra detail for the quick view (placeholder copy: swap in the real specs).
const DETAILS = {
  "orbit-hoodie": ["450 gsm brushed cotton fleece", "Relaxed fit, dropped shoulder", "Double-layer hood, kangaroo pocket"],
  "north-crew": ["400 gsm loopback cotton", "Relaxed fit", "Ribbed cuffs and hem"],
  "halo-tee": ["220 gsm combed cotton jersey", "Regular fit", "Slim ribbed crew neck"],
  "night-beanie": ["Merino wool blend", "Chunky rib knit", "Deep fold-over cuff"],
  "comet-puffer": ["Water-resistant recycled shell", "Box-quilted synthetic down", "High funnel neck, two-way zip"],
  "drift-vest": ["Lightweight diamond quilting", "Layers over a hoodie", "Snap front, side pockets"],
  "halo-vest": ["Channel-quilted down fill", "Regular fit", "Two-way zip, stand collar"],
  "run-short": ["Quick-dry woven nylon", "5 inch inseam", "Soft elastic waistband"],
  "orbit-hoodie-earth": ["450 gsm brushed cotton fleece", "Garment-dyed earth brown", "Relaxed fit, double-layer hood"],
  "orbit-hoodie-sea": ["450 gsm brushed cotton fleece", "Deep sea blue", "Relaxed fit, double-layer hood"],
  "transit-sweatpant": ["400 gsm cotton fleece", "Tapered leg, drawcord waist", "Deep side pockets"],
  "carry-sling": ["Water-resistant nylon", "Adjustable crossbody strap", "Quick-release buckle"],
};
// Pieces running low (placeholder numbers).
const LEFT = { "comet-puffer": 6, "night-beanie": 9, "orbit-hoodie-earth": 4 };

// The next release, teased at the back of the catalogue.
const NEXT_DROP = {
  no: "04", name: "Supernova", date: "Spring 2027",
  launch: "2027-03-14T17:00:00Z",
  teaser: "Something stellar is on the way. A brighter palette, a heavier cut, and our first outerwear in metallic thread.",
  silhouettes: ["hoodie", "puffer", "crewneck"],
};

// Social accounts. Paste each full profile link; leave "" to hide that icon.
const SOCIALS = {
  instagram: "",
  tiktok: "",
  x: "",
  youtube: "",
};
