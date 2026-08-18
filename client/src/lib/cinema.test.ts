import { describe, expect, it } from "vitest";
import { composeGenerationPrompt, createFilmProject, getProjectProgress, sortShots, studioSeed } from "./cinema";

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
});
