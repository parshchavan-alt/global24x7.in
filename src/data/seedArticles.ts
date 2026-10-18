import { Article, ImageAttribution, CustomCategory } from '../types';

export const INITIAL_CATEGORIES: CustomCategory[] = [
  { id: 'cat-1', name: 'World', slug: 'world', description: 'Geopolitics, diplomacy, international governance', isSystem: true },
  { id: 'cat-2', name: 'Technology', slug: 'technology', description: 'Computing, artificial intelligence, micro-architecture', isSystem: true },
  { id: 'cat-3', name: 'Business', slug: 'business', description: 'Macroeconomics, capital allocation, trade corridors', isSystem: true },
  { id: 'cat-4', name: 'Science', slug: 'science', description: 'Astrophysics, quantum mechanics, deep biological research', isSystem: true },
  { id: 'cat-5', name: 'Health', slug: 'health', description: 'Molecular therapies, preventative clinical longevity', isSystem: true },
  { id: 'cat-6', name: 'Climate', slug: 'climate', description: 'Energy transition, ecological monitoring, infrastructure', isSystem: true },
  { id: 'cat-7', name: 'Culture', slug: 'culture', description: 'Civic architecture, literature, exhibitions', isSystem: true },
  { id: 'cat-8', name: 'Sports', slug: 'sports', description: 'Endurance biomechanics, athletics analytics', isSystem: true },
];

export const CURATED_STOCK_PHOTOS: Record<string, Array<{ url: string; caption: string; credit: ImageAttribution }>> = {
  Technology: [
    {
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
      caption: 'Advanced semiconductor micro-architecture and optical wafer fabrication.',
      credit: {
        photographer: 'Alexandre Debieve',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/FO7JIlwjOtU',
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1400&q=80',
      caption: 'Global algorithmic infrastructure and real-time distributed data computing nodes.',
      credit: {
        photographer: 'Markus Spiske',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/iar-afB0QQw',
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
      caption: 'Planetary satellite constellation and orbital telecommunications array.',
      credit: {
        photographer: 'NASA / Unsplash',
        source: 'NASA Public Domain',
        license: 'Public Domain',
        originalUrl: 'https://unsplash.com/photos/Q1p7bh3SHj8',
      },
    },
  ],
  World: [
    {
      url: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=80',
      caption: 'Diplomatic delegates convene at the multilateral global governance assembly in Geneva.',
      credit: {
        photographer: 'Mathias Reding',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/multilateral-assembly',
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?auto=format&fit=crop&w=1400&q=80',
      caption: 'International maritime freight routes and transnational commerce treaty negotiations.',
      credit: {
        photographer: 'Ian Taylor',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/jOqJbVO1CRU',
      },
    },
  ],
  Business: [
    {
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
      caption: 'Monolithic glass facades of central banking district during dawn trading cycles.',
      credit: {
        photographer: 'Sean Pollock',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/PhYq704ffdA',
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1400&q=80',
      caption: 'Sovereign bond yield curves and foreign exchange reserve indicators.',
      credit: {
        photographer: 'Maxim Hopman',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/fiXLQXAhCfk',
      },
    },
  ],
  Science: [
    {
      url: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1400&q=80',
      caption: 'Cryogenic vacuum chamber testing next-generation quantum coherence processors.',
      credit: {
        photographer: 'Science in HD',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/4OJ_VER5woc',
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1400&q=80',
      caption: 'Spectrometric analysis of synthetic catalytic polymers in cleanroom laboratory.',
      credit: {
        photographer: 'National Cancer Institute',
        source: 'Unsplash',
        license: 'Public Domain',
        originalUrl: 'https://unsplash.com/photos/L8tWZT4CcVQ',
      },
    },
  ],
  Health: [
    {
      url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1400&q=80',
      caption: 'High-throughput genomic sequencing arrays and molecular therapeutic modeling.',
      credit: {
        photographer: 'CDC / Unsplash',
        source: 'Unsplash / CDC Public Domain',
        license: 'Public Domain',
        originalUrl: 'https://unsplash.com/photos/w95hpgKsfbY',
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1400&q=80',
      caption: 'Neuro-imaging tomography assessing cognitive longevity interventions in clinical trial.',
      credit: {
        photographer: 'National Cancer Institute',
        source: 'Unsplash',
        license: 'Public Domain',
        originalUrl: 'https://unsplash.com/photos/NFvdKIhxYlU',
      },
    },
  ],
  Climate: [
    {
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80',
      caption: 'Alpine glacial retreat measurements recorded across high-elevation meteorological stations.',
      credit: {
        photographer: 'Kalenskiy Denis',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/alpine-ridges',
      },
    },
    {
      url: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1400&q=80',
      caption: 'Offshore wind turbine arrays generating baseload clean power along the North Sea corridor.',
      credit: {
        photographer: 'Nicholas Doherty',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/pONBhCeedU8',
      },
    },
  ],
  Culture: [
    {
      url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80',
      caption: 'Retrospective architectural exhibition examining mid-century civic design.',
      credit: {
        photographer: 'Ricardo Gomez Angel',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/b8k7wXz5R24',
      },
    },
  ],
  Sports: [
    {
      url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=80',
      caption: 'Track athletes prepare at the starting blocks during the continental grand prix finals.',
      credit: {
        photographer: 'Fitsum Admasu',
        source: 'Unsplash',
        license: 'Unsplash Free Commercial License',
        originalUrl: 'https://unsplash.com/photos/oGfNcPvpdUs',
      },
    },
  ],
};

export const INITIAL_ARTICLES: Article[] = [
  {
    id: 'art-001',
    slug: 'the-silicon-monolith-quantum-coherence-breakthrough',
    title: 'The Silicon Monolith: Inside the Race for Room-Temperature Quantum Coherence',
    summary: 'A multinational consortium reveals a solid-state topological substrate capable of sustaining quantum coherence without deep cryogenic isolation, reshaping high-performance computation timelines.',
    content: `Solid-state physicists at the Zurich-Kyoto Institute have formally unveiled a crystalline topological lattice capable of sustaining continuous quantum superposition at -12 degrees Celsius — a monumental departure from the liquid-helium envelopes traditionally mandated by superconducting qubits.

The discovery hinges upon deliberate atomic vacancies inside bismuth-telluride crystalline arrays, allowing topological Majorana edge modes to deflect thermal phononic scattering. For five decades, the primary roadblock impeding industrial quantum processing was the brutal thermodynamic tax: cryogenic dilution refrigerators consuming megawatts merely to suppress thermal vibration.

"We are witnessing the transition from quantum hardware as delicate physics instrumentation to quantum computation as industrial capital equipment," stated Dr. Elena Rostova, lead investigator on the topological substrate initiative. "By moving the threshold from millikelvin regimes toward standard industrial chilling, the maintenance footprint collapses by three orders of magnitude."

The commercial ramifications have reverberated through venture capital and sovereign wealth funds within hours of the publication. Telecommunications operators predict that topological repeaters could be deployed in standardized 19-inch server racks rather than subterranean hermetic bunkers, accelerating the rollout of physically eavesdrop-proof quantum key distribution across oceanic fiber cables.

Yet theoretical physicists urge calculated patience. While the coherence window reached an unprecedented 184 milliseconds — more than sufficient for fault-tolerant error-correcting surface codes — mass-scale epitaxial wafer yield remains under four percent. Fabricating defect-free crystals across 300mm silicon wafers will require advanced atomic layer deposition tooling that current commercial foundries are only beginning to pilot.`,
    keyTakeaways: [
      'Breakthrough topological bismuth-telluride substrate achieves coherence at -12°C, bypassing extreme dilution refrigerators.',
      'Infrastructure overhead drops by 90%, enabling standard industrial data center deployments for quantum processors.',
      'Commercial hurdle shifts from fundamental physics to semiconductor manufacturing yield and atomic layer precision.',
    ],
    category: 'Technology',
    tags: ['Quantum Computing', 'Physics', 'Semiconductors', 'Deep Tech'],
    author: {
      name: 'Julian Sterling',
      title: 'Senior Technology Correspondent',
    },
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    readingTimeMinutes: 5,
    status: 'published',
    featuredRank: 1, // Lead Story
    imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
    imageCaption: 'Scanning electron micrograph of topological crystal lattice fabricated at the Zurich-Kyoto Institute.',
    imageCredit: {
      photographer: 'Alexandre Debieve',
      source: 'Unsplash',
      license: 'Unsplash Free Commercial License',
      originalUrl: 'https://unsplash.com/photos/FO7JIlwjOtU',
    },
    language: 'en',
    viewsCount: 14820,
    likesCount: 942,
    seo: {
      metaTitle: 'Quantum Coherence Breakthrough: Inside the Room-Temperature Race',
      metaDescription: 'Multinational physics consortium unveils -12°C solid-state topological quantum substrate, cutting cryogenic infrastructure overhead by 90%.',
      focusKeywords: ['quantum computing', 'solid-state physics', 'topological substrate', 'semiconductors'],
    },
  },
  {
    id: 'art-002',
    slug: 'the-new-sovereign-energy-corridor-green-hydrogen',
    title: 'The New Sovereign Energy Corridor: North Sea Offshore Wind Powers Green Ammonia',
    summary: 'Nine coastal nations ratify a joint infrastructure pact to synthesize maritime fuels directly at offshore wind substations, establishing the continent\'s first post-hydrocarbon transport spine.',
    content: `Ministers from nine North Sea littoral states signed the Ostend Maritime Accord this morning, committing €42 billion toward integrated offshore electrolysis arrays that synthesize green ammonia directly at sea.

Rather than transporting raw alternating electrical current hundreds of kilometers inland with severe transmission dissipation, the newly chartered platform pipelines pressurized green hydrogen and liquid ammonia straight to deepwater bunkering berths in Rotterdam, Hamburg, and Antwerp.

The economic thesis is pragmatic: oceanic container vessels accounting for eighty percent of international freight volume cannot feasibly operate on chemical battery packs due to gravimetric density limitations. Liquid ammonia synthesized via offshore wind offers the highest volumetric energy density capable of fitting existing dual-fuel marine engine architectures.

"By decoupling energy harvest from terrestrial grid congestion, we unlock gigawatt-scale wind farms previously deemed stranded assets," remarked the European Commissioner for Maritime Transition. Commercial maritime fleets have already booked forward supply contracts through 2032.`,
    keyTakeaways: [
      'Ostend Maritime Accord unifies nine nations with €42B capital commitment for offshore electrolysis.',
      'Green ammonia synthesized at sea solves long-haul maritime shipping decarbonization.',
      'Direct pipeline bunkering circumvents terrestrial grid interconnection bottlenecks.',
    ],
    category: 'Climate',
    tags: ['Energy Transition', 'Hydrogen', 'Maritime', 'Infrastructure'],
    author: {
      name: 'Claire Beauchamp',
      title: 'Energy & Commodities Editor',
    },
    publishedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    readingTimeMinutes: 4,
    status: 'published',
    featuredRank: 2, // Secondary Feature
    imageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1400&q=80',
    imageCaption: 'Deepwater offshore wind installation operating in the North Sea energy corridor.',
    imageCredit: {
      photographer: 'Nicholas Doherty',
      source: 'Unsplash',
      license: 'Unsplash Free Commercial License',
      originalUrl: 'https://unsplash.com/photos/pONBhCeedU8',
    },
    language: 'en',
    viewsCount: 9340,
    likesCount: 618,
    seo: {
      metaTitle: 'North Sea Sovereign Energy Corridor: Green Ammonia Accord',
      metaDescription: 'Nine nations commit €42B to offshore wind electrolysis and green maritime fuel pipelines.',
      focusKeywords: ['green hydrogen', 'offshore wind', 'clean maritime', 'energy corridor'],
    },
  },
  {
    id: 'art-003',
    slug: 'multilateral-diplomacy-autonomous-treaty-compliance',
    title: 'Autonomous Verification: How Cryptographic Provenance Is Stabilizing Arms Control',
    summary: 'Satellite synthetic-aperture radar paired with zero-knowledge cryptographic proofs enables neutral, tamper-resistant monitoring of international decommissioning pacts.',
    content: `In an era defined by geopolitical polarization and diplomatic attrition, the International Atomic & Ballistic Monitoring Commission has quietly deployed zero-knowledge verification protocols that allow rival states to verify treaty compliance without surrendering national security secrets.

The breakthrough relies upon dual-sensor satellite synthetic-aperture radar linked to cryptographic commitments. When an inspected missile silo or enrichment facility is shuttered, sensors verify structural decommissioning while zero-knowledge proofs validate dimensional metrics without exposing classified component blue-prints.

Diplomats who spent years in stagnant negotiations praise the protocol for eliminating the "adversarial inspection paradox," wherein nations frequently refused on-site observers out of espionage concerns. Several non-aligned states have volunteered their territory as pilot zones for universal autonomous verification under UN auspices.`,
    keyTakeaways: [
      'Zero-knowledge cryptography enables neutral verification of international treaties without tradecraft leakage.',
      'Synthetic-aperture orbital radar provides tamper-evident audit trails accessible to all signatories.',
      'Reduces diplomatic impasse caused by fear of conventional on-site intelligence gathering.',
    ],
    category: 'World',
    tags: ['Geopolitics', 'Arms Control', 'Cryptography', 'Diplomacy'],
    author: {
      name: 'Marcus Vance',
      title: 'Diplomatic Affairs Editor',
    },
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    readingTimeMinutes: 6,
    status: 'published',
    featuredRank: 2, // Secondary Feature
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1400&q=80',
    imageCaption: 'Delegates review orbital treaty verification data at the Geneva multilateral summit.',
    imageCredit: {
      photographer: 'Mathias Reding',
      source: 'Unsplash',
      license: 'Unsplash Free Commercial License',
      originalUrl: 'https://unsplash.com/photos/multilateral-assembly',
    },
    language: 'en',
    viewsCount: 7120,
    likesCount: 432,
    seo: {
      metaTitle: 'Autonomous Verification in Arms Control & Treaty Compliance',
      metaDescription: 'How zero-knowledge proofs and orbital radar are creating tamper-proof multilateral verification without espionage risks.',
      focusKeywords: ['diplomacy', 'arms control', 'zero knowledge proofs', 'geopolitics'],
    },
  },
  {
    id: 'art-004',
    slug: 'sovereign-bond-yield-divergence-central-banks',
    title: 'The Liquidity Paradox: Why Sovereign Yield Curves Are Decoupling Across Continents',
    summary: 'Divergent central bank policies on digital currency reserves and balance sheet runoff trigger unprecedented yield curve behavior in G10 capital markets.',
    content: `Global fixed income desks experienced violent re-pricing this week as sovereign yield curves between the Federal Reserve, the European Central Bank, and the Bank of Japan diverged to thirty-year record spreads.

While western monetary authorities maintain quantitative tightening to enforce price stability, Asian central banks are expanding liquidity facilities to backstop commercial banking real estate exposures. The resultant cross-currency basis swaps have compressed institutional spreads, driving corporate treasury managers toward tokenized short-duration sovereign debt instruments.

Macro strategist Lydia Chen noted: "We have transitioned from synchronized monetary cycles into fragmented regional fiscal nationalism. Yield arbitrage is no longer governed merely by inflation differentials, but by structural energy dependencies and sovereign capital controls."`,
    keyTakeaways: [
      'Yield curves across G10 economies have reached historic non-synchronous spreads.',
      'Corporate treasuries are rapidly reallocating toward tokenized short-term paper.',
      'Regional fiscal fragmentation now dominates traditional monetary inflation models.',
    ],
    category: 'Business',
    tags: ['Central Banks', 'Macroeconomics', 'Yield Curves', 'Finance'],
    author: {
      name: 'Lydia Chen',
      title: 'Chief Economics Commentator',
    },
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    readingTimeMinutes: 4,
    status: 'published',
    featuredRank: 3,
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1400&q=80',
    imageCaption: 'Financial district skyscrapers in Frankfurt at the opening bell of continental bond trading.',
    imageCredit: {
      photographer: 'Sean Pollock',
      source: 'Unsplash',
      license: 'Unsplash Free Commercial License',
      originalUrl: 'https://unsplash.com/photos/PhYq704ffdA',
    },
    language: 'en',
    viewsCount: 5830,
    likesCount: 310,
    seo: {
      metaTitle: 'The Liquidity Paradox: G10 Sovereign Yield Divergence',
      metaDescription: 'Why global fixed income markets are splintering as central banks diverge in balance sheet unwinding.',
      focusKeywords: ['yield curve', 'macroeconomics', 'central banking', 'treasury bonds'],
    },
  },
  {
    id: 'art-005',
    slug: 'synthetic-telomerase-activation-clinical-trial',
    title: 'Targeted Cellular Rejuvenation: Phase II Trial Shows Reversal in Epigenetic Age Markers',
    summary: 'A precision gene-expression vector targeting senescent endothelial cells demonstrates measurable vascular elasticity restoration in multi-center clinical trials.',
    content: `Researchers at the Cambridge Regenerative Biology Institute have published interim Phase II results for PRX-09, an engineered mRNA therapeutic delivering transient epigenetic reprogramming factors specifically to microvascular endothelial linings.

Unlike systemic reprogramming regimens that carried oncogenic risks in animal models, this delivery vector employs tissue-specific lipid nanoparticles that express Yamanaka transcription factors for only seventy-two hours. Across two hundred and forty human subjects, cardiovascular pulse-wave velocity improved by eighteen percent, effectively rejuvenating arterial stiffness profiles by nine biological years.

Lead clinician Dr. Aris Thorne emphasized: "We are not attempting mythical immortality; we are systematically dismantling the primary driver of cardiovascular morbidity — arterial calcification and endothelial senescence." Regulatory agencies in three jurisdictions have granted expedited review designations for chronic heart failure indications.`,
    keyTakeaways: [
      'Phase II trials demonstrate 18% improvement in arterial elasticity using transient mRNA reprogramming.',
      'Targeted lipid delivery prevents oncogenic risks associated with permanent epigenetic alteration.',
      'Regulatory fast-track granted for degenerative cardiovascular indications.',
    ],
    category: 'Health',
    tags: ['Longevity', 'Biotech', 'Genomics', 'Medicine'],
    author: {
      name: 'Dr. Alistair Finch',
      title: 'Medical Science Contributor',
    },
    publishedAt: new Date(Date.now() - 3600000 * 15).toISOString(),
    readingTimeMinutes: 5,
    status: 'published',
    featuredRank: 3,
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1400&q=80',
    imageCaption: 'Targeted lipid nanoparticle therapeutic assay imaged via fluorescence microscopy.',
    imageCredit: {
      photographer: 'CDC / Unsplash',
      source: 'Unsplash / CDC Public Domain',
      license: 'Public Domain',
      originalUrl: 'https://unsplash.com/photos/w95hpgKsfbY',
    },
    language: 'en',
    viewsCount: 6240,
    likesCount: 512,
    seo: {
      metaTitle: 'Phase II Clinical Trial: Endothelial Epigenetic Rejuvenation',
      metaDescription: 'Cambridge researchers restore vascular elasticity by 18% using transient mRNA delivery vectors.',
      focusKeywords: ['epigenetics', 'vascular health', 'mrna therapies', 'biomedical research'],
    },
  },
  {
    id: 'art-006',
    slug: 'deep-field-infrared-primordial-galaxies',
    title: 'Beyond the Epoch of Reionization: Space Observatories Detect Overmassive Early Black Holes',
    summary: 'Spectroscopic observations from next-generation space infrared arrays defy cosmic hierarchy models, revealing billion-solar-mass black holes existing when the universe was only 400 million years old.',
    content: `Astrophysical models of early galactic evolution face urgent re-evaluation as deep-field infrared surveys catalog supermassive black holes exceeding one billion solar masses at redshift z=12.2.

Under standard Eddington accretion limits, a seed black hole formed by the gravitational collapse of a Population III star cannot absorb matter rapidly enough to attain such immense proportions within the four-hundred-million-year window following the Big Bang.

The empirical data strongly favors the "Direct Collapse Black Hole" hypothesis, wherein colossal clouds of pristine primordial hydrogen and helium collapsed gravitationally without first fragmenting into individual stars. This direct collapse mechanism produces seed black holes of 100,000 solar masses instantaneously, drastically shortening the growth timeline.`,
    keyTakeaways: [
      'Space infrared surveys identify billion-solar-mass black holes at z=12.2, defying classic accretion models.',
      'Data provides first direct observational validation for Direct Collapse Black Hole cosmology.',
      'Requires fundamental updates to theoretical models of primordial star formation.',
    ],
    category: 'Science',
    tags: ['Astrophysics', 'Cosmology', 'Space Exploration', 'JWST'],
    author: {
      name: 'Dr. Serena Solano',
      title: 'Astrophysics Editor',
    },
    publishedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    readingTimeMinutes: 5,
    status: 'published',
    featuredRank: 3,
    imageUrl: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=1400&q=80',
    imageCaption: 'High-vacuum spectroscopic simulation chamber modeling interstellar accretion shocks.',
    imageCredit: {
      photographer: 'Science in HD',
      source: 'Unsplash',
      license: 'Unsplash Free Commercial License',
      originalUrl: 'https://unsplash.com/photos/4OJ_VER5woc',
    },
    language: 'en',
    viewsCount: 8410,
    likesCount: 780,
    seo: {
      metaTitle: 'Overmassive Primordial Black Holes: Cosmic Evolution Upended',
      metaDescription: 'Infrared observatories detect billion-solar-mass black holes at cosmic dawn, verifying direct collapse theory.',
      focusKeywords: ['astrophysics', 'black holes', 'cosmology', 'space telescope'],
    },
  },
  {
    id: 'art-007',
    slug: 'civic-architecture-monumental-vernacular-exhibition',
    title: 'The Monumental Vernacular: Why Civic Architecture Is Reclaiming Stone and Timber',
    summary: 'A landmark international exhibition at the Milan Triennale documents the worldwide architectural revolt against sterile curtain-wall glass in favor of mass timber and carved regional sandstone.',
    content: `Inside the grand galleries of the Palazzo dell Arte in Milan, curators have assembled drawings, acoustic mock-ups, and massive structural timber joints representing one hundred and twenty contemporary civic buildings constructed over the past five years.

The guiding philosophy dubbed the "Monumental Vernacular" rejects the anonymous glass-and-steel developer towers that colonized global metropolises throughout the late twentieth century. Architects in Oslo, Kyoto, and Valparaiso are rediscovering load-bearing structural stone and carbon-sequestering glued-laminated timber, creating civic institutions that possess tactile permanence while achieving net-negative carbon footprints.

"Glass towers are thermal sieves disguised as modernity," noted keynote speaker Alvaro Mendonca. "A library or municipal court must convey civic gravity and historical continuity. Stone and crafted wood age gracefully; aluminum composites simply degrade."`,
    keyTakeaways: [
      'Milan Triennale showcases major shift away from sterile glass facades toward structural stone and timber.',
      'Low-embodied carbon materials provide acoustic warmth and structural permanence for civic landmarks.',
      'Biophilic public spaces demonstrate measurable reductions in urban stress and thermal island effects.',
    ],
    category: 'Culture',
    tags: ['Architecture', 'Urban Design', 'Sustainability', 'Exhibitions'],
    author: {
      name: 'Helena Bergstrom',
      title: 'Architecture & Design Critic',
    },
    publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    readingTimeMinutes: 4,
    status: 'published',
    featuredRank: 3,
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80',
    imageCaption: 'Gallery installations examining load-bearing stonework and laminated timber trusses in Milan.',
    imageCredit: {
      photographer: 'Ricardo Gomez Angel',
      source: 'Unsplash',
      license: 'Unsplash Free Commercial License',
      originalUrl: 'https://unsplash.com/photos/b8k7wXz5R24',
    },
    language: 'en',
    viewsCount: 4290,
    likesCount: 295,
    seo: {
      metaTitle: 'The Monumental Vernacular: Civic Architecture in Stone & Wood',
      metaDescription: 'Milan Triennale explores the architectural return to structural stone and timber in modern civic design.',
      focusKeywords: ['civic architecture', 'mass timber', 'urban design', 'sustainable architecture'],
    },
  },
  {
    id: 'art-008',
    slug: 'aerodynamic-science-marathon-footwear-advancements',
    title: 'The Aerodynamics of Human Endurance: Inside the Lab Re-Engineering Sub-Two-Hour Running',
    summary: 'Biomechanical telemetry and micro-wind tunnel analysis reveal how boundary-layer airflow around lower limbs dictates the final seconds of elite distance racing.',
    content: `When marathoners attempt to shave fractions of a percent from world records, physiologists have historically concentrated entirely on VO2 max, lactate threshold, and metabolic energy return from carbon-plated foam midsoles.

However, researchers at the Colorado Sports Science Laboratory have turned their focus toward aerodynamic boundary layer disruption. At a pace of 21 kilometers per hour, air resistance accounts for roughly eight percent of the total mechanical energy expended by a runner. By introducing micro-ribbed aerodynamic textures along lower leg compression sleeves and shoe uppers, engineers measured a 4.2 watt reduction in drag — equivalent to 45 seconds over a 42.195-kilometer distance.

The International Athletic Federation has already commissioned an independent review panel to determine whether boundary-layer drag modification constitutes "technological doping" or standard performance engineering.`,
    keyTakeaways: [
      'Air resistance consumes roughly 8% of total mechanical energy at elite marathon racing speeds.',
      'Lower limb boundary-layer aerodynamic texturing yields up to 45 seconds of pacing advantage.',
      'Governing bodies deliberate whether aerodynamic textile modifications require regulatory standards.',
    ],
    category: 'Sports',
    tags: ['Biomechanics', 'Marathon', 'Sports Science', 'Aerodynamics'],
    author: {
      name: 'Torin MacLeod',
      title: 'Sports Science Analyst',
    },
    publishedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    readingTimeMinutes: 4,
    status: 'published',
    featuredRank: 3,
    imageUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1400&q=80',
    imageCaption: 'High-speed biomechanical gait capture analysis at the endurance athletics lab.',
    imageCredit: {
      photographer: 'Fitsum Admasu',
      source: 'Unsplash',
      license: 'Unsplash Free Commercial License',
      originalUrl: 'https://unsplash.com/photos/oGfNcPvpdUs',
    },
    language: 'en',
    viewsCount: 5120,
    likesCount: 420,
    seo: {
      metaTitle: 'Aerodynamics of Distance Running: Shaving Seconds via Fluid Dynamics',
      metaDescription: 'How micro-wind tunnels and boundary layer textiles are reshaping elite marathon running records.',
      focusKeywords: ['sports science', 'marathon racing', 'aerodynamics', 'biomechanics'],
    },
  },
];
