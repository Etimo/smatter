import type {Config} from 'jest';

export default async (): Promise<Config> => {
  return {
    preset: "ts-jest",
    verbose: true,
    transformIgnorePatterns: [
        "/node_modules/",
        "\\.pnp\\.[^\\/]+$"
    ]
  };
};
