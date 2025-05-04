import { useQuery } from "@tanstack/react-query";

const baseUrl = "http://localhost:3001";

const fetchFn = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) throw new Error();

  return res.json() as T;
};

const postFn = async <Body, Response>(
  url: string,
  body: Body,
  put?: boolean
): Promise<Response> => {
  const res = await fetch(url, {
    method: put ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    credentials: "include",
  });

  if (!res.ok) throw new Error();

  return res.json() as Response;
};

export type Endpoint<T> = (param: string) => {
  key: string[];
  request: (body?: any) => Promise<T>;
};

type Post = { id: string; content: string, createdAt: string };
type NewPost = Omit<Post, "id" | "createdAt">;

export const Endpoints = {
  posts: {
    get: () => {
      return {
        key: ["GET-posts"],
        request: () =>
          fetchFn<
            (Post & {
              user: {
                username: string;
                displayName: string;
              };
            })[]
          >(`${baseUrl}/posts`),
      };
    },
    create: () => {
      return {
        key: ["POST-posts"],
        request: (body: NewPost) =>
          postFn<NewPost, Post>(`${baseUrl}/posts`, body),
      };
    },
  },
  auth: {
    signup: () => {
      return {
        key: ["POST-auth-signup"],
        request: (body: {
          username: string;
          email: string;
          password: string;
          displayName: string;
        }) =>
          postFn<
            { username: string; email: string; password: string },
            { id: string; username: string; email: string }
          >(`${baseUrl}/auth/signup`, body),
      };
    },
    login: () => {
      return {
        key: ["POST-auth-login"],
        request: (body: { email: string; password: string }) =>
          postFn<
            { email: string; password: string },
            { id: string; username: string; email: string }
          >(`${baseUrl}/auth/login`, body),
      };
    },
    logout: () => {
      return {
        key: ["GET-auth-logout"],
        request: () => fetchFn(`${baseUrl}/auth/logout`),
      };
    },
    me: () => {
      return {
        key: ["GET-auth-me"],
        request: () =>
          fetchFn<{ id: string; username: string; email: string }>(
            `${baseUrl}/auth/me`
          ),
      };
    },
  },
  users: {
    get: () => {
      return {
        key: ["GET-users"],
        request: () =>
          fetchFn<{ id: string; username: string; email: string }[]>(
            `${baseUrl}/users`
          ),
      };
    },
    getById: (id: string) => {
      return {
        key: ["GET-users", id],
        request: () =>
          fetchFn<{
            id: string;
            username: string;
            email: string;
            isMyself: boolean;
            bio?: string;
            profilePictureUrl?: string;
            bannerPictureUrl?: string;
            displayName: string;
          }>(`${baseUrl}/users/${id}`),
      };
    },
    search: (query: string) => {
      return {
        key: ["GET-users", query],
        request: () =>
          fetchFn<{ id: string; username: string; email: string }[]>(
            `${baseUrl}/users/search?query=${query}`
          ),
      };
    },
    updateById: (id: string) => {
      return {
        key: ["PUT-users", id],
        request: (body: {
          email: string;
          bio?: string;
          profilePictureUrl?: string;
          bannerPictureUrl?: string;
          displayName: string;
        }) =>
          postFn<
            {
              email: string;
              bio?: string;
              profilePictureUrl?: string;
              bannerPictureUrl?: string;
              displayName: string;
            },
            { username: string; email: string }
          >(`${baseUrl}/users/${id}`, body, true),
      };
    },
  },
  followers: {
    followUser: (key: string) => {
      return {
        key: ["post-following", key],
        request: (followingId: string) =>
          postFn<
            { followingId: string },
            { follower: { followingId: string; ownerUserId: string } }
          >(`${baseUrl}/followers`, { followingId: followingId }),
      };
    },
    unfollowUser: (key: string) => {
      return {
        key: ["post-unfollowing", key],
        request: (followingId: string) =>
          postFn<
            { followingId: string },
            { follower: { followingId: string; ownerUserId: string } }
          >(`${baseUrl}/followers/unfollow`, { followingId: followingId }),
      };
    },

    listFollowing: (key: string) => {
      return {
        key: ["GET-following", key],
        request: (findBy: {
          ownerUserId: string | undefined;
          followingId: string | undefined;
        }) => {
          const args = findBy.ownerUserId
            ? `?owningUserId=${findBy.ownerUserId}`
            : `?followingId=${findBy.followingId}`;
          return fetchFn<
            {
              id: string;
              ownerUserId: string;
              followingId: string;
            }[]
          >(`${baseUrl}/followers${args}`);
        },
      };
    },
  },
  feed: {
    get: () => {
      return {
        key: ["GET-feed"],
        request: () =>
          fetchFn<
            (Post & {
              user: {
                username: string;
                displayName: string;
              };
            })[]
          >(`${baseUrl}/feed`),
      };
    },
  },
} as const satisfies Record<string, Record<string, Endpoint<any>>>;

type ReactQueryOptions<T> = Parameters<typeof useQuery<T>>[0];

export const useSmatterQuery = <T>(
  endpoint: ReturnType<Endpoint<T>>,
  options?: Omit<ReactQueryOptions<T>, "queryKey" | "queryFn">,
  curryFunction?: (body: any) => Promise<T>
) => {
  return useQuery({
    ...options,
    queryKey: endpoint.key,
    queryFn: curryFunction ? curryFunction : endpoint.request,
  });
};
