# Deploying Dialectica to Vercel

This guide will help you deploy your Dialectica application to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional but recommended)
3. Your MongoDB Atlas database

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Sign up/Login to Vercel**:
   - Go to [vercel.com](https://vercel.com) and create an account or log in

2. **Import your GitHub repository**:
   - Click "Add New..." → "Project"
   - Connect to GitHub and select your Dialectica repository
   - If you haven't pushed to GitHub, do that first:
     ```
     git add .
     git commit -m "Prepare for Vercel deployment"
     git push
     ```

3. **Configure project settings**:
   - Framework Preset: Select "Other"
   - Root Directory: Leave as default (if your code is in the root)
   - Build Command: Leave empty (we've added a vercel-build script)
   - Output Directory: Leave empty
   - Install Command: `npm install`

4. **Add environment variables**:
   - Click "Environment Variables" and add the following:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret key
     - `NODE_ENV`: Set to "production"

5. **Deploy**:
   - Click "Deploy"
   - Wait for the deployment to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```
   vercel login
   ```

3. **Deploy**:
   - Navigate to your project directory
   - Run:
     ```
     vercel
     ```
   - Follow the prompts to configure your project
   - When asked about environment variables, add:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: Your JWT secret key
     - `NODE_ENV`: Set to "production"

## Post-Deployment Steps

1. **Update your config.js file**:
   - Once deployed, Vercel will give you a deployment URL
   - Update the `apiBaseUrl` and `socketUrl` in `public/js/config.js` to your Vercel URL
   - Redeploy after making these changes

2. **Test your application**:
   - Visit your Vercel deployment URL
   - Test all functionality, especially real-time features
   - Check that Socket.io connections are working

3. **Set up a custom domain (optional)**:
   - In the Vercel dashboard, go to your project
   - Click "Domains" and follow the instructions to add your domain

## Troubleshooting

1. **Socket.io Connection Issues**:
   - If you experience Socket.io connection problems, check the browser console for errors
   - Verify that your Socket.io client is configured to use both WebSocket and polling transports
   - Make sure your CORS settings allow connections from your client domain

2. **MongoDB Connection Issues**:
   - Ensure your MongoDB Atlas cluster is accessible from anywhere (Network Access settings)
   - Verify your connection string is correct in the environment variables

3. **Deployment Fails**:
   - Check the Vercel build logs for errors
   - Make sure all dependencies are listed in package.json
   - Verify that your server.js file is properly configured

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

## Need Help?

If you encounter any issues during deployment, check the Vercel documentation or reach out to Vercel support.
