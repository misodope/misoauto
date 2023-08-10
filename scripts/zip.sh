#!/bin/bash

# Define the output directory
out_dir="dist"

# Go to the out_dir and zip each .js file into its own zip file
find "$out_dir" -name "*.js" -exec sh -c '
    file="{}"
    base_name="${js_file%.js}"
    zip_file="$base_name.zip"

    map_file="${base_name}.js.map"
    if [ -f "$map_file" ]; then
        zip -r "$zip_file" "$js_file" "$map_file"
    else
        zip -r "$zip_file" "$js_file"
    fi
' \;