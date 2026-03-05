// functions/auth.ts
// Visit /auth once to kick off the Spotify OAuth flow and get your refresh token.

interface Env {
  SPOTIFY_CLIENT_ID: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  const url = new URL(request.url);
  const redirectUri = `${url.origin}/callback`;

  const params = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: "user-read-currently-playing user-read-playback-state",
    show_dialog: "true",
  });

  return Response.redirect(
    `https://accounts.spotify.com/authorize?${params}`,
    302
  );
};
