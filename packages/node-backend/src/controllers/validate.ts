import { ZodSchema, z } from "zod";
import { isObjectId } from "../utils/object-id-regex";

type Error = {
  message: string;
};

export const validateRequest = <T>(
  body: any,
  schema: ZodSchema<T>
): { success: boolean } & (
  | { success: false; errors: Error[] }
  | { success: true; result: T }
) => {
  const errors: Error[] = [];

  const parseResult = schema.safeParse(body);
  if (parseResult.success) {
    return { success: true, result: parseResult.data };
  }

  parseResult.error.errors.forEach((error) => {
    errors.push({ message: error.message });
  });

  return { success: false, errors };
};

export const validateId = (id: string): boolean => {
  if (!z.string().safeParse(id).success) {
    return false;
  }

  return isObjectId(id);
};
