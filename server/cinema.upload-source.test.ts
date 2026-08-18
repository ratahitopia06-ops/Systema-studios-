import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { storagePut } = vi.hoisted(() => ({ storagePut: vi.fn() }));
const { upsertCinemaSourceIngestion, markCinemaSourceReady, upsertCinemaCustomTemplate, listCinemaCustomTemplates, deleteCinemaCustomTemplate } = vi.hoisted(() => ({ upsertCinemaSourceIngestion: vi.fn(), markCinemaSourceReady: vi.fn(), upsertCinemaCustomTemplate: vi.fn(), listCinemaCustomTemplates: vi.fn(), deleteCinemaCustomTemplate: vi.fn() }));

vi.mock("./storage", () => ({ storagePut }));
vi.mock("./db", () => ({ upsertCinemaSourceIngestion, markCinemaSourceReady, upsertCinemaCustomTemplate, listCinemaCustomTemplates, deleteCinemaCustomTemplate }));

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "cinema-user",
      email: "cinema@example.com",
      name: "Cinema User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("cinema.uploadSource", () => {
  beforeEach(() => {
    storagePut.mockReset();
    upsertCinemaSourceIngestion.mockReset();
    markCinemaSourceReady.mockReset();
    upsertCinemaCustomTemplate.mockReset();
    listCinemaCustomTemplates.mockReset();
    deleteCinemaCustomTemplate.mockReset();
    storagePut.mockResolvedValue({ key: "cinema-os/42/sources/novel_a1b2c3d4.txt", url: "/manus-storage/cinema-os/42/sources/novel_a1b2c3d4.txt" });
    upsertCinemaSourceIngestion.mockResolvedValue(undefined);
  });

  it("stores an authorized source file under the user's project source prefix", async () => {
    const caller = appRouter.createCaller(createContext());
    const result = await caller.cinema.uploadSource({
      fileName: "novel.txt",
      mimeType: "text/plain",
      contentBase64: Buffer.from("A story begins at low tide.").toString("base64"),
      projectId: "project-horizon",
      rightsStatus: "Owned",
    });

    expect(storagePut).toHaveBeenCalledWith(
      "cinema-os/42/sources/novel.txt",
      expect.any(Buffer),
      "text/plain"
    );
    expect(upsertCinemaSourceIngestion).toHaveBeenNthCalledWith(1, expect.objectContaining({ projectId: "project-horizon", status: "selected" }));
    expect(upsertCinemaSourceIngestion).toHaveBeenNthCalledWith(2, expect.objectContaining({ projectId: "project-horizon", status: "uploaded" }));
    expect(result).toEqual({ key: "cinema-os/42/sources/novel_a1b2c3d4.txt", url: "/manus-storage/cinema-os/42/sources/novel_a1b2c3d4.txt", sizeBytes: 27, status: "uploaded" });
  });

  it("rejects file types outside the supported document ingestion surface", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(
      caller.cinema.uploadSource({
        fileName: "archive.exe",
        mimeType: "application/x-msdownload",
        contentBase64: Buffer.from("unsafe").toString("base64"),
        projectId: "project-horizon",
        rightsStatus: "Owned",
      })
    ).rejects.toThrow("Unsupported source type");
    expect(storagePut).not.toHaveBeenCalled();
  });

  it("moves a persisted uploaded source to ready for analysis", async () => {
    markCinemaSourceReady.mockResolvedValue({ status: "ready_for_analysis" });
    const caller = appRouter.createCaller(createContext());
    await expect(caller.cinema.markSourceReady({ projectId: "project-horizon" })).resolves.toEqual({ status: "ready_for_analysis" });
    expect(markCinemaSourceReady).toHaveBeenCalledWith(42, "project-horizon");
  });

  it("persists, lists, and deletes custom profiles within the active project scope", async () => {
    const template = {
      id: "custom-noir-profile", name: "My Noir", family: "Drama", summary: "A personal nocturnal direction.", tone: "Tense and precise",
      narration: { mode: "Dramatic", profile: "Close and careful", pace: "Measured", delivery: "Understated" },
      illustration: { style: "Cinematic", profile: "Rainy noir frames", composition: "Reflections and shadow", typography: "Condensed labels" },
      soundscape: { density: "Cinematic", profile: "Rain and neon", silence: "Hold before decisions" },
      soundtrack: { direction: "Experimental", profile: "Muted brass", dynamic: "Tight pulse" },
      aesthetic: { palette: "Ink and amber", texture: "Wet grain", motion: "Slow track" },
      custom: true as const, createdAt: 1_000_000,
    };
    upsertCinemaCustomTemplate.mockResolvedValue({ id: 1 });
    listCinemaCustomTemplates.mockResolvedValue([{ templateId: template.id, templateJson: JSON.stringify(template) }]);
    deleteCinemaCustomTemplate.mockResolvedValue({ success: true });
    const caller = appRouter.createCaller(createContext());

    await caller.cinema.saveCustomTemplate({ projectId: "project-horizon", template });
    expect(upsertCinemaCustomTemplate).toHaveBeenCalledWith(expect.objectContaining({ userId: 42, projectId: "project-horizon", templateId: template.id, name: "My Noir" }));
    await expect(caller.cinema.listCustomTemplates({ projectId: "project-horizon" })).resolves.toEqual([{ templateId: template.id, template }]);
    await expect(caller.cinema.deleteCustomTemplate({ projectId: "project-horizon", templateId: template.id })).resolves.toEqual({ success: true });
    expect(deleteCinemaCustomTemplate).toHaveBeenCalledWith(42, "project-horizon", template.id);
  });
});
