import commonjs from '@rollup/plugin-commonjs';
import minify from 'rollup-plugin-minify-es';

const version = '1.2.0-rc1';

export default {
  input: './src/archly.js',
  output: [
    {
      file: 'dist/archly.common.min.js',
      format: 'cjs',
      exports: 'named',
    },
    {
      file: 'dist/archly.esm.min.js',
      format: 'esm',
      exports: 'named',
    },
    {
      file: 'dist/archly.browser.min.js',
      name: 'Archly',
      format: 'iife',
      exports: 'named',
    },
  ],
  plugins: [
    commonjs(),
    minify({
      output: {
        preamble: '/* Archly v' + version + ' */',
      },
    }),
  ],
};
