#!/bin/bash

# Define the output directory
out_dir="dist"

# Function to exit with an error message
exit_with_error() {
    echo "$1" >&2
    exit 1
}

# Go to the out_dir and zip each .js file into its own zip file
find "$out_dir" -name "*.js" -exec sh -c '
    js_file="{}"
    base_name="${js_file%.js}"
    zip_file="$base_name.zip"

    map_file="${base_name}.js.map"
    if [ -f "$map_file" ]; then
        if ! zip -j "$zip_file" "$js_file" "$map_file"; then
            exit_with_error "Error zipping $js_file and $map_file"
        fi
    else
        if ! zip -j "$zip_file" "$js_file"; then
            exit_with_error "Error zipping $js_file"
        fi
    fi
' \;