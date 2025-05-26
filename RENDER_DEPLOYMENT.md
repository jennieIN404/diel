# Deploying Dialectica to Render

This guide will help you deploy your Dialectica application to Render.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. Your MongoDB Atlas database (already set up)
3. GitHub repository with your Dialectica code

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Ensure your repository has the necessary files**:
   - `package.json` with a valid `start` script
   - `.env.production` with your environment variables
   - `Procfile` (optional, but helpful for Render)

2. **Create or update your Procfile**:
   - Create a file named `Procfile` in your project root
   - Add the following content:
     ```
     web: node server.js
     ```

3. **Push your changes to GitHub**:
   ```
   git add .
   git commit -m "Prepare for Render deployment"
   git push
   ```

### Step 2: Deploy to Render

1. **Sign up/Login to Render**:
   - Go to [render.com](https://render.com) and create an account or log in

2. **Create a new Web Service**:
   - Click "New" and select "Web Service"
   - Connect to your GitHub repository
   - Select the repository with your Dialectica code

3. **Configure your Web Service**:
   - **Name**: Choose a name for your service (e.g., "dialectica")
   - **Environment**: Select "Node"
   - **Region**: Choose a region close to your users
   - **Branch**: Select your main branch (e.g., "main" or "master")
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Select "Free"

4. **Add environment variables**:
   - Scroll down to the "Environment" section
   - Add the following environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret key
     - `NODE_ENV`: Set to "production"
     - `PORT`: Render will set this automatically, but you can add it if needed

5. **Deploy**:
   - Click "Create Web Service"
   - Render will automatically build and deploy your application
   - You can view the deployment logs in the "Logs" tab

### Step 3: Configure Your Application for Render

1. **Get your Render domain**:
   - After deployment, Render will assign a domain to your application
   - It will look something like: `https://dialectica.onrender.com`

2. **Update your config.js file**:
   - Update the `apiBaseUrl` and `socketUrl` in `public/js/config.js` to your Render domain
   - You can use the provided `update-render-url.js` script to do this automatically

3. **Update Content Security Policy**:
   - Update the CSP headers in your HTML files to include your Render domain
   - The script will also update these for you

4. **Redeploy your application**:
   - Push your changes to GitHub
   - Render will automatically redeploy your application

## Troubleshooting

1. **Socket.io Connection Issues**:
   - Ensure your Socket.io configuration is set up for production
   - Check that your CSP headers allow connections to your Render domain
   - Verify that your Socket.io client is configured to use both WebSocket and polling transports

2. **MongoDB Connection Issues**:
   - Ensure your MongoDB Atlas cluster is accessible from anywhere (Network Access settings)
   - Verify your connection string is correct in the environment variables

3. **Deployment Fails**:
   - Check the deployment logs in the Render dashboard
   - Ensure your package.json has a valid start script
   - Verify that all dependencies are listed in package.json

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

## Need Help?

If you encounter any issues during deployment, check the Render documentation or reach out to Render support.
