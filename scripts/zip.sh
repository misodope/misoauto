#!/bin/bash

# Define the output directory
out_dir="dist/"

# Go to the out_dir and zip each .js file into its own zip file
find "$out_dir" -name "*.js" -exec sh -c '
    file="{}"
    zip "${file%.js}.zip" "$file"
' \;