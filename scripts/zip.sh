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
    echo "js_file: $js_file"

    base_name="${js_file%.js}"
    echo "base_name: $base_name"

    dir_path="$(dirname "$js_file")"
    echo "dir_path: $dir_path"

    new_js_file="$dir_path/index.js"
    echo "new_js_file: $new_js_file"

    zip_file="$base_name.zip"
    map_file="${base_name}.js.map"
    
    echo "zip_file: $zip_file"
    echo "map_file: $map_file"

    mv "$js_file" "$new_js_file"

    if [ -f "$map_file" ]; then
        if ! zip -j "$zip_file" "$new_js_file" "$map_file"; then
            exit_with_error "Error zipping $new_js_file and $map_file"
        fi
    else
        if ! zip -j "$zip_file" "$new_js_file"; then
            exit_with_error "Error zipping $new_js_file"
        fi
    fi
' \;

# If we reach this point, the script has executed successfully
echo "Script executed successfully."