# Neo Future Dashboard

## Deployment on Render

This project is configured for deployment on [Render](https://render.com) using the `render.yaml` Blueprint.

### Deployment Steps:

1. Fork or clone this repository to your own GitHub account.
2. Create a new Render account or sign in to your existing account.
3. Click on "New" and select "Blueprint" from the dropdown menu.
4. Connect your GitHub account and select your repository.
5. Render will automatically detect the `render.yaml` file and display the services.
6. Configure any additional environment variables required by your application.
7. Click "Apply" to start the deployment process.

### Environment Variables:

Make sure to set the following environment variables in the Render dashboard:

- For backend service:
  - Any API keys or credentials needed by your application
- For frontend service:
  - The NEXT_PUBLIC_API_URL variable is automatically set to the backend URL

### Monitoring and Logs:

After deployment, you can monitor your services and view logs directly from the Render dashboard.

### Local Development:

To run the project locally:

1. Backend:

   ```
   cd backend
   pip install -r requirements.txt
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

2. Frontend:
   ```
   cd frontend
   npm install
   npm run dev
   ```
