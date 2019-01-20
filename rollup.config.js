import typescript from 'rollup-plugin-typescript2';
import json from 'rollup-plugin-json';

export default [{
  input: 'src/index.ts',
  output: [
    {
      file: 'meduza.js',
      format: 'cjs',
    },
  ],
  watch: {
    include: 'src/**',
  },
  plugins: [
    json({ preferConst: true }),
    typescript({ useTsconfigDeclarationDir: true }),
  ],
  external: ['getopts', 'chalk'],
}];
