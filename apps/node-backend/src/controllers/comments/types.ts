import { z } from "zod";
import { isObjectId } from "../../utils/object-id-regex";

export const CommentSchema = z.object({
  id: z
    .string()
    .refine((id) => isObjectId(id), { message: "Invalid ObjectId" }),
  content: z.string(),
  authorId: z
    .string()
    .refine((id) => isObjectId(id), { message: "Invalid ObjectId" }),
  postId: z
    .string()
    .refine((id) => isObjectId(id), { message: "Invalid ObjectId" }),
});

export type CommentDto = z.infer<typeof CommentSchema>;
export const NewCommentDto = CommentSchema.omit({ id: true });
export type NewCommentDto = z.infer<typeof NewCommentDto>;
