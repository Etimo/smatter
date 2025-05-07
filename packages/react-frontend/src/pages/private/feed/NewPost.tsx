import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Endpoints } from "../../../api/api";
import { toast } from "../../../components/ui/use-toast";

const formSchema = z.object({
  content: z.string().min(1),
});

export const PostForm = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: Endpoints.posts.create().request,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: Endpoints.posts.get().key,
      });
      toast({
        description: "Post created",
        title: "Success",
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
    },
  });

  const onSubmit = form.handleSubmit(async (data) => mutation.mutate(data));

  return (
    <div className="flex items-start space-x-4 bg-white rounded-md p-6 my-6 shadow-md">
      <div className="flex-shrink-0">
        <img
          className="inline-block h-10 w-10 rounded-full"
          src="https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
          alt=""
        />
      </div>
      <div className="min-w-0 flex-1">
        <form onSubmit={onSubmit} className="relative">
          <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-gray-600">
            <label htmlFor="comment" className="sr-only">
              Make a post...
            </label>
            <textarea
              rows={3}
              id="comment"
              className="block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
              placeholder="Make a post..."
              defaultValue={""}
              {...form.register("content")}
            />{" "}
            {/* Spacer element to match the height of the toolbar */}
            <div className="py-2" aria-hidden="true">
              {/* Matches height of button in toolbar (1px border + 36px content height) */}
              <div className="py-px">
                <div className="h-9" />
              </div>
            </div>
          </div>
          {form.formState.errors.content && (
            <p>{form.formState.errors.content.message}</p>
          )}

          <div className="absolute inset-x-0 bottom-0 flex justify-end py-2 pl-3 pr-2">
            <div className="flex-shrink-0">
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
              >
                Post
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
