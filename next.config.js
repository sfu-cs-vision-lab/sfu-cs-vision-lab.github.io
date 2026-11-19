/** @type {import('next').NextConfig} */
const base = process.env.NEXT_BASE_PATH || "";
module.exports = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  basePath: base || undefined,
};
