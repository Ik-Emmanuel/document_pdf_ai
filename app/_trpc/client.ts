import { AppRouter } from '@/trpc'
import { createTRPCReact } from '@trpc/react-query'


// This is what provides type safefty across you entire application
export const trpc = createTRPCReact<AppRouter>({})
