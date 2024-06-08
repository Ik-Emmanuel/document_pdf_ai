import {
    privateProcedure,
    publicProcedure,
    router,
} from './trpc'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { TRPCError } from '@trpc/server'
import { db } from '@/db'
import { z } from 'zod'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'


// define all api endpoints here 

export const appRouter = router({
    //api 1
    authCallback: publicProcedure.query(async () => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()

        if (!user?.id || !user?.email)
            throw new TRPCError({ code: 'UNAUTHORIZED' })

        // check if the user is in the database
        const dbUser = await db.user.findFirst({
            where: {
                id: user.id,
            },
        })

        if (!dbUser) {
            // create user in db
            await db.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                },
            })
        }

        return { success: true }
    }),

    //api 2 
    getUserFiles: privateProcedure.query(async ({ ctx }) => {

        // obtained from the middle where context
        const { userId } = ctx

        return await db.file.findMany({
            where: {
                userId,
            },
        })
    }),

    //api 3
    deleteFile: privateProcedure
        // enforce types at runtime (make sure we always pass the id to this function)
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = ctx

            const file = await db.file.findFirst({
                where: {
                    id: input.id,
                    // ensure its the owner that deletes
                    userId,
                },
            })

            if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

            await db.file.delete({
                where: {
                    id: input.id,
                },
            })

            return file
        }),

    //api 4
    getFile: privateProcedure
        .input(z.object({ key: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { userId } = ctx

            const file = await db.file.findFirst({
                where: {
                    key: input.key,
                    userId,
                },
            })

            if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

            return file
        }),

           //api 5
        getFileUploadStatus: privateProcedure
        .input(z.object({ fileId: z.string() }))
        .query(async ({ input, ctx }) => {
            const file = await db.file.findFirst({
            where: {
                id: input.fileId,
                userId: ctx.userId,
            },
            })
    
            if (!file) return { status: 'PENDING' as const }
    
            return { status: file.uploadStatus }
        }),


        //api 6
        // infinitely fetch users message from db as user scrolls
        // .nullish mean it is optional 
    getFileMessages: privateProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.string().nullish(),
        fileId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { userId } = ctx
      const { fileId, cursor } = input
      const limit = input.limit ?? INFINITE_QUERY_LIMIT

      const file = await db.file.findFirst({
        where: {
          id: fileId,
          userId,
        },
      })

      if (!file) throw new TRPCError({ code: 'NOT_FOUND' })

      const messages = await db.message.findMany({
        take: limit + 1,
        where: {
          fileId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        cursor: cursor ? { id: cursor } : undefined,
        select: {
          id: true,
          isUserMessage: true,
          createdAt: true,
          text: true,
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem?.id
      }

      return {
        messages,
        nextCursor,
      }
    }),
})

// This tells app whihc api routes exists and which data types they return
export type AppRouter = typeof appRouter