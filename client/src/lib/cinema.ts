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
      createdAt: Date.now(),
    },
  ],
};
