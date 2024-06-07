import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { TRPCError, initTRPC } from '@trpc/server'

const t = initTRPC.create()
const middleware = t.middleware


// custom middleware to grant access to only auth users
const isAuth = middleware(async (opts) => {

    const { getUser } = getKindeServerSession()
    const user = await getUser()

    if (!user || !user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    return opts.next({
        ctx: {
            userId: user.id,
            user,
        },
    })
})

export const router = t.router
export const publicProcedure = t.procedure

// what this does is makes sure the isAUth function is called first before anything when the procedure is called 
export const privateProcedure = t.procedure.use(isAuth)
