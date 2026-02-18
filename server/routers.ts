import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { getAllProjects, getProjectById, getSubprojectsByProjectId, getCollaboratorsBySubprojectId, getAllMeetings, getMeetingsByProjectId, getMeetingById, getTasksByMeetingId, getTasksByMeetingAndCollaborator, getTaskById, getTaskHistory } from "./db";

export const appRouter = router({
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

  projects: router({
    list: publicProcedure.query(async () => {
      const allProjects = await getAllProjects();
      return allProjects.map(p => ({
        ...p,
        dateFrom: p.dateFrom,
        dateTo: p.dateTo,
      }));
    }),
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getProjectById(input);
    }),
  }),

  subprojects: router({
    listByProject: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getSubprojectsByProjectId(input);
    }),
  }),

  collaborators: router({
    listBySubproject: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getCollaboratorsBySubprojectId(input);
    }),
  }),

  meetings: router({
    list: publicProcedure.query(async () => {
      return await getAllMeetings();
    }),
    listByProject: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getMeetingsByProjectId(input);
    }),
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getMeetingById(input);
    }),
  }),

  tasks: router({
    listByMeeting: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getTasksByMeetingId(input);
    }),
    listByMeetingAndCollaborator: publicProcedure.input(z.object({ meetingId: z.number(), collaboratorId: z.number() })).query(async ({ input }) => {
      return await getTasksByMeetingAndCollaborator(input.meetingId, input.collaboratorId);
    }),
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getTaskById(input);
    }),
  }),

  taskHistory: router({
    listByTask: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await getTaskHistory(input);
    }),
  }),
});

export type AppRouter = typeof appRouter;
