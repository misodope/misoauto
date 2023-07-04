#!/bin/bash

# Define the directory where the .ts files are
src_dir="api/"
# Define the output directory
out_dir="dist/"

# Use find to get all .ts files in the directory and its subdirectories
# For each file, use esbuild to transpile it to a .js file in the same relative location under the dist/ directory
find "$src_dir" -name "*.ts" -exec sh -c '
    file="{}"
    dst="${out_dir}${file#${src_dir}}"
    dst_dir=$(dirname "$dst")
    mkdir -p "$dst_dir"
    esbuild "$file" --outfile="dist/${file%.ts}.js"
' \;