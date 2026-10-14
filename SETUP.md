# Motion Studio Pro - Setup Guide

## Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- Kling AI API credentials (Access Key & Secret Key)

## Getting Your Kling API Credentials

1. Visit [Kling AI Platform](https://klingai.com/)
2. Sign up or log in to your account
3. Navigate to API settings or developer console
4. Generate or copy your Access Key and Secret Key

## Installation Steps

### 1. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure API Credentials

The `.env` file has already been created with your API credentials. If you need to update them:

1. Open the `.env` file in the project root
2. Update the credentials:

```env
VITE_KLING_ACCESS_KEY=your_access_key_here
VITE_KLING_SECRET_KEY=your_secret_key_here
VITE_KLING_API_BASE_URL=https://api.klingai.com
```

**Important:** Never commit the `.env` file to version control. It's already included in `.gitignore`.

### 3. Start Development Server

```bash
npm run dev
```

The application will open at `http://localhost:5173` (or another port if 5173 is busy).

## How to Use Motion Studio Pro

### 1. Upload Files

- **Step 1:** Upload a reference image (Subject)
  - Formats: PNG, JPG, JPEG
  - Max size: 10MB
  - This is the image whose appearance will be animated

- **Step 2:** Upload a motion reference video (Driver Video)
  - Formats: MP4, MOV, WebM
  - Max size: 50MB
  - The motion from this video will be applied to your reference image

### 2. Configure Settings

In the Settings panel on the right, adjust:

- **Motion Strength** (0-100%): Higher values create more dramatic motion transfer
- **Match Mode:**
  - *Match Image Structure*: Keeps the subject's original framing and composition
  - *Match Video Motion*: Warps subject to match video camera movement
- **Duration:** Choose between 5 or 10 seconds
- **Negative Prompt** (optional): Describe what you don't want to see in the result

### 3. Generate

Click the "Generate Motion Transfer" button. The process includes:

1. **Uploading files** to Kling AI servers
2. **Processing** the motion transfer (this may take 2-5 minutes)
3. **Real-time progress updates** shown in the Results tab

### 4. View & Download Results

Once complete:
- Switch to the **Results** tab to view your generated video
- Click **Download** to save the video to your device
- Use **Upscale** for higher resolution (if available)

## Project Structure

```
motion-studio-pro-main/
├── src/
│   ├── components/
│   │   └── studio/
│   │       ├── GenerateButton.tsx    # Generation trigger button
│   │       ├── SettingsPanel.tsx     # Settings & results panel
│   │       ├── Sidebar.tsx           # App sidebar navigation
│   │       ├── UploadCard.tsx        # File upload component
│   │       └── Workspace.tsx         # Main workspace area
│   ├── pages/
│   │   └── Index.tsx                 # Main application page
│   ├── services/
│   │   └── kling.ts                  # Kling AI API service
│   ├── types/
│   │   └── kling.ts                  # TypeScript type definitions
│   └── ...
├── .env                              # API credentials (DO NOT COMMIT)
├── .env.example                      # Example environment file
└── package.json
```

## API Features

The Kling API integration supports:

- ✅ File upload (images and videos)
- ✅ Motion transfer task creation
- ✅ Real-time task status polling
- ✅ Progress tracking
- ✅ Error handling and retry logic
- ✅ Configurable generation parameters

## Troubleshooting

### "API key not configured" error

- Check that your `.env` file exists in the project root
- Verify that `VITE_KLING_ACCESS_KEY` and `VITE_KLING_SECRET_KEY` are set
- Restart the development server after changing `.env` values

### Upload fails

- Verify file sizes: Images < 10MB, Videos < 50MB
- Check file formats: Images (PNG, JPG), Videos (MP4, MOV, WebM)
- Ensure stable internet connection

### Generation takes too long

- Motion transfer typically takes 2-5 minutes
- Check the Results tab for progress updates
- If stuck for > 10 minutes, refresh and try again

### API errors

- Verify your Kling API credentials are valid
- Check your Kling account has sufficient credits
- Ensure the API endpoint URL is correct

## Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Kling AI API** - Motion transfer processing
- **Sonner** - Toast notifications

## Credits

- Built with ❤️ for the Kling AI platform
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)

## Support

For API-related issues, contact Kling AI support.
For application issues, check the console for error messages.
