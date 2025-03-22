# YouTube Video Loop Chrome Extension

A simple Chrome extension that allows you to loop a specific segment of a YouTube video.

## Features

- Set custom start and end times for looping
- Loop will automatically reset when the video reaches the end time
- Easy-to-use popup interface
- Works on YouTube video pages
- Disable looping with a single click

## Installation

### From Source

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click the "Load unpacked" button
5. Select the folder containing the extension files
6. The extension should now appear in your browser toolbar

## Usage

1. Navigate to any YouTube video
2. Click the extension icon in your browser toolbar
3. Enter a start time and end time in seconds
4. Click "Apply Loop"
5. The video will now loop between the specified times
6. To disable looping, click the "Disable Loop" button

## How It Works

The extension injects a content script into YouTube pages that:
1. Monitors the video's current playback time
2. When the video reaches the specified end time, it jumps back to the start time
3. This creates a seamless loop between the two points

## Notes

- The extension works on standard YouTube video pages (URLs containing "youtube.com/watch")
- Looping is automatically disabled when navigating to a different video
- Times must be specified in seconds (e.g., 65 for 1:05)
- The end time must be greater than the start time

## License

MIT 