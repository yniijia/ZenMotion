# ✨ ZenMotion v2.05.25

A minimalist Chrome extension that simulates mouse movements and keyboard activity to keep your screen active. Designed with a clean, modern zen-inspired interface.

## ✅ Features

- **🎨 Elegant Design**: Clean, minimalist interface with smooth breathing animations
- **⏱️ Customizable Intervals**: Set movement frequency from 5 to 120 seconds
- **🖱️ Smart Movement Simulation**: Combines mouse movements, clicks, and keyboard inputs
- **⚡ Low Resource Usage**: Optimized for minimal CPU and memory consumption
- **🍏 macOS Support**: Includes a helper script for enhanced macOS compatibility

## 📥 Installation

### 🌐 Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store soon.

### 🛠️ Manual Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the ZenMotion folder
5. The extension icon should appear in your browser toolbar

## 📁 Project Structure

```
ZenMotion/
├── src/
│   ├── js/
│   │   ├── background.js
│   │   └── popup.js
│   ├── css/
│   │   └── popup.css
│   ├── html/
│   │   ├── popup.html
│   │   └── icon-generator.html
│   ├── icons/
│   │   ├── icon16.png
│   │   ├── icon19.png
│   │   ├── icon32.png
│   │   ├── icon38.png
│   │   ├── icon48.png
│   │   ├── icon128.png
│   │   ├── icon.svg
│   │   └── icon_active.svg
│   └── utils/
│       ├── generate-icons.js
│       └── mac-helper.sh
├── manifest.json
├── package.json
├── build.sh
└── README.md
```

## 🚀 Usage

1. Click the ZenMotion icon in your browser toolbar to open the popup
2. Click the large toggle button to activate/deactivate the extension
3. Adjust the movement interval using the slider (default: 30 seconds)
4. The extension will run in the background, simulating activity at your set interval

## 🍏 macOS Users

### Why a Helper Script is Needed

macOS implements stricter power management and security restrictions compared to other operating systems. These restrictions can prevent browser extensions from effectively keeping your system awake for several reasons:

- **App Nap**: macOS may put Chrome into a low-power state if it determines the browser isn't actively being used
- **Sandboxing**: Chrome extensions run in a sandboxed environment with limited system access
- **Power Management**: macOS aggressively manages power regardless of browser activity
- **Security Restrictions**: System-level functions require elevated permissions that extensions cannot obtain

The mac-helper.sh script uses the native `caffeinate` command to directly interface with macOS power management, providing a more reliable solution.

### Using the Helper Script

#### Option 1: One-Click Launcher (Recommended)

1. Simply double-click the `activate-mac-helper.command` file in the ZenMotion folder
2. If prompted about security, go to System Preferences → Security & Privacy → General and click "Open Anyway"
3. The helper will run with all prevention methods enabled

#### Option 2: Terminal Command

1. Open Terminal
2. Navigate to the ZenMotion folder
3. Make the script executable: `chmod +x src/utils/mac-helper.sh`
4. Run the script: `./src/utils/mac-helper.sh -d`

Options:
- `-d`: Prevent display sleep
- `-s`: Prevent system sleep (most aggressive)
- `-a`: Use all prevention methods (recommended for stubborn Macs)
- `-t <minutes>`: Specify duration (e.g., `-t 120` for 2 hours)

## 👨‍💻 Development

### 🔧 Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Generate icons: `npm run generate-icons`

### 📦 Building for Chrome Web Store

To package the extension for the Chrome Web Store:

#### Option 1: Using the build script
```
./build.sh
```
This script will:
- Install dependencies
- Generate icons
- Create a ZIP file ready for the Chrome Web Store

#### Option 2: Manual build
1. Make sure all icons are generated: `npm run generate-icons`
2. Create a ZIP file with all required files:
   ```
   zip -r zenmotion.zip manifest.json src/
   ```
3. Upload the ZIP file to the Chrome Developer Dashboard

## ❓ Troubleshooting

If the extension isn't preventing sleep:

1. Ensure the extension is active (blue toggle button)
2. Try a shorter movement interval (10-15 seconds)
3. Use the "Force Movement Now" button to test functionality
4. For macOS, use the included helper script for better results
5. Check the debug information for any error messages

## 🔒 Privacy & Permissions

ZenMotion requires the following permissions:
- `scripting`: To simulate mouse and keyboard activity
- `storage`: To save your settings
- `alarms`: For reliable timing of movements
- `tabs`: To interact with browser tabs

The extension does not collect or transmit any personal data.

## 📄 License

MIT License

## 👏 Credits

Created by [yniijia](https://github.com/yniijia) 