import { env } from '../config.js';
import { log } from '../util/log.js';

const BUFFER_API = 'https://api.buffer.com';

export type Platform = 'tiktok' | 'instagram' | 'facebook' | 'youtube';

/** All configured channel ids across every platform. */
function allChannels(): { id: string; platform: Platform }[] {
  const out: { id: string; platform: Platform }[] = [];
  (Object.keys(env.bufferChannels) as Platform[]).forEach((platform) => {
    for (const id of env.bufferChannels[platform]) out.push({ id, platform });
  });
  return out;
}

/** True when a Buffer token and at least one channel (any platform) are set. */
export function isConfigured(): boolean {
  return Boolean(env.bufferToken) && allChannels().length > 0;
}

/** Per-service metadata so each platform posts the video as a Reel/Short. */
function metadataFor(platform: Platform, title: string): Record<string, unknown> | undefined {
  switch (platform) {
    case 'instagram': return { instagram: { type: 'reel', shouldShareToFeed: true } };
    case 'facebook': return { facebook: { type: 'reel' } };
    case 'youtube': return { youtube: { title: title.slice(0, 100) } };
    default: return undefined; // tiktok needs none
  }
}

/** POST a GraphQL query to Buffer's Publish API. */
async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!env.bufferToken) throw new Error('BUFFER_ACCESS_TOKEN not set — cannot publish');
  const res = await fetch(BUFFER_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.bufferToken}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) {
    throw new Error(`Buffer GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  if (!body.data) throw new Error('Buffer GraphQL: empty response');
  return body.data;
}

let _orgId: string | null = null;
export async function resolveOrganizationId(): Promise<string> {
  if (_orgId) return _orgId;
  const data = await gql<{ account: { organizations: { id: string }[] } }>(
    `query { account { organizations { id } } }`,
    {},
  );
  const id = data.account?.organizations?.[0]?.id;
  if (!id) throw new Error('Buffer: no organization found for this token');
  _orgId = id;
  return id;
}

export interface Channel {
  id: string;
  name: string;
  service: string;
}

/** List channels for the org; used to discover/verify the TikTok channel id. */
export async function listChannels(): Promise<Channel[]> {
  const organizationId = await resolveOrganizationId();
  const data = await gql<{ channels: Channel[] }>(
    `query Channels($input: ChannelsInput!) {
       channels(input: $input) { id name service }
     }`,
    { input: { organizationId } },
  );
  return (data.channels ?? []).map((c) => ({ ...c, service: (c.service ?? '').toLowerCase() }));
}

export type PostMode = 'shareNow' | 'addToQueue' | 'customScheduled';

export interface CreatePostArgs {
  channelId: string;
  text: string;
  videoUrl: string;
  thumbnailUrl: string;
  mode: PostMode;
  /** ISO-8601, required only when mode === 'customScheduled' */
  dueAt?: string;
  metadata?: Record<string, unknown>;
}

/** Create a single video post on one channel. Returns the Buffer post id. */
export async function createPost(args: CreatePostArgs): Promise<string> {
  const input: Record<string, unknown> = {
    text: args.text,
    channelId: args.channelId,
    schedulingType: 'automatic',
    mode: args.mode,
    assets: [{ video: { url: args.videoUrl, thumbnailUrl: args.thumbnailUrl } }],
  };
  if (args.mode === 'customScheduled' && args.dueAt) input.dueAt = args.dueAt;
  if (args.metadata) input.metadata = args.metadata;

  const data = await gql<{
    createPost:
      | { __typename: 'PostActionSuccess'; post: { id: string; status: string } }
      | { __typename: 'MutationError'; message: string };
  }>(
    `mutation CreatePost($input: CreatePostInput!) {
       createPost(input: $input) {
         __typename
         ... on PostActionSuccess { post { id status } }
         ... on MutationError { message }
       }
     }`,
    { input },
  );

  const r = data.createPost;
  if (r.__typename === 'MutationError') {
    throw new Error(`Buffer createPost rejected: ${r.message}`);
  }
  return r.post.id;
}

/**
 * Post one video to every configured channel across all platforms (TikTok,
 * Instagram Reels, Facebook Reels, YouTube Shorts). Returns created post ids.
 */
export async function publishReelToBuffer(opts: {
  text: string;
  videoUrl: string;
  thumbnailUrl: string;
  mode: PostMode;
  dueAt?: string;
}): Promise<string[]> {
  const channels = allChannels();
  if (channels.length === 0) {
    throw new Error('No Buffer channels configured — set BUFFER_<PLATFORM>_CHANNEL_IDS');
  }
  const ids: string[] = [];
  for (const { id: channelId, platform } of channels) {
    const postId = await createPost({ ...opts, channelId, metadata: metadataFor(platform, opts.text) });
    log.ok(`Buffer post ${postId} on ${platform} channel ${channelId}`);
    ids.push(postId);
  }
  return ids;
}
