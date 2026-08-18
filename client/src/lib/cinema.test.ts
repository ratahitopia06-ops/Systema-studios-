import { describe, expect, it } from "vitest";
import { allCreativeTemplates, applyCreativeTemplate, buildTemplatePreviewScript, composeGenerationPrompt, createAudiobookChapter, createCustomTemplate, createFilmProject, creativeTemplates, getChapterDuration, getProjectProgress, getQualityAverage, removeCustomTemplateAndReassign, sortShots, studioSeed, withExperienceDefaults, withStudioDefaults } from "./cinema";

describe("cinema domain utilities", () => {
  it("creates a project with a usable default production state", () => {
    const project = createFilmProject({ title: "  New Film ", logline: "A maker starts.", genre: "Drama" });
    expect(project.title).toBe("New Film");
    expect(project.status).toBe("Development");
    expect(project.scenes).toEqual([]);
  });

  it("calculates project progress from meaningful production artifacts", () => {
    expect(getProjectProgress(studioSeed.projects[0]!)).toBeGreaterThan(70);
  });

  it("sorts shot cards by their intended editorial order", () => {
    const shots = studioSeed.projects[0]!.shots;
    expect(sortShots([shots[1]!, shots[0]!]).map((shot) => shot.id)).toEqual(["shot-1", "shot-2"]);
  });

  it("builds a context-rich, structured generation prompt", () => {
    const project = studioSeed.projects[0]!;
    const prompt = composeGenerationPrompt({
      project,
      shot: project.shots[0]!,
      scene: project.scenes[0]!,
      artisticDirection: "Subdued weathered texture.",
    });
    expect(prompt).toContain("100mm macro");
    expect(prompt).toContain("Saltmarsh Observatory");
    expect(prompt).toContain("Subdued weathered texture.");
  });

  it("formats an audiovisual chapter duration for a timeline", () => {
    const chapter = createAudiobookChapter(3);
    chapter.durationSeconds = 367;
    expect(getChapterDuration(chapter)).toBe("06:07");
  });

  it("averages the populated audiovisual quality dimensions", () => {
    const quality = { ...studioSeed.projects[0]!.quality, literaryAccuracy: 90, narration: 80, visualStorytelling: 70, continuity: 0, sound: 0, pacing: 0, typography: 0, immersion: 0 };
    expect(getQualityAverage(quality)).toBe(80);
  });

  it("adds visual-audiobook defaults to an existing stored project", () => {
    const legacyProject = { ...studioSeed.projects[0]! };
    delete (legacyProject as Partial<typeof legacyProject>).source;
    delete (legacyProject as Partial<typeof legacyProject>).experience;
    delete (legacyProject as Partial<typeof legacyProject>).chapters;
    delete (legacyProject as Partial<typeof legacyProject>).timeline;
    delete (legacyProject as Partial<typeof legacyProject>).quality;
    const hydrated = withExperienceDefaults(legacyProject as typeof studioSeed.projects[number]);
    expect(hydrated.source.ingestionStatus).toBe("Not added");
    expect(hydrated.chapters).toEqual([]);
  });

  it("preserves an uploaded source reference across project hydration", () => {
    const project = studioSeed.projects[0]!;
    const hydrated = withExperienceDefaults({
      ...project,
      source: {
        ...project.source,
        ingestionStatus: "Uploaded",
        fileKey: "cinema-os/1/sources/story.txt",
        fileUrl: "/manus-storage/cinema-os/1/sources/story.txt",
        sizeBytes: 4096,
      },
    });
    expect(hydrated.source.ingestionStatus).toBe("Uploaded");
    expect(hydrated.source.fileKey).toContain("sources/story.txt");
    expect(hydrated.source.sizeBytes).toBe(4096);
  });

  it("attaches a creative profile to project-level narration, illustration, soundscape, and soundtrack settings", () => {
    const template = creativeTemplates.find((item) => item.id === "anime-reverie")!;
    const styled = applyCreativeTemplate(studioSeed.projects[0]!, template.id);
    expect(styled.experience.templateId).toBe("anime-reverie");
    expect(styled.experience.narration).toBe(template.narration.mode);
    expect(styled.experience.visualStyle).toBe(template.illustration.style);
    expect(styled.experience.sound).toBe(template.soundscape.density);
    expect(styled.experience.music).toBe(template.soundtrack.direction);
  });

  it("creates and resolves a reusable custom template without mutating its built-in seed", () => {
    const seed = creativeTemplates[0]!;
    const custom = createCustomTemplate(seed);
    custom.narration.profile = "Soft, investigative, and close";
    const library = allCreativeTemplates([custom]);
    const styled = applyCreativeTemplate(studioSeed.projects[0]!, custom.id, library);
    expect(custom.custom).toBe(true);
    expect(custom.id).not.toBe(seed.id);
    expect(seed.narration.profile).not.toBe(custom.narration.profile);
    expect(styled.experience.templateId).toBe(custom.id);
    expect(withStudioDefaults({ ...studioSeed, customTemplates: [custom] }).customTemplates).toHaveLength(1);
  });

  it("provides concise spoken preview copy for any creative profile", () => {
    const preview = buildTemplatePreviewScript(creativeTemplates[0]!);
    expect(preview).toContain("edge of the known map");
    expect(preview.split(" ").length).toBeLessThan(40);
  });

  it("reassigns an attached custom profile to the fallback template and preserves that state on reload", () => {
    const custom = createCustomTemplate(creativeTemplates[2]!);
    const attachedProject = applyCreativeTemplate(studioSeed.projects[0]!, custom.id, allCreativeTemplates([custom]));
    const afterDeletion = removeCustomTemplateAndReassign({ ...studioSeed, projects: [attachedProject], customTemplates: [custom] }, custom.id);
    const reloaded = withStudioDefaults(JSON.parse(JSON.stringify(afterDeletion)));
    expect(afterDeletion.customTemplates).toEqual([]);
    expect(afterDeletion.projects[0]!.experience.templateId).toBe("cinematic-drama");
    expect(reloaded.projects[0]!.experience.templateId).toBe("cinematic-drama");
    expect(reloaded.customTemplates).toEqual([]);
  });
});
