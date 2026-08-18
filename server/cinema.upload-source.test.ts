import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { storagePut } = vi.hoisted(() => ({ storagePut: vi.fn() }));
const { upsertCinemaSourceIngestion, markCinemaSourceReady } = vi.hoisted(() => ({ upsertCinemaSourceIngestion: vi.fn(), markCinemaSourceReady: vi.fn() }));

vi.mock("./storage", () => ({ storagePut }));
vi.mock("./db", () => ({ upsertCinemaSourceIngestion, markCinemaSourceReady }));

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
});
