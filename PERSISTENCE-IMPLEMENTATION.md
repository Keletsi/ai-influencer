# State Persistence Implementation

## Overview

This document describes the implementation of state persistence for the Motion Studio Pro application. The feature ensures that uploaded media files and ongoing/queued video generations are preserved across browser refreshes and navigation.

## Problem Statement

Previously, when users:
- Refreshed their browser
- Navigated to other sections of the app
- Accidentally closed the tab

They would lose:
- Uploaded reference images and motion videos
- Processing status of ongoing generations
- Queued generations waiting to be processed

## Solution Architecture

The solution implements a two-layer persistence strategy:

### 1. **Local Storage Persistence** (for uploaded files)
- Stores file metadata (name, size, type, lastModified)
- Stores base64-encoded preview images (for images < 5MB)
- Stores blob URLs for video previews (session-only)

### 2. **Database Persistence** (for generations)
- All generation tasks are saved to Supabase database
- Incomplete generations (pending/processing) are restored on page load
- Polling continues automatically for resumed generations

## Implementation Details

### New Hook: `use-workspace-persistence.ts`

Located at: `src/hooks/use-workspace-persistence.ts`

**Key Features:**
- `loadWorkspaceState()` - Retrieves saved workspace data from localStorage
- `saveWorkspaceState()` - Saves workspace data to localStorage
- `persistFile()` - Converts File objects to persistable data and saves them
- `persistSettings()` - Saves generation settings
- `clearWorkspaceState()` - Clears all persisted data after successful generation

**Storage Structure:**
```typescript
interface WorkspaceState {
  referenceImage?: PersistedFileData;
  motionVideo?: PersistedFileData;
  settings?: GenerationSettings;
  videoDuration?: number;
}

interface PersistedFileData {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  preview?: string; // base64 or blob URL
}
```

### Updated Components

#### 1. **UploadCard.tsx**
- Added `initialFileData` prop to accept persisted file data
- Restores file previews on mount if `initialFileData` is provided
- Displays file metadata even when actual File object is not available

#### 2. **Workspace.tsx**
- Added `initialReferenceImage` and `initialMotionVideo` props
- Passes persisted file data to UploadCard components

#### 3. **Index.tsx** (Main Changes)
- Imports persistence hook and database functions
- Restores workspace state on mount
- Queries database for incomplete generations on mount
- Automatically resumes the most recent incomplete generation
- Persists files when selected via `persistFile()`
- Persists settings when changed via `persistSettings()`
- Clears workspace state after successful generation completion

### Updated Services

#### **generations.ts**
Added new function:
```typescript
getIncompleteGenerations(userId: string): Promise<Generation[]>
```
- Queries database for all generations with status 'pending' or 'processing'
- Used to restore ongoing generations after page refresh

## How It Works

### File Upload Flow
1. User uploads a file → `handleReferenceImageSelect` or `handleMotionVideoSelect`
2. File is set in component state
3. File metadata and preview are persisted to localStorage via `persistFile()`
4. On refresh → Workspace state is loaded → File preview is restored in UploadCard

### Generation Flow
1. User clicks Generate → Files uploaded to Supabase Storage
2. Generation record created in database with status 'pending'
3. Kling API task created and polling begins
4. Progress updates are saved to database in real-time
5. If user refreshes:
   - `getIncompleteGenerations()` finds the pending/processing generation
   - Polling resumes automatically using the stored `kling_task_id`
   - UI updates continue as normal

### Successful Completion
- When generation completes successfully
- `clearWorkspaceState()` is called to clean up localStorage
- User can start fresh with new files

### Error Handling
- If generation fails, error is saved to database
- Workspace state remains (user can retry with same files)
- Error message displayed to user

## Key Benefits

1. **Resilient to Browser Refresh**: Users won't lose work if they accidentally refresh
2. **Session Continuity**: Generations continue processing even after navigation
3. **Better UX**: Visual feedback preserved (file previews remain visible)
4. **No Re-upload Required**: Files already uploaded to Supabase are reused
5. **Automatic Recovery**: No user action needed to resume processing

## Storage Limits

- **Images**: Previews stored for files < 5MB (as base64)
- **Videos**: Thumbnail frames extracted and stored as base64 JPEG (max 640px width)
- **localStorage**: ~5-10MB typical browser limit (adequate for metadata and thumbnails)

## Video Persistence Details

Videos are handled differently than images to ensure they persist across browser refreshes:

1. **During Upload**: A thumbnail frame is extracted from the video (at 1 second or 10% duration)
2. **Thumbnail Storage**: The thumbnail is converted to base64 JPEG and stored in localStorage
3. **After Refresh**: The thumbnail is displayed as a static preview image
4. **User Experience**: Shows "Thumbnail Preview" badge to indicate it's not the full video
5. **Replace Option**: User can click "Replace" to upload the video again if needed

The actual video file has already been uploaded to Supabase Storage during generation, so the thumbnail is just for visual reference in the UI.

## Testing Checklist

- [x] Build succeeds without errors
- [ ] Upload image and video, refresh → previews remain visible
- [ ] Start generation, refresh mid-process → generation resumes automatically
- [ ] Navigate to History page and back → files still visible
- [ ] Complete generation → workspace clears
- [ ] Failed generation → workspace preserves files for retry

## Future Enhancements

1. **Multiple Incomplete Generations**: Currently only resumes most recent; could add UI to choose which to resume
2. **IndexedDB Storage**: For larger file previews beyond localStorage limits
3. **Service Worker**: For truly offline-capable persistence
4. **Explicit Save/Restore**: Let users manually save workspace "sessions"

## Files Modified

- ✅ `src/hooks/use-workspace-persistence.ts` (new)
- ✅ `src/components/studio/UploadCard.tsx`
- ✅ `src/components/studio/Workspace.tsx`
- ✅ `src/pages/Index.tsx`
- ✅ `src/services/generations.ts`

## Deployment Notes

- No database migrations required (existing schema supports this)
- No environment variable changes needed
- Backward compatible with existing data
- localStorage is automatically available in all modern browsers
