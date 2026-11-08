import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "out/**", "coverage/**", "next-env.d.ts"] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // App Router only: there is no pages/ directory for this rule to check.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default config;
