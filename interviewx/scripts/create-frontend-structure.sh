// Create directory structure script
// scripts/create-frontend-structure.sh
#!/bin/bash

# Create frontend directory structure
mkdir -p frontend/src/{components/{ui,layout,interview,evaluation},pages,store,services,hooks,utils}
mkdir -p frontend/public

# Create component directories
mkdir -p frontend/src/components/ui
mkdir -p frontend/src/components/layout
mkdir -p frontend/src/components/interview
mkdir -p frontend/src/components/evaluation

echo "Frontend directory structure created successfully!"
echo "Next steps:"
echo "1. cd frontend"
echo "2. npm install"
echo "3. npm run dev"