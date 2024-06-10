import { AppRouter } from '@/trpc'
import { createTRPCReact } from '@trpc/react-query'


// This is what provides type safety across you entire application
export const trpc = createTRPCReact<AppRouter>({})
