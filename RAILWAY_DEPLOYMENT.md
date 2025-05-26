# Deploying Dialectica to Railway

This guide will help you deploy your Dialectica application to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. Railway CLI installed (optional but recommended)
3. Your MongoDB Atlas database (already set up)
4. GitHub repository with your Dialectica code

## Deployment Steps

### Option 1: Deploy via Railway Dashboard

1. **Sign up/Login to Railway**:
   - Go to [railway.app](https://railway.app) and create an account or log in
   - You can sign up with GitHub for easier integration

2. **Create a new project**:
   - Click "New Project" in the Railway dashboard
   - Select "Deploy from GitHub repo"
   - Connect to GitHub and select your Dialectica repository
   - If you haven't pushed to GitHub, do that first:
     ```
     git add .
     git commit -m "Prepare for Railway deployment"
     git push
     ```

3. **Configure project settings**:
   - Railway will automatically detect that your project is a Node.js application
   - No additional configuration is needed for basic deployment
   - Railway will use the `start` script in your package.json

4. **Add environment variables**:
   - Click on your project, then go to the "Variables" tab
   - Add the following environment variables:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret key
     - `NODE_ENV`: Set to "production"
     - `PORT`: Railway will set this automatically, but you can add it if needed

5. **Deploy**:
   - Railway will automatically deploy your application
   - You can view the deployment logs in the "Deployments" tab

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**:
   ```
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```
   railway login
   ```

3. **Initialize Railway in your project**:
   - Navigate to your project directory
   - Run:
     ```
     railway init
     ```
   - Follow the prompts to link to an existing project or create a new one

4. **Add environment variables**:
   ```
   railway variables set MONGODB_URI=your_mongodb_connection_string
   railway variables set JWT_SECRET=your_jwt_secret
   railway variables set NODE_ENV=production
   ```

5. **Deploy**:
   ```
   railway up
   ```

## Post-Deployment Steps

1. **Get your Railway domain**:
   - Railway will automatically assign a domain to your application
   - You can find this in the "Settings" tab of your project
   - It will look something like: `https://dialectica-production.up.railway.app`

2. **Update your config.js file**:
   - Update the `apiBaseUrl` and `socketUrl` in `public/js/config.js` to your Railway domain
   - Redeploy after making these changes

3. **Update Content Security Policy**:
   - Update the CSP headers in your HTML files to include your Railway domain
   - You can use the provided `update-urls.js` script to do this automatically

4. **Test your application**:
   - Visit your Railway domain
   - Test all functionality, especially real-time features
   - Check that Socket.io connections are working

5. **Set up a custom domain (optional)**:
   - In the Railway dashboard, go to your project
   - Click "Settings" and scroll to "Domains"
   - Follow the instructions to add your custom domain

## Advantages of Railway

- **Simplified Deployment**: Railway automatically detects your Node.js application and deploys it without complex configuration
- **Built-in CI/CD**: Automatic deployments when you push to your GitHub repository
- **Free Tier**: Railway offers a free tier with 500 hours of runtime per month
- **Monitoring**: Built-in logs and metrics for your application
- **Scaling**: Easy scaling options as your application grows

## Troubleshooting

1. **Deployment Fails**:
   - Check the deployment logs in the Railway dashboard
   - Ensure your package.json has a valid start script
   - Verify that all dependencies are listed in package.json

2. **MongoDB Connection Issues**:
   - Ensure your MongoDB Atlas cluster is accessible from anywhere (Network Access settings)
   - Verify your connection string is correct in the environment variables

3. **Socket.io Connection Issues**:
   - Check that your Socket.io configuration is set up for production
   - Ensure your CSP headers allow connections to your Railway domain

## Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

## Need Help?

If you encounter any issues during deployment, check the Railway documentation or reach out to Railway support.
