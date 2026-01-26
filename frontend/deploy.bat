@echo off
echo 🚀 Starting SmartSpend Deployment to Vercel...

REM Check if we're in the right directory
if not exist package.json (
    echo ❌ Error: Please run this script from the frontend directory
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
)

REM Build the project
echo 🔨 Building project...
npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed! Please fix errors and try again.
    pause
    exit /b 1
)

echo ✅ Build successful!

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 📥 Installing Vercel CLI...
    npm install -g vercel
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

echo 🎉 Deployment complete!
echo 📱 Your app should be live at the URL shown above
echo 🔧 Don't forget to:
echo    1. Set environment variables in Vercel dashboard
echo    2. Update backend CORS settings
echo    3. Test all functionality

pause