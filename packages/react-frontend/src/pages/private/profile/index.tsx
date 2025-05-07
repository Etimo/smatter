import { useMutation } from "@tanstack/react-query";
import { Calendar, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { Endpoints, useSmatterQuery } from "../../../api/api";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import { useUserStore } from "../../../stores/user-store";
import { EditProfileModal } from "./edit-profile";
import { ProfileSmats } from "./profile-smats";

const ProfilePage = () => {
  const loggedInUserId = useUserStore().user?.id;
  const paramsUserId = useParams().userId;
  const profileQuery = useSmatterQuery(Endpoints.users.getById(paramsUserId!));

  const followingQuery = useSmatterQuery(
    Endpoints.followers.listFollowing("loggedinuserfollowing"),
    { enabled: !!loggedInUserId, gcTime: 0 },
    () =>
      Endpoints.followers
        .listFollowing("loggedinusersfollowing")
        .request({ ownerUserId: loggedInUserId, followingId: undefined })
  );

  const profileFollowersQuery = useSmatterQuery(
    Endpoints.followers.listFollowing(paramsUserId + "following"),
    { enabled: !!loggedInUserId, gcTime: 0 },
    () =>
      Endpoints.followers
        .listFollowing(paramsUserId + "profileusersfollowers")
        .request({ ownerUserId: undefined, followingId: paramsUserId })
  );

  const profileFollowingQuery = useSmatterQuery(
    Endpoints.followers.listFollowing(paramsUserId + "profileuserfollowing"),
    { enabled: !!loggedInUserId, gcTime: 0 },
    () =>
      Endpoints.followers
        .listFollowing(paramsUserId + "profileusersfollowing")
        .request({ ownerUserId: paramsUserId, followingId: undefined })
  );

  const followMutation = useMutation({
    mutationFn: Endpoints.followers.followUser("userfollow").request,
    onSuccess: async () => {
      await profileFollowersQuery.refetch();
      await followingQuery.refetch();
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: Endpoints.followers.unfollowUser("userunfollow").request,
    onSuccess: async () => {
      await profileFollowersQuery.refetch();
      await followingQuery.refetch();
    },
  });

  if (
    profileQuery.isError ||
    followingQuery.isError ||
    profileFollowersQuery.isError ||
    profileFollowingQuery.isError
  )
    return <p>Error: BAD QUERIES!</p>;
  if (
    !loggedInUserId ||
    profileQuery.isPending ||
    followingQuery.isPending ||
    profileFollowersQuery.isPending ||
    profileFollowingQuery.isPending
  )
    return <div>Loading...</div>;

  const user = profileQuery.data;
  //TODO: Probably should be in a common state somewhere, but for later.
  const followingUser = followingQuery.data.find(
    (p) => p.followingId === paramsUserId
  );

  return (
    <>
      <div className="mx-auto bg-white dark:bg-gray-900">
        <header className="border-b border-gray-200 dark:border-gray-800">
          <div className="relative h-48 bg-gray-300 dark:bg-gray-700">
            <img
              src={user.bannerPictureUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
            <Avatar className="absolute -bottom-16 left-4 w-32 h-32 border-4 border-white dark:border-gray-900">
              <AvatarImage src={user.profilePictureUrl} alt={user.username} />
              <AvatarFallback>{user.username}</AvatarFallback>
            </Avatar>
          </div>
          <div className="p-4 pt-20">
            {user.isMyself && (
              <div className="mb-8">
                <EditProfileModal
                  userId={user.id}
                  defaultValues={{ ...user }}
                />
              </div>
            )}

            {!user.isMyself && !followingUser && (
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => followMutation.mutate(paramsUserId!)}
                >
                  Follow this smatterer
                </Button>
              </div>
            )}
            {!user.isMyself && followingUser && (
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => unfollowMutation.mutate(paramsUserId!)}
                >
                  Unfollow this smatterer
                </Button>
              </div>
            )}
            <h2 className="text-xl font-bold">{user.displayName}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user.username}</p>
            <p className="my-2">{user.bio}</p>
            <div className="flex flex-wrap gap-y-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center mr-4">
                <MapPin className="h-4 w-4 mr-1" />
                {/* {user.location} */}
                Stockholm
              </div>

              <div className="flex items-center mr-4">
                <Calendar className="h-4 w-4 mr-1" />
                Joined 2021-01-01
                {/* {user.joinDate} */}
              </div>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              <p>
                <span className="font-bold">
                  {profileFollowingQuery.data.length}{" "}
                </span>{" "}
                <span className="text-gray-500 dark:text-gray-400">
                  Following
                </span>
              </p>
              <p>
                <span className="font-bold">
                  {profileFollowersQuery.data.length}{" "}
                </span>{" "}
                <span className="text-gray-500 dark:text-gray-400">
                  Followers
                </span>
              </p>
            </div>
          </div>
        </header>
        <main>
          <nav className="flex border-b border-gray-200 dark:border-gray-800">
            <Button
              variant="ghost"
              className="flex-1 rounded-none border-b-2 border-blue-500"
            >
              Recent Smats
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-none text-gray-500 dark:text-gray-400"
            >
              Replies
            </Button>
          </nav>
          <div>
            <ProfileSmats userId={user.id} />
          </div>
        </main>
      </div>
    </>
  );
};

export default ProfilePage;
