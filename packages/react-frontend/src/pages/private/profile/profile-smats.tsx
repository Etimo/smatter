import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Endpoints, useSmatterQuery } from "../../../api/api";
import { SkeletonSmat, Smat } from "../../../components/smat";

type Props = {
  userId: string;
};

export const ProfileSmats = (props: Props) => {
  const query = useSmatterQuery(Endpoints.posts.get());
  const [parent] = useAutoAnimate();

  if (query.error) {
    return <p>Error: {query.error.message}</p>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <ol className="space-y-4" ref={query.data ? parent : null}>
            {query.isPending ? (
              <>
                <SkeletonSmat />
                <SkeletonSmat />
                <SkeletonSmat />
              </>
            ) : (
              <>
                {query.data.map((x) => (
                  <li key={x.id}>
                    <Smat post={x} />
                  </li>
                ))}
              </>
            )}
          </ol>
        </div>
      </div>
    </div>
  );
};
