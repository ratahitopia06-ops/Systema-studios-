import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { generateImage } from "./_core/imageGeneration";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";

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
