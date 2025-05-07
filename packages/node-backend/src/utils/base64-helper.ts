export const toBase64 = (text: string, trim: boolean = true): string => {
  // Remove trailing = characters
  const s = Buffer.from(text).toString("base64");
  if (trim) return s.replace(/=+$/g, "");
  return s;
};

export const fromBase64 = (text: string): string => {
  // Add trailing = characters
  if (text.length % 4 > 0) {
    const missingPadding = 4 - (text.length % 4);
    text += "=".repeat(missingPadding);
  }

  return Buffer.from(text, "base64").toString();
};
