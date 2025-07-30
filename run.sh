cd /Users/zijja/Documents/Plantation/PlantProBackend && npm run start:dev &
echo "Backend is starting at http://localhost:3000"
echo "Backend API will be available at http://localhost:3000/api"
sleep 5
cd /Users/zijja/Documents/Plantation/PlantProFrontend && npm run dev -- --port 3001 &
echo "Frontend is starting at http://localhost:3001"
echo "To stop both servers, use Ctrl+C or kill the processes"
wait
