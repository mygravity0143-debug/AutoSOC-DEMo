# AutoSOC Render Deployment

This project is already configured to deploy as a single service on Render.

## Run locally

```bash
cd frontend
npm install
npm run build

cd ../backend
npm install
npm run build
npm run start
```

Then open:

- Frontend: http://localhost:5000
- API health: http://localhost:5000/api/health

## Render deployment

1. Push this repository to GitHub.
2. In Render, choose New -> Web Service.
3. Connect the repo.
4. Render will use the included render.yaml.
5. Deploy the service.

## Important notes

- The backend listens on the Render-provided `PORT` environment variable.
- The backend serves the built frontend from `../frontend/dist`.
- WebSocket traffic is served from the same app instance at `/ws`.
- The app is meant for demo and educational use, not a live production vehicle control environment.
