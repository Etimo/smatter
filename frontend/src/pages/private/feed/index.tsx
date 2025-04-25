import { useAutoAnimate } from "@formkit/auto-animate/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import z from "zod";
import { Endpoints, useSmatterQuery } from "../../../api/api";
import { SkeletonSmat, Smat } from "../../../components/smat";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../components/ui/avatar";
import { Button } from "../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../../../components/ui/form";
import {
  GiftIcon,
  ImageIcon,
  SmileIcon,
  VoteIcon,
} from "../../../components/ui/icons";
import { Textarea } from "../../../components/ui/textarea";
import { toast } from "../../../components/ui/use-toast";

const FeedPage = () => {
  const query = useSmatterQuery(Endpoints.feed.get());
  const [parent] = useAutoAnimate();

  if (query.error) {
    return <p>Error: {query.error.message}</p>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <MakeSmat />
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

export default FeedPage;

const formSchema = z.object({
  content: z.string().min(2).max(200),
});

const MakeSmat = () => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const mutation = useMutation({
    mutationFn: Endpoints.posts.create().request,
    onSuccess: () => {
      form.reset();
      void queryClient.invalidateQueries({
        queryKey: Endpoints.posts.get().key,
      });
      toast({
        description: "You just shared your thoughts with the world 😻",
        title: "Success!",
      });
    },
  });

  const onSubmit = form.handleSubmit(async (data) => mutation.mutate(data));

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={onSubmit}
          className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4"
        >
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10 rounded-full">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>AC</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="What smatters to you?"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" size="sm">
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <GiftIcon className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <VoteIcon className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <SmileIcon className="w-5 h-5" />
                </Button>
                <Button size="sm">Smat</Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </>
  );
};
