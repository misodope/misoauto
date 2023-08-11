#!/bin/bash

# Define the output directory
out_dir="dist"

# Function to exit with an error message
exit_with_error() {
    echo "$1" >&2
    exit 1
}

# Go to the out_dir and zip each .mjs file into its own zip file
find "$out_dir" -name "*.mjs" -exec sh -c '
    mjs_file="{}"
    echo "mjs_file: $mjs_file"

    base_name="${mjs_file%.mjs}"
    echo "base_name: $base_name"

    dir_path="$(dirname "$mjs_file")"
    echo "dir_path: $dir_path"

    new_mjs_file="$dir_path/index.mjs"
    echo "new_mjs_file: $new_mjs_file"

    zip_file="$base_name.zip"
    map_file="${base_name}.mjs.map"
    
    echo "zip_file: $zip_file"
    echo "map_file: $map_file"

    mv "$mjs_file" "$new_mjs_file"

    if [ -f "$map_file" ]; then
        if ! zip -j "$zip_file" "$new_mjs_file" "$map_file"; then
            exit_with_error "Error zipping $new_mjs_file and $map_file"
        fi
    else
        if ! zip -j "$zip_file" "$new_mjs_file"; then
            exit_with_error "Error zipping $new_mjs_file"
        fi
    fi
' \;

# If we reach this point, the script has executed successfully
echo "Script executed successfully."