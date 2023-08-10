#!/bin/bash

# Define the output directory
out_dir="dist/"

# Go to the out_dir and deploy each .zip file to AWS Lambda
find "$out_dir" -name "*.zip" -exec sh -c '
    zip_file="{}"
    function_name=$(basename "${zip_file%.zip}")

    if aws lambda get-function --function-name "$function_name" > /dev/null 2>&1; then
        echo "Updating existing function: $function_name"
        aws lambda update-function-code --function-name "$function_name" --zip-file "fileb://$zip_file"
    else
        echo "Creating new function: $function_name"
        # Replace <YOUR_ROLE_ARN> with your actual role ARN
        aws lambda create-function --function-name "$function_name" --runtime nodejs18.x --role arn:aws:iam::706108767612:role/github-actions --handler index.handler --zip-file "fileb://$zip_file"
    fi
' \;