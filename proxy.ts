import { withAuth } from "next-auth/middleware"

// Migrated from middleware.ts to proxy.ts
export default withAuth({
    pages: {
        signIn: "/login",
    },
})

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/settings/:path*",
        "/projects/:path*",
        "/api/projects/:path*",
        "/api/generate/:path*",
    ],
}
