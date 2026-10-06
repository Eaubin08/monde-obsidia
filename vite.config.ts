import react from '@vitejs/plugin-react'
import {defineConfig} from 'vite'
// @ts-expect-error bridge local JavaScript
import {localBridge} from './server/local-bridge.mjs'
export default defineConfig({plugins:[react(),localBridge()],server:{host:'127.0.0.1',port:5180,strictPort:true}})
