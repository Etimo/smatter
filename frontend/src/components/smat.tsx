import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import {
  HeartIcon,
  MessageCircleIcon,
  RepeatIcon,
  UploadIcon,
} from "../components/ui/icons";
import { formatElapsedTime } from "../utils/time-formatter";

type SmatProps = {
  post: {
    content: string;
    user: {
      username: string;
      displayName: string;
    };
    createdAt: string;
  };
};

export const Smat = (props: SmatProps) => {
  const elapsedTime = formatElapsedTime(props.post.createdAt);
  return (
    <Card className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-start gap-4">
        <Avatar className="w-10 h-10 rounded-full">
          <AvatarImage src="/placeholder-user.jpg" />
          <AvatarFallback>
            {props.post.user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold">{props.post.user.displayName}</span>
            <span className="text-gray-500 dark:text-gray-400">
              @{props.post.user.username}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              · {elapsedTime}
            </span>
          </div>
          <p className="mt-2">{props.post.content}</p>
          <div className="flex items-center gap-4 mt-2">
            <Button variant="ghost" size="icon">
              <MessageCircleIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <RepeatIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <HeartIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <UploadIcon className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const SkeletonSmat = () => {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-900 rounded-full"></div>
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-gray-300 dark:bg-gray-900 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 dark:bg-gray-900 rounded"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-900 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
