import tsParser from "@typescript-eslint/parser";
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
        parser: tsParser,
    },
    rules: {
        "no-console": "warn",

        "max-len": ["error", {
            code: 120,
        }],

        "@typescript-eslint/quotes": 0,
        "object-curly-newline": 0,
        "react/prop-types": 0,
        "linebreak-style": 0,
        "no-param-reassign": 0,
        "react/react-in-jsx-scope": "off",
        "jsx-a11y/control-has-associated-label": 0,
        "react/jsx-props-no-spreading": "off",
        "react/function-component-definition": 0,
        "import/prefer-default-export": "off",
        "@typescript-eslint/ban-ts-comment": "warn",
    },
});
