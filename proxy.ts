import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Checagem otimista de sessão a cada navegação (renomeado de middleware.ts
 * para proxy.ts no Next.js 16 — ver node_modules/next/dist/docs/01-app/
 * 03-api-reference/03-file-conventions/proxy.md).
 *
 * Isto NÃO é a autorização real — apenas evita que um visitante sem sessão
 * chegue a uma rota protegida. A checagem que importa fica na DAL
 * (lib/supabase/dal.ts), usada dentro de cada Server Component/Action.
 */
const PUBLIC_ROUTES = ["/login"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase ainda não configurado (ver SETUP.md) — deixa passar sem checar
  // sessão em vez de derrubar toda a aplicação com um 500.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims);
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isAuthenticated && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
