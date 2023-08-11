#!/bin/bash

# Exit the script immediately if any command returns a non-zero status
set -e

# Define the output directory
out_dir="dist"

# Function to perform cleanup on script exit
cleanup() {
    echo "Script exited, performing cleanup..."
    # Add cleanup actions here if needed
}

# Set up trap to call cleanup function on script exit
trap cleanup EXIT

# Go to the out_dir and deploy each .zip file to AWS Lambda
find "$out_dir" -name "*.js" -exec sh -c '
    js_file="{}"
    base_name="${js_file%.js}"
    renamed_js_file="$base_name/index.js"
    zip_file="$base_name.zip"

    map_file="${base_name}.js.map"
    renamed_map_file="$base_name/index.js.map"

    mv "$js_file" "$renamed_js_file"
    if [ -f "$map_file" ]; then
        mv "$map_file" "$renamed_map_file"
        if ! zip -j "$zip_file" "$renamed_js_file" "$renamed_map_file"; then
            exit_with_error "Error zipping $renamed_js_file and $renamed_map_file"
        fi
    else
        if ! zip -j "$zip_file" "$renamed_js_file"; then
            exit_with_error "Error zipping $renamed_js_file"
        fi
    fi
' \;

# If any errors occurred above, the script would have already exited due to set -e
# If we reach this point, the script has executed successfully
echo "Script executed successfully."