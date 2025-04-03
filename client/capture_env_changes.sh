#!/bin/bash

# Capture the original environment variables
original_env=$(printenv)

# Execute the provided command and suppress its output (both stdout and stderr)
"$@" > /dev/null 2>&1

# Capture the new environment variables after execution
new_env=$(printenv)

# Initialize an empty JSON object
json_output="{"

# Function to add key-value pairs to the JSON object
add_to_json() {
  local key=$1
  local value=$2
  json_output+="\"$key\": \"$value\","
}

# Compare the original environment with the new environment
while IFS='=' read -r var value; do
  # Check if the variable exists in the new environment
  new_value=$(printenv "$var")
  
  # If the variable has changed, add to JSON
  if [ "$value" != "$new_value" ]; then
    add_to_json "$var" "$new_value"
  fi
done <<< "$original_env"

# Check for newly defined environment variables (those that exist in the new environment but not in the original)
while IFS='=' read -r var value; do
  # Only add new variables that did not exist in the original environment
  if ! echo "$original_env" | grep -q "^$var="; then
    add_to_json "$var" "$value"
  fi
done <<< "$new_env"

# Remove the trailing comma if there are any changes or new variables
if [ "$json_output" != "{" ]; then
  json_output="${json_output%,}"
fi

# Close the JSON object
json_output+="}"

# Print the JSON output
echo "$json_output"
