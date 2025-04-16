#!/bin/bash
set -e

echo "Environment debug info:"
node --version
npm --version
pwd
ls -la

echo "Installing dependencies..."
npm ci

echo "Installing TypeScript dependencies as regular dependencies..."
npm install typescript@4.9.5 @types/react@18.0.28 @types/node@18.15.0

echo "Checking if dependencies were installed:"
ls -la node_modules/typescript
ls -la node_modules/@types/react
ls -la node_modules/@types/node

echo "Building the application with type checking disabled..."
NODE_OPTIONS="--max-old-space-size=1024" NEXT_TYPECHECK=false TSC_COMPILE_ON_ERROR=true DISABLE_TYPE_CHECK=true npm run build

echo "Build completed successfully" 