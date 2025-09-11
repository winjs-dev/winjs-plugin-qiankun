import { defineConfig } from 'win';

export default defineConfig({
  plugins: ['../src'],
  qiankun: {
    child: {}
  }
});
