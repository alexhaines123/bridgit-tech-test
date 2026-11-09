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

      // Ban z.any() - use discriminated unions or specific schemas instead (ADR 0003)
      "no-restricted-properties": [
        "error",
        {
          object: "z",
          property: "any",
          message: "Avoid z.any(). Use a discriminated union or specific schema. See ADR 0003.",
        },
      ],

      // Ban <Box sx={{ display: "flex" }}> - use <Stack> instead
      "no-restricted-syntax": [
        "error",
        {
          selector: 'JSXElement[openingElement.name.name="Box"][openingElement.attributes.0.name.name="sx"] JSXAttribute[name.name="sx"] > JSXExpressionContainer > ObjectExpression > Property[key.name="display"][value.value="flex"]',
          message: 'Use <Stack> instead of <Box sx={{ display: "flex" }}>. See DESIGN.md MUI component patterns.',
        },
      ],
    },
  },
];

export default config;
