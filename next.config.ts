import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? "/grootz-financial" : "",
};

export default nextConfig;
