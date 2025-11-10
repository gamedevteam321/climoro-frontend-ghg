# Custom Alert Component Implementation

## 📋 Overview

Replaced Material-UI's Snackbar component with a beautiful, custom Alert system that displays notifications in the **bottom right corner** with smooth animations, matching the Climoro design system.

---

## ✨ Features

### Before (MUI Snackbar)
❌ Top-center position  
❌ Basic animations  
❌ Limited customization  
❌ No stacking support  

### After (Custom Alert)
✅ **Bottom right corner** positioning  
✅ **Smooth blur animations** with framer-motion  
✅ **Auto-dismiss** after 4 seconds  
✅ **Multiple alerts stack** beautifully  
✅ **Click to dismiss** early  
✅ **Hover effects** for better UX  
✅ **Color-coded by type** (Success, Error, Warning, Info)  

---

## 🎨 Design Specifications

### Alert Types & Colors

#### Success ✅
- **Background**: `#D1FAE5` (Light green)
- **Text**: `#065F46` (Dark green)
- **Border**: `#A7F3D0` (Green)
- **Use**: Entry saved, deleted, updated successfully

#### Error ❌
- **Background**: `#FEE2E2` (Light red)
- **Text**: `#991B1B` (Dark red)
- **Border**: `#FECACA` (Red)
- **Use**: Failed operations, validation errors

#### Warning ⚠️
- **Background**: `#FEF3C7` (Light yellow)
- **Text**: `#92400E` (Dark yellow/brown)
- **Border**: `#FDE68A` (Yellow)
- **Use**: Partial success, non-critical issues

#### Info ℹ️
- **Background**: `#DBEAFE` (Light blue)
- **Text**: `#1E40AF` (Dark blue)
- **Border**: `#BFDBFE` (Blue)
- **Use**: General information, tips

### Visual Example

```
                                          ┌────────────────────────────┐
                                          │ Success: Entry saved!      │ ← Green
                                          └────────────────────────────┘
                                          ┌────────────────────────────┐
                                          │ Error: Failed to delete    │ ← Red
                                          └────────────────────────────┘
                                          ┌────────────────────────────┐
                                          │ Warning: File upload       │ ← Yellow
                                          └────────────────────────────┘
                                          ↑
                                   Bottom Right Corner
```

### Alert Dimensions
- **Width**: 300px - 400px (responsive)
- **Padding**: 12px 16px
- **Border Radius**: 16px
- **Font Size**: 14px
- **Shadow**: Subtle (4px 6px rgba)
- **Gap**: 12px between stacked alerts

---

## 📁 Files Created

### 1. **Alert Component**
**File**: `src/components/ui/Alert.tsx`

```tsx
interface AlertProps {
  id?: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose?: (id: string) => void;
}
```

**Features**:
- Framer Motion animations (blur + slide in/out)
- Hover scale effect
- Click to dismiss
- Type-safe props
- Customizable duration

---

### 2. **AlertContainer** (Manager)
**File**: `src/components/ui/AlertContainer.tsx`

**Purpose**: Global alert manager that:
- Renders alerts in bottom right corner
- Manages multiple alerts (stacking)
- Auto-dismisses after duration
- Provides global `showAlert()` function

**API**:
```typescript
// Show an alert from anywhere
showAlert({
  type: 'success',
  message: 'Operation successful!',
  duration: 4000, // optional, defaults to 4000ms
});

// Remove specific alert
removeAlert(alertId);

// Clear all alerts
clearAllAlerts();
```

**Positions Supported**:
- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`
- `bottom-center`
- `top-center`

---

### 3. **Utility Functions**
**File**: `src/lib/utils.ts`

```typescript
// Utility for className merging (clsx + tailwind-merge)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 🔧 Implementation Details

### Added to App.tsx

```tsx
import AlertContainer from './components/ui/AlertContainer';

function App() {
  return (
    <ThemeProvider theme={theme}>
      {/* ... existing routes ... */}
      
      {/* Global Alert Container - Bottom Right Corner */}
      <AlertContainer position="bottom-right" />
    </ThemeProvider>
  );
}
```

---

### Updated Components

#### StationaryEmissions.tsx

**Removed**:
```tsx
// ❌ Old Snackbar state
const [snackbar, setSnackbar] = useState({...});

// ❌ Old Snackbar JSX
<Snackbar open={snackbar.open}>
  <Alert severity={snackbar.severity}>...</Alert>
</Snackbar>
```

**Added**:
```tsx
// ✅ Import showAlert
import { showAlert } from '../../components/ui/AlertContainer';

// ✅ Show success alert
showAlert({
  type: 'success',
  message: 'Entry saved successfully!',
});

// ✅ Show error alert
showAlert({
  type: 'error',
  message: error?.message || 'Failed to save entry',
});

// ✅ Show warning alert
showAlert({
  type: 'warning',
  message: 'Entry saved but invoice file upload failed',
});
```

#### MobileCombustion.tsx

Same changes as StationaryEmissions:
- Removed `snackbar` state
- Removed Snackbar/Alert imports
- Replaced all `setSnackbar` calls with `showAlert`
- Removed Snackbar JSX component

---

## 🚀 Usage Examples

### Basic Usage

```tsx
import { showAlert } from '../../components/ui/AlertContainer';

// Success message
showAlert({
  type: 'success',
  message: 'User created successfully!',
});

// Error message
showAlert({
  type: 'error',
  message: 'Failed to connect to server',
});

// Warning message
showAlert({
  type: 'warning',
  message: 'Session will expire in 5 minutes',
});

// Info message
showAlert({
  type: 'info',
  message: 'New updates available',
});
```

### Custom Duration

```tsx
// Show for 10 seconds
showAlert({
  type: 'success',
  message: 'Check your email for verification link',
  duration: 10000,
});

// Show indefinitely (until clicked)
showAlert({
  type: 'error',
  message: 'Critical error - please contact support',
  duration: 0, // Won't auto-dismiss
});
```

### Programmatic Control

```tsx
// Save alert ID
const alertId = showAlert({
  type: 'info',
  message: 'Processing...',
  duration: 0,
});

// Later, remove it
removeAlert(alertId);

// Or clear all alerts
clearAllAlerts();
```

### In Async Operations

```tsx
const handleSaveData = async () => {
  try {
    await saveData();
    showAlert({
      type: 'success',
      message: 'Data saved successfully!',
    });
  } catch (error) {
    showAlert({
      type: 'error',
      message: error.message || 'Failed to save data',
    });
  }
};
```

### Multiple Alerts

```tsx
// Show multiple alerts - they stack nicely!
showAlert({ type: 'info', message: 'Starting backup...' });

setTimeout(() => {
  showAlert({ type: 'warning', message: 'Backup is taking longer than expected' });
}, 2000);

setTimeout(() => {
  showAlert({ type: 'success', message: 'Backup completed!' });
}, 5000);
```

---

## 🎭 Animations

### Entry Animation
- **Blur**: 10px → 0px
- **Opacity**: 0 → 1
- **Y Position**: +10px → 0
- **X Position**: +50px → 0
- **Scale**: 0.95 → 1
- **Duration**: 300ms
- **Easing**: easeInOut

### Exit Animation
- **Opacity**: 1 → 0
- **X Position**: 0 → +100px
- **Scale**: 1 → 0.9
- **Duration**: 200ms
- **Easing**: easeOut

### Hover Effect
- **Scale**: 1 → 1.02
- **Duration**: 200ms
- **Easing**: easeInOut

---

## 📦 Dependencies

### Added
```json
{
  "framer-motion": "^12.23.24",  // Already installed
  "clsx": "^2.0.0",               // Newly installed
  "tailwind-merge": "^2.0.0"      // Newly installed
}
```

---

## 🧪 Testing

### Test Scenarios

1. **Single Alert**:
   - Trigger an action (save/delete)
   - ✅ Alert appears in bottom right
   - ✅ Smooth blur animation
   - ✅ Auto-dismisses after 4 seconds
   - ✅ Can click to dismiss early

2. **Multiple Alerts**:
   - Trigger multiple actions quickly
   - ✅ Alerts stack vertically
   - ✅ Each maintains 12px gap
   - ✅ Each dismisses independently
   - ✅ Stack adjusts smoothly

3. **All Alert Types**:
   - Success (save entry)
   - Error (validation failure)
   - Warning (file upload issue)
   - Info (general message)
   - ✅ Correct colors for each type
   - ✅ Bold type label

4. **Hover Interaction**:
   - Hover over alert
   - ✅ Scales up slightly (1.02x)
   - ✅ Smooth transition
   - ✅ Cursor shows it's clickable

5. **Position Changes**:
   - Change `position` prop in App.tsx
   - ✅ Works in all 6 positions
   - ✅ Animations adjust accordingly

---

## 🎯 Benefits Over Previous Snackbar

| Feature | MUI Snackbar | Custom Alert |
|---------|--------------|--------------|
| **Position** | Top-center | Bottom-right ✨ |
| **Animations** | Basic slide | Blur + slide + scale ✨ |
| **Multiple Alerts** | Queue only | Stack beautifully ✨ |
| **Customization** | Limited | Full control ✨ |
| **Design Match** | Generic | Climoro branded ✨ |
| **Hover Effects** | None | Scale interaction ✨ |
| **Click Dismiss** | Optional | Built-in ✨ |
| **Color Variants** | Basic | 4 distinct types ✨ |

---

## 🔄 Migration Guide

### For Existing Components

**Step 1**: Import showAlert
```tsx
import { showAlert } from '../../components/ui/AlertContainer';
```

**Step 2**: Remove snackbar state
```tsx
// ❌ Remove this
const [snackbar, setSnackbar] = useState({...});
```

**Step 3**: Replace setSnackbar calls
```tsx
// ❌ Before
setSnackbar({
  open: true,
  message: 'Success!',
  severity: 'success',
});

// ✅ After
showAlert({
  type: 'success',
  message: 'Success!',
});
```

**Step 4**: Remove Snackbar JSX
```tsx
// ❌ Remove this
<Snackbar open={snackbar.open}>
  <Alert severity={snackbar.severity}>...</Alert>
</Snackbar>
```

**Step 5**: Remove unused imports
```tsx
// ❌ Remove these
import { Snackbar, Alert } from '@mui/material';
```

**Done!** 🎉

---

## 📊 Code Statistics

### Files Modified
- ✅ `src/App.tsx` - Added AlertContainer
- ✅ `src/features/stationary/StationaryEmissions.tsx` - 8 replacements
- ✅ `src/features/mobile/MobileCombustion.tsx` - 9 replacements

### Files Created
- ✅ `src/components/ui/Alert.tsx` (123 lines)
- ✅ `src/components/ui/AlertContainer.tsx` (105 lines)
- ✅ `src/lib/utils.ts` (11 lines)

### Total Impact
- **Lines Added**: ~250
- **Lines Removed**: ~40
- **Net Change**: +210 lines
- **Build Status**: ✅ Successful
- **TypeScript Errors**: 0

---

## 🎨 Design Comparison

### Before (MUI Snackbar)
```
┌──────────────────────────────────────┐
│ ⓘ Entry saved successfully!         │ ← Top center
└──────────────────────────────────────┘
```

### After (Custom Alert)
```
                                        ┌────────────────────────────┐
                                        │ Success: Entry saved!      │
                                        └────────────────────────────┘
                                                ↑
                                         Bottom Right
                                     (With smooth animations!)
```

---

## 🚨 Troubleshooting

### Alert Not Showing
- ✅ Check AlertContainer is added to App.tsx
- ✅ Verify showAlert is imported correctly
- ✅ Check browser console for errors

### Alerts Don't Stack
- ✅ Ensure each alert has unique timestamp in ID
- ✅ Check AnimatePresence is working (framer-motion installed)

### Colors Look Wrong
- ✅ Verify type is one of: 'success', 'error', 'warning', 'info'
- ✅ Check browser DevTools for style overrides

### Animations Choppy
- ✅ Check if framer-motion is properly installed
- ✅ Verify GPU acceleration is enabled
- ✅ Test in different browser

---

## 🔮 Future Enhancements

Possible improvements for the Alert system:

1. **Icons**: Add type-specific icons (✓, ✗, ⚠, ℹ)
2. **Progress Bar**: Visual countdown for auto-dismiss
3. **Actions**: Add action buttons ("Undo", "View Details")
4. **Sound**: Optional sound effects
5. **Themes**: Dark mode support
6. **Pause on Hover**: Stop auto-dismiss when hovering
7. **Grouping**: Group similar alerts
8. **History**: View dismissed alerts
9. **Accessibility**: Enhanced screen reader support
10. **Custom Animations**: Different animation styles

---

## 📝 Summary

Successfully created a beautiful, custom Alert system that:
- ✅ Displays in **bottom right corner** as requested
- ✅ Uses **smooth blur + slide animations**
- ✅ Supports **4 color-coded types** (Success, Error, Warning, Info)
- ✅ **Auto-dismisses** after 4 seconds
- ✅ **Stacks multiple alerts** beautifully
- ✅ **Click to dismiss** early
- ✅ **Hover effects** for better UX
- ✅ **Global API** - use from anywhere
- ✅ Fully **TypeScript** typed
- ✅ **Zero build errors**

The alert system is now live and integrated into both **Stationary Emissions** and **Mobile Combustion** components!

---

**Status**: ✅ Complete and Working  
**Build**: ✅ TypeScript compilation successful  
**Date**: November 6, 2025

