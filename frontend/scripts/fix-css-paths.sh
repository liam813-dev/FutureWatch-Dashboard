#!/bin/bash

# This script helps to migrate component CSS files to the standard location
# and update import statements

# Create components directory if it doesn't exist
mkdir -p frontend/styles/components

# Move component CSS files from components directory to styles/components
find frontend/components -name "*.module.css" | while read file; do
  filename=$(basename "$file")
  
  # Skip files that are already properly migrated
  if [ -f "frontend/styles/components/$filename" ]; then
    echo "Skipping already migrated file: $filename"
    continue
  fi
  
  echo "Moving $file to frontend/styles/components/$filename"
  cp "$file" "frontend/styles/components/$filename"
  
  # Find components that import this CSS file and update their imports
  component_name="${filename%.module.css}.tsx"
  if [ -f "frontend/components/$component_name" ]; then
    echo "Updating import in frontend/components/$component_name"
    sed -i '' 's|import styles from '\''\.\/'"$filename"''\''|import styles from '\''@/styles/components/'"$filename"''\''|g' "frontend/components/$component_name"
    sed -i '' 's|import styles from '\''\.\.\/styles\/'"$filename"''\''|import styles from '\''@/styles/components/'"$filename"''\''|g' "frontend/components/$component_name"
  fi
done

echo "CSS file migration complete. Please check your files for any missed imports."
echo "Remember to manually delete the original CSS files after verifying everything works." 