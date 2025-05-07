import { z } from "zod";
import { isObjectId } from "../utils/object-id-regex";

export const followerSchema = z.object({
  id: z
    .string()
    .refine((id) => isObjectId(id), { message: "Invalid ObjectId" }),
  followingId: z
    .string()
    .refine((id) => isObjectId(id), { message: "Invalid ObjectId" }),
 owningUserId : z
    .string()
    .optional()
    .refine((id) => !id || isObjectId(id), { message: "Invalid ObjectId" }),
});

export const NewFollowingDto = followerSchema.omit({ id: true});
export type NewFollowingDto = z.infer<typeof NewFollowingDto>;
export type FollowingDto = z.infer<typeof followerSchema>;
