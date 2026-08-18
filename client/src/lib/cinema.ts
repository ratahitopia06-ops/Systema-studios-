export type ProjectStatus = "Development" | "Pre-production" | "Production" | "Review";

export type Character = {
  id: string;
  name: string;
  role: string;
  backstory: string;
  arc: string;
  relationships: string;
  voice: string;
  locked: boolean;
};

export type WorldEntry = {
  id: string;
  title: string;
  category: "Location" | "Lore" | "Tone" | "Visual language";
  detail: string;
};

export type Scene = {
  id: string;
  number: number;
  heading: string;
  designation: "INT." | "EXT." | "INT./EXT.";
  location: string;
  timeOfDay: string;
  characters: string;
  action: string;
  notes: string;
};

export type Shot = {
  id: string;
  sceneId: string;
  order: number;
  type: string;
  lens: string;
  movement: string;
  framing: string;
  status: "Draft" | "Ready" | "Locked";
};

export type GeneratedFrame = {
  id: string;
  shotId: string;
  url: string;
  prompt: string;
  createdAt: number;
};

export type StoryBible = {
  premise: string;
  themes: string;
  actOne: string;
  actTwo: string;
  actThree: string;
  narrativeArc: string;
};

export type SourceMaterial = {
  name: string;
  type: "Original story" | "PDF" | "DOCX" | "TXT" | "EPUB" | "Manuscript";
  author: string;
  rights: "Owned" | "Public domain" | "Licensed" | "Pending review";
  wordCount: number;
  ingestionStatus: "Not added" | "Selected" | "Uploaded" | "Ready for analysis" | "Analysed";
  fileKey?: string;
  fileUrl?: string;
  sizeBytes?: number;
};

export type ExperienceSettings = {
  mode: "Full book" | "Chapter" | "Section" | "Trailer" | "Study mode";
  adaptation: "Original" | "Condensed" | "Expanded";
  narration: "Natural" | "Dramatic" | "Documentary" | "Character-driven" | "Educational";
  visualStyle: "Cinematic" | "Realistic" | "Illustrated" | "Painterly" | "Animation";
  sound: "Minimal" | "Atmospheric" | "Cinematic" | "Immersive";
  music: "Minimal" | "Emotional" | "Epic" | "Experimental";
  presentation: "Landscape" | "Portrait" | "Mobile" | "Theatre";
  qualityMode: "Preview" | "Standard" | "Cinematic" | "Master";
  templateId: string;
  templateLocked: boolean;
};

export type CreativeTemplate = {
  id: string;
  name: string;
  family: "Cinematic" | "Comic" | "Anime" | "Philosophy" | "Modern social" | "Drama" | "Education" | "Mythic";
  summary: string;
  tone: string;
  narration: { mode: ExperienceSettings["narration"]; profile: string; pace: string; delivery: string };
  illustration: { style: ExperienceSettings["visualStyle"]; profile: string; composition: string; typography: string };
  soundscape: { density: ExperienceSettings["sound"]; profile: string; silence: string };
  soundtrack: { direction: ExperienceSettings["music"]; profile: string; dynamic: string };
  aesthetic: { palette: string; texture: string; motion: string };
};

export type AudiobookChapter = {
  id: string;
  number: number;
  title: string;
  durationSeconds: number;
  narrationSummary: string;
  narratorDirection: string;
  openingVisual: string;
  visualMoments: number;
  soundscape: string;
  musicCue: string;
  status: "Outline" | "Ready" | "In review" | "Approved";
};

export type TimelineCue = {
  id: string;
  chapterId: string;
  time: string;
  track: "Narration" | "Visuals" | "Music" | "Ambience" | "SFX" | "Typography";
  label: string;
  durationSeconds: number;
};

export type QualityReview = {
  literaryAccuracy: number;
  narration: number;
  visualStorytelling: number;
  continuity: number;
  sound: number;
  pacing: number;
  typography: number;
  immersion: number;
  threshold: number;
};

export type FilmProject = {
  id: string;
  title: string;
  logline: string;
  genre: string;
  status: ProjectStatus;
  story: StoryBible;
  characters: Character[];
  world: WorldEntry[];
  scenes: Scene[];
  shots: Shot[];
  frames: GeneratedFrame[];
  source: SourceMaterial;
  experience: ExperienceSettings;
  chapters: AudiobookChapter[];
  timeline: TimelineCue[];
  quality: QualityReview;
  createdAt: number;
};

export type StudioState = {
  projects: FilmProject[];
  activeProjectId: string;
};

export const emptyStoryBible: StoryBible = {
  premise: "",
  themes: "",
  actOne: "",
  actTwo: "",
  actThree: "",
  narrativeArc: "",
};

export const defaultExperienceSettings: ExperienceSettings = {
  mode: "Chapter",
  adaptation: "Original",
  narration: "Dramatic",
  visualStyle: "Cinematic",
  sound: "Atmospheric",
  music: "Emotional",
  presentation: "Landscape",
  qualityMode: "Cinematic",
  templateId: "cinematic-drama",
  templateLocked: false,
};

export const creativeTemplates: CreativeTemplate[] = [
  {
    id: "cinematic-drama", name: "Cinematic Drama", family: "Cinematic", summary: "Human-scale emotion, patient observation, and an image-led dramatic pulse.", tone: "Intimate, consequential, restrained", narration: { mode: "Dramatic", profile: "Warm, close-miked, emotionally precise", pace: "Measured with room after revelations", delivery: "Understated escalation" }, illustration: { style: "Cinematic", profile: "Naturalistic cinematic frames", composition: "Negative space and motivated close-ups", typography: "Quiet chapter cards in editorial serif" }, soundscape: { density: "Atmospheric", profile: "Place-specific ambience and selective Foley", silence: "Hold silence at emotional turns" }, soundtrack: { direction: "Emotional", profile: "Piano, bowed texture, and restrained harmonics", dynamic: "Enter late; release into breath" }, aesthetic: { palette: "Wet black, smoke grey, aged amber", texture: "Fine grain and practical light", motion: "Slow push-ins and delicate drift" },
  },
  {
    id: "graphic-novel", name: "Graphic Novel", family: "Comic", summary: "Bold panels, kinetic pacing, and expressive visual punctuation for high-contrast storytelling.", tone: "Urgent, punchy, stylized", narration: { mode: "Character-driven", profile: "Confident ensemble storyteller", pace: "Brisk with punchline and impact pauses", delivery: "Clean attitude and high contrast" }, illustration: { style: "Illustrated", profile: "Ink, halftone, and panel-driven illustration", composition: "Dutch angles, inserts, and split-panel moments", typography: "Speech-card accents and oversized chapter stamps" }, soundscape: { density: "Cinematic", profile: "Impacts, city beds, and tactile foley", silence: "Freeze sound before a reveal" }, soundtrack: { direction: "Epic", profile: "Percussive pulse and electric texture", dynamic: "Hit transitions with graphic energy" }, aesthetic: { palette: "Ink black, signal red, paper cream", texture: "Halftone, brush ink, print wear", motion: "Panel slides, snap zooms, and parallax" },
  },
  {
    id: "anime-reverie", name: "Anime Reverie", family: "Anime", summary: "Emotion-forward animation language with atmospheric worlds, held looks, and lyrical transitions.", tone: "Luminous, earnest, contemplative", narration: { mode: "Dramatic", profile: "Clear, youthful, emotionally open", pace: "Fluid with breathing space for images", delivery: "Sincere and quietly heightened" }, illustration: { style: "Animation", profile: "Hand-painted anime environments and expressive character framing", composition: "Skyward scale, profile close-ups, and symbolic cutaways", typography: "Minimal title cards with delicate sans serif" }, soundscape: { density: "Atmospheric", profile: "Wind, distant trains, rain, and soft room tone", silence: "A suspended beat before transformation" }, soundtrack: { direction: "Emotional", profile: "Piano motifs, strings, and luminous synth air", dynamic: "Melody carries between spoken passages" }, aesthetic: { palette: "Twilight blue, sakura pink, gold light", texture: "Watercolour skies and cel-soft shadow", motion: "Wind, drifting light, and slow parallax" },
  },
  {
    id: "philosophical-essay", name: "Philosophical Essay", family: "Philosophy", summary: "A contemplative, idea-led profile that turns abstraction into visual metaphor without oversimplifying it.", tone: "Reflective, lucid, spacious", narration: { mode: "Documentary", profile: "Calm, articulate essay voice", pace: "Unhurried and concept-led", delivery: "Clear propositions with thoughtful pauses" }, illustration: { style: "Painterly", profile: "Symbolic imagery, diagrams, and visual metaphors", composition: "Objects in negative space; slow conceptual reveals", typography: "Elegant definitions, quotations, and restrained labels" }, soundscape: { density: "Minimal", profile: "Room tone, elemental ambience, and sparse texture", silence: "Use silence as a thinking interval" }, soundtrack: { direction: "Minimal", profile: "Felt piano, low drones, and subtle resonant tone", dynamic: "Nearly absent beneath dense ideas" }, aesthetic: { palette: "Chalk, charcoal, lapis, and soft gold", texture: "Paper grain and luminous ink", motion: "Slow diagrams, dissolves, and orbiting objects" },
  },
  {
    id: "modern-social", name: "Modern Social Documentary", family: "Modern social", summary: "Contemporary people, real places, and social context shaped with clarity, energy, and grounded empathy.", tone: "Immediate, observant, humane", narration: { mode: "Documentary", profile: "Grounded contemporary guide", pace: "Purposeful and conversational", delivery: "Direct, evidence-aware, and warm" }, illustration: { style: "Realistic", profile: "Contemporary documentary stills and editorial layouts", composition: "Human scale, environmental portraits, and data moments", typography: "Modern utility sans with factual callouts" }, soundscape: { density: "Immersive", profile: "Transit, room tone, crowd distance, and daily texture", silence: "Reduce the bed around testimony" }, soundtrack: { direction: "Experimental", profile: "Textural electronics, beat fragments, and ambient rhythm", dynamic: "Rhythm follows lived momentum" }, aesthetic: { palette: "Concrete, cobalt, warm skin, highlighter yellow", texture: "Editorial grain and urban reflections", motion: "Handheld drift, maps, and animated captions" },
  },
  {
    id: "mythic-fable", name: "Mythic Fable", family: "Mythic", summary: "Archetypal storytelling with ritual pacing, tactile landscapes, and symbolic recurring motifs.", tone: "Ancient, uncanny, ceremonial", narration: { mode: "Dramatic", profile: "Low, textured, fireside narrator", pace: "Ritual and deliberate", delivery: "Invocatory without imitation" }, illustration: { style: "Painterly", profile: "Mythic tableau and symbolic creature design", composition: "Monumental landscapes and iconic silhouettes", typography: "Carved title cards and sparse mythic epigraphs" }, soundscape: { density: "Cinematic", profile: "Fire, wind, forest, distant bells, and ritual objects", silence: "Open silence before prophecy" }, soundtrack: { direction: "Epic", profile: "Frame drums, strings, voices, and low brass", dynamic: "Themes evolve like remembered legend" }, aesthetic: { palette: "Oxide red, moon silver, moss, and ember gold", texture: "Pigment, vellum, weathered stone", motion: "Smoke, embers, and layered parallax" },
  },
  {
    id: "noir-thriller", name: "Noir Thriller", family: "Drama", summary: "A pressure-building profile for secrets, investigation, moral ambiguity, and late-night momentum.", tone: "Tense, elegant, morally charged", narration: { mode: "Dramatic", profile: "Intimate, controlled, slightly weathered", pace: "Tight and withholding", delivery: "Let subtext carry the accusation" }, illustration: { style: "Cinematic", profile: "Noir light, urban rain, and precise shadow", composition: "Frames within frames, glances, and reflected surfaces", typography: "Condensed location cards and evidence labels" }, soundscape: { density: "Cinematic", profile: "Rain, neon hum, traffic, elevators, and quiet interiors", silence: "Drop the city bed before a decision" }, soundtrack: { direction: "Experimental", profile: "Muted brass, pulse bass, and detuned piano", dynamic: "Build unease below the language" }, aesthetic: { palette: "Inky blue, sodium amber, chrome, and red signal", texture: "Wet asphalt, film grain, smoked glass", motion: "Slow tracks, surveillance drift, and flicker" },
  },
  {
    id: "educational-atlas", name: "Educational Atlas", family: "Education", summary: "Clear, visually rich learning design that knows when to narrate and when to show a map, timeline, diagram, or comparison.", tone: "Curious, authoritative, inviting", narration: { mode: "Educational", profile: "Friendly expert guide", pace: "Steady with comprehension pauses", delivery: "Concrete examples before abstraction" }, illustration: { style: "Illustrated", profile: "Maps, diagrams, labelled illustration, and contextual scenes", composition: "One key idea per visual moment", typography: "Legible labels, timelines, and definition cards" }, soundscape: { density: "Minimal", profile: "Low-distraction environmental bed and gentle transitions", silence: "Use silence during diagrams and reflection" }, soundtrack: { direction: "Minimal", profile: "Light marimba, piano, and subtle pulse", dynamic: "Stay below instructional speech" }, aesthetic: { palette: "Deep navy, parchment, teal, and signal orange", texture: "Clean paper, cartographic line, soft grain", motion: "Diagram builds, map paths, and gentle callouts" },
  },
];

export function applyCreativeTemplate(project: FilmProject, templateId: string): FilmProject {
  const template = creativeTemplates.find((item) => item.id === templateId);
  if (!template) return project;
  return {
    ...project,
    experience: {
      ...project.experience,
      templateId: template.id,
      narration: template.narration.mode,
      visualStyle: template.illustration.style,
      sound: template.soundscape.density,
      music: template.soundtrack.direction,
    },
  };
}

export const defaultQualityReview: QualityReview = {
  literaryAccuracy: 0,
  narration: 0,
  visualStorytelling: 0,
  continuity: 0,
  sound: 0,
  pacing: 0,
  typography: 0,
  immersion: 0,
  threshold: 78,
};

export function defaultSourceMaterial(): SourceMaterial {
  return { name: "", type: "Original story", author: "", rights: "Pending review", wordCount: 0, ingestionStatus: "Not added" };
}

export function getChapterDuration(chapter: AudiobookChapter): string {
  const minutes = Math.floor(chapter.durationSeconds / 60);
  const seconds = chapter.durationSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function getQualityAverage(quality: QualityReview): number {
  const scores = [quality.literaryAccuracy, quality.narration, quality.visualStorytelling, quality.continuity, quality.sound, quality.pacing, quality.typography, quality.immersion];
  const populated = scores.filter((score) => score > 0);
  return populated.length ? Math.round(populated.reduce((sum, score) => sum + score, 0) / populated.length) : 0;
}

export function createAudiobookChapter(number: number): AudiobookChapter {
  return {
    id: `chapter-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    number,
    title: `Chapter ${number}`,
    durationSeconds: 300,
    narrationSummary: "Define the chapter's narrated movement and final turn.",
    narratorDirection: "Measured pace; let the image have room after key lines.",
    openingVisual: "Choose the first cinematic visual moment.",
    visualMoments: 5,
    soundscape: "Environmental detail with purposeful silence.",
    musicCue: "A restrained motif enters after the opening narration.",
    status: "Outline",
  };
}

export function withExperienceDefaults(project: FilmProject): FilmProject {
  return {
    ...project,
    source: { ...defaultSourceMaterial(), ...project.source },
    experience: { ...defaultExperienceSettings, ...project.experience },
    chapters: project.chapters ?? [],
    timeline: project.timeline ?? [],
    quality: { ...defaultQualityReview, ...project.quality },
  };
}

export function createFilmProject(input: {
  title: string;
  logline: string;
  genre: string;
}): FilmProject {
  const id = `film-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  return {
    id,
    title: input.title.trim() || "Untitled film",
    logline: input.logline.trim(),
    genre: input.genre.trim() || "Drama",
    status: "Development",
    story: { ...emptyStoryBible },
    characters: [],
    world: [],
    scenes: [],
    shots: [],
    frames: [],
    source: defaultSourceMaterial(),
    experience: { ...defaultExperienceSettings },
    chapters: [],
    timeline: [],
    quality: { ...defaultQualityReview },
    createdAt: Date.now(),
  };
}

export function sortShots(shots: Shot[]): Shot[] {
  return [...shots].sort((a, b) => a.order - b.order);
}

export function getProjectProgress(project: FilmProject): number {
  const checks = [
    Boolean(project.title && project.logline),
    Boolean(project.story.premise && project.story.actOne && project.story.actTwo && project.story.actThree),
    project.characters.length > 0,
    project.world.length > 0,
    project.scenes.length > 0,
    project.shots.length > 0,
    project.frames.length > 0,
    project.source.ingestionStatus === "Analysed",
    project.chapters.length > 0,
    project.timeline.length > 0,
    getQualityAverage(project.quality) >= project.quality.threshold,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function composeGenerationPrompt(input: {
  project: FilmProject;
  shot: Shot;
  scene?: Scene;
  artisticDirection: string;
}): string {
  const { project, shot, scene, artisticDirection } = input;
  const characters = scene?.characters ? `Characters present: ${scene.characters}.` : "";
  const sceneContext = scene
    ? `${scene.designation} ${scene.location}, ${scene.timeOfDay}. ${scene.action}`
    : "Scene context is being developed.";
  return [
    `Cinematic storyboard frame for the film project “${project.title}”.`,
    `Genre: ${project.genre}. Narrative premise: ${project.story.premise || project.logline}.`,
    `Scene: ${sceneContext}`,
    characters,
    `Shot ${shot.order}: ${shot.type}, ${shot.lens} lens, ${shot.movement} movement. Framing: ${shot.framing}.`,
    artisticDirection.trim(),
    "Intentional composition, production-ready visual continuity, no typography or watermarks.",
  ]
    .filter(Boolean)
    .join(" ");
}

export const studioSeed: StudioState = {
  activeProjectId: "sample-film",
  projects: [
    {
      id: "sample-film",
      title: "The Glass Horizon",
      logline: "A cartographer finds a map of a city that appears only at low tide, forcing her to choose between the place she lost and the future she can still make.",
      genre: "Speculative drama",
      status: "Development",
      story: {
        premise: "A vanished city returns at the edge of the sea, asking a meticulous mapmaker to confront the cost of preserving a past that no longer exists.",
        themes: "Memory as landscape; inheritance; the line between preservation and surrender.",
        actOne: "Mara discovers the impossible shoreline and the first coordinate that bears her father's handwriting.",
        actTwo: "Each visit redraws the city and alters the people she has left behind on the mainland.",
        actThree: "Mara must decide which map survives: the one that returns the city or the one that lets it disappear with grace.",
        narrativeArc: "Precision becomes obsession; obsession becomes a choice to release control.",
      },
      characters: [
        {
          id: "mara",
          name: "Mara Vale",
          role: "Protagonist · Cartographer",
          backstory: "Raised in a tide-worn observatory by a father who disappeared during a survey expedition.",
          arc: "Moves from documenting the world to participating in it.",
          relationships: "Daughter of Elias; guarded friendship with harbourmaster Ivo.",
          voice: "Exacting, economical, with sudden lyrical turns when speaking about coastlines.",
          locked: true,
        },
        {
          id: "ivo",
          name: "Ivo Serrin",
          role: "Harbourmaster · Witness",
          backstory: "Knows every vessel that has arrived but refuses to speak of the one that did not return.",
          arc: "Learns that silence can be an action, not a refuge.",
          relationships: "Mara's reluctant guide; kept Elias's final radio transmission.",
          voice: "Dry, unhurried, factual until emotion breaks through.",
          locked: false,
        },
      ],
      world: [
        {
          id: "saltmarsh",
          title: "Saltmarsh Observatory",
          category: "Location",
          detail: "A black-stone weather station cut into sea cliffs; brass instruments, salt bloom, low tungsten pools.",
        },
        {
          id: "tide-city",
          title: "The Tidal City",
          category: "Lore",
          detail: "An impossible street grid exposed for forty-three minutes at the year's lowest tide. Its geometry shifts with memory.",
        },
        {
          id: "visual-tone",
          title: "Visual language",
          category: "Visual language",
          detail: "Wet blacks, oxidized brass, smoke-grey daylight, restrained amber interiors; natural grain and lingering negative space.",
        },
      ],
      scenes: [
        {
          id: "scene-1",
          number: 1,
          heading: "The coordinate",
          designation: "INT.",
          location: "Saltmarsh Observatory",
          timeOfDay: "Pre-dawn",
          characters: "Mara",
          action: "Mara pins a rain-stained chart beneath a brass divider. A new coastline appears between two measured lines.",
          notes: "Keep the revelation quiet. The sound of the building settling should arrive before the mark is seen.",
        },
        {
          id: "scene-2",
          number: 2,
          heading: "Low water",
          designation: "EXT.",
          location: "Tidal flats",
          timeOfDay: "Blue hour",
          characters: "Mara, Ivo",
          action: "The tide pulls back across a mirror-flat shore, revealing lights beneath the surface.",
          notes: "Maintain screen direction from observatory path toward the sea.",
        },
      ],
      shots: [
        {
          id: "shot-1",
          sceneId: "scene-1",
          order: 1,
          type: "ECU",
          lens: "100mm macro",
          movement: "Locked-off",
          framing: "Graphite pencil line slowly blooming into a coastline beneath Mara's fingers.",
          status: "Locked",
        },
        {
          id: "shot-2",
          sceneId: "scene-1",
          order: 2,
          type: "MCU",
          lens: "50mm",
          movement: "Slow push-in",
          framing: "Mara stays at frame-right while the impossible coordinate holds in the negative space beside her.",
          status: "Ready",
        },
        {
          id: "shot-3",
          sceneId: "scene-2",
          order: 1,
          type: "EWS",
          lens: "28mm",
          movement: "Lateral track",
          framing: "Two small figures cross reflective tidal flats as a submerged grid of distant lights emerges.",
          status: "Draft",
        },
      ],
      frames: [],
      source: {
        name: "The Glass Horizon · Working manuscript",
        type: "Manuscript",
        author: "A. Vale",
        rights: "Owned",
        wordCount: 18420,
        ingestionStatus: "Analysed",
      },
      experience: { ...defaultExperienceSettings },
      chapters: [
        {
          id: "chapter-1",
          number: 1,
          title: "The coordinate",
          durationSeconds: 342,
          narrationSummary: "Mara discovers an impossible coastline inside an inherited chart and chooses to investigate before dawn.",
          narratorDirection: "Intimate and precise; leave a weighted pause after the coordinate appears.",
          openingVisual: "Rain crossing observatory glass while a graphite coastline blooms beneath a brass divider.",
          visualMoments: 6,
          soundscape: "Rain on slate, room tone, distant sea, a single settling timber.",
          musicCue: "Low glass harmonics enter only after the discovery.",
          status: "Ready",
        },
        {
          id: "chapter-2",
          number: 2,
          title: "Low water",
          durationSeconds: 418,
          narrationSummary: "Mara and Ivo cross the tidal flats as the city begins to reappear beneath the waterline.",
          narratorDirection: "Wider breath and lower register; reserve silence for the first visible lights.",
          openingVisual: "Two figures crossing a mirror-flat shore as submerged lights form an impossible grid.",
          visualMoments: 8,
          soundscape: "Wind, receding water, distant gulls, bootfall on wet sand.",
          musicCue: "A submerged pulse follows the city lights before falling away.",
          status: "In review",
        },
      ],
      timeline: [
        { id: "cue-1", chapterId: "chapter-1", time: "00:00", track: "Narration", label: "Chapter title and opening line", durationSeconds: 16 },
        { id: "cue-2", chapterId: "chapter-1", time: "00:03", track: "Visuals", label: "Rain across observatory glass", durationSeconds: 12 },
        { id: "cue-3", chapterId: "chapter-1", time: "00:12", track: "Ambience", label: "Rain, room tone, distant sea", durationSeconds: 38 },
        { id: "cue-4", chapterId: "chapter-1", time: "00:29", track: "Music", label: "Glass harmonic motif enters", durationSeconds: 24 },
        { id: "cue-5", chapterId: "chapter-1", time: "00:42", track: "Typography", label: "The coordinate", durationSeconds: 4 },
      ],
      quality: { literaryAccuracy: 92, narration: 86, visualStorytelling: 88, continuity: 90, sound: 83, pacing: 84, typography: 87, immersion: 89, threshold: 78 },
      createdAt: Date.now(),
    },
  ],
};
