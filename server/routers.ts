import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { markCinemaSourceReady, upsertCinemaSourceIngestion } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  cinema: router({
    uploadSource: protectedProcedure
      .input(
        z.object({
          fileName: z.string().trim().min(1).max(180),
          mimeType: z.string().trim().min(1).max(120),
          contentBase64: z.string().min(1).max(11_200_000),
          projectId: z.string().trim().min(1).max(96),
          rightsStatus: z.enum(["Owned", "Public domain", "Licensed", "Pending review"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const allowedTypes = new Set([
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
          "text/markdown",
          "application/epub+zip",
        ]);
        if (!allowedTypes.has(input.mimeType)) {
          throw new Error("Unsupported source type. Upload PDF, DOCX, TXT, Markdown, or EPUB.");
        }
        const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
        const bytes = Buffer.from(input.contentBase64, "base64");
        if (bytes.byteLength > 8 * 1024 * 1024) {
          throw new Error("Source files must be 8 MB or smaller for this ingestion step.");
        }
        await upsertCinemaSourceIngestion({
          userId: ctx.user.id,
          projectId: input.projectId,
          sourceName: input.fileName,
          sourceType: input.mimeType,
          rightsStatus: input.rightsStatus,
          status: "selected",
        });
        const { key, url } = await storagePut(`cinema-os/${ctx.user.id}/sources/${sanitizedName}`, bytes, input.mimeType);
        await upsertCinemaSourceIngestion({
          userId: ctx.user.id,
          projectId: input.projectId,
          sourceName: input.fileName,
          sourceType: input.mimeType,
          rightsStatus: input.rightsStatus,
          storageKey: key,
          storageUrl: url,
          sizeBytes: bytes.byteLength,
          status: "uploaded",
        });
        return { key, url, sizeBytes: bytes.byteLength, status: "uploaded" as const };
      }),
    markSourceReady: protectedProcedure
      .input(z.object({ projectId: z.string().trim().min(1).max(96) }))
      .mutation(({ ctx, input }) => markCinemaSourceReady(ctx.user.id, input.projectId)),
    assist: protectedProcedure
      .input(
        z.object({
          projectTitle: z.string().trim().min(1).max(160),
          projectContext: z.string().trim().max(6000),
          messages: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string().trim().min(1).max(3000),
              })
            )
            .min(1)
            .max(12),
        })
      )
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are the CINEMA OS Script Assistant for the project “${input.projectTitle}”. Help writers and directors develop screen stories with specific, concise, production-minded guidance. Work from this project context: ${input.projectContext}. Do not imitate living filmmakers, do not expose hidden reasoning, and do not claim that unverified continuity facts are true. When useful, distinguish observations, options, and open questions.`,
            },
            ...input.messages,
          ],
        });

        return {
          content: String(response.choices[0]?.message?.content ?? "I could not form a response. Please try again."),
        };
      }),
    generateFrame: protectedProcedure
      .input(
        z.object({
          prompt: z.string().trim().min(20).max(8000),
        })
      )
      .mutation(async ({ input }) => {
        const result = await generateImage({ prompt: input.prompt, quality: "medium" });
        return { url: result.url };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
