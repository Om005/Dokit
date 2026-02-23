# Build Node image
docker build -t dokit-node:latest ./node/
# Build Express image
docker build -t dokit-express:latest ./express/
# Build React+Vite image
docker build -t dokit-react_vite:latest ./react_vite/
# Build Nginx image
docker build -t dokit-nginx:latest ./nginx/
# Verify they exist
docker images | grep dokit-