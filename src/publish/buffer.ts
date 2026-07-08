import { env } from '../config.js';
import { log } from '../util/log.js';

const BUFFER_API = 'https://api.buffer.com';

/** True when both a Buffer token and at least one TikTok channel id are set. */
export function isConfigured(): boolean {
  return Boolean(env.bufferToken) && env.bufferTiktokChannelIds.length > 0;
}

/** POST a GraphQL query to Buffer's Publish API. */
async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!env.bufferToken) throw new Error('CK8 (Buffer token) not set — cannot publish');
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

/** Post one video to all configured TikTok channels. Returns created post ids. */
export async function publishToTiktok(opts: {
  text: string;
  videoUrl: string;
  thumbnailUrl: string;
  mode: PostMode;
  dueAt?: string;
}): Promise<string[]> {
  const channelIds = env.bufferTiktokChannelIds;
  if (channelIds.length === 0) {
    throw new Error('BUFFER_TIKTOK_CHANNEL_IDS not set — nothing to post to');
  }
  const ids: string[] = [];
  for (const channelId of channelIds) {
    const id = await createPost({ ...opts, channelId });
    log.ok(`Buffer post created ${id} on channel ${channelId}`);
    ids.push(id);
  }
  return ids;
}
