import { z } from "zod";
import { isObjectId } from "../../utils/object-id-regex";

export const PostSchema = z.object({
  id: z
    .string()
    .refine((id) => isObjectId(id), { message: "Invalid ObjectId" }),
  content: z.string().min(1),
  authorId: z
    .string()
    .refine((id) => isObjectId(id), { message: "Invalid ObjectId" })
    .optional(),
  createdAt: z.date(),
});

export type PostDto = z.infer<typeof PostSchema>;

export const NewPostDtoSchema = PostSchema.omit({
  id: true,
  authorId: true,
  createdAt: true,
});
export type NewPostDto = z.infer<typeof NewPostDtoSchema>;
