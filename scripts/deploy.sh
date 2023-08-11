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
find "$out_dir" -name "*.zip" -exec sh -c '
    zip_file="{}"
    parent_folder=$(dirname "$zip_file")
    function_name="$(basename "$parent_folder")"_"$(basename "${zip_file%.zip}")"

    if aws lambda get-function --function-name "$function_name" > /dev/null 2>&1; then
        echo "Updating existing function: $function_name"
        aws lambda update-function-code --function-name "$function_name" --zip-file "fileb://$zip_file"
    else
        echo "Creating new function: $function_name"
        # Replace <YOUR_ROLE_ARN> with your actual role ARN
        aws lambda create-function --function-name "$function_name" \
        --runtime nodejs18.x \
        --role arn:aws:iam::706108767612:role/github-actions \
        --handler "$(basename "${zip_file%.zip}")".handler \
        --zip-file "fileb://$zip_file"
    fi
' \;

# If any errors occurred above, the script would have already exited due to set -e
# If we reach this point, the script has executed successfully
echo "Script executed successfully."