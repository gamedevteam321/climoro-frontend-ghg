# UI Components

Reusable UI components for the Frappe GHG Frontend application.

## ConfirmDialog

A custom confirmation dialog component that replaces the native browser `window.confirm()` popup with a beautiful, branded modal dialog.

### Features

- **Customizable Title and Message**: Set any title and message text
- **Flexible Button Text**: Customize the confirm and cancel button labels
- **Color Variants**: Support for different button colors (error, primary, secondary)
- **Elegant Design**: Rounded corners, proper spacing, and smooth animations
- **Reusable**: Can be used across multiple components
- **Accessible**: Built with Material-UI for accessibility support

### Usage

#### Basic Usage

```tsx
import { useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

function MyComponent() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    // Perform the delete action
    console.log('Deleting...');
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  return (
    <>
      <button onClick={handleDelete}>Delete Item</button>
      
      <ConfirmDialog
        open={confirmOpen}
        title="Are you sure?"
        message="This action cannot be undone. Please review carefully."
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </>
  );
}
```

#### Advanced Usage with Multiple Actions

```tsx
import { useState } from 'react';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

function DataTable() {
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    recordId: '',
  });

  const handleDeleteClick = (id: string) => {
    setConfirmDialog({
      open: true,
      recordId: id,
    });
  };

  const handleConfirmDelete = async () => {
    const idToDelete = confirmDialog.recordId;
    setConfirmDialog({ open: false, recordId: '' });
    
    // Perform async delete operation
    await deleteRecord(idToDelete);
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, recordId: '' });
  };

  return (
    <>
      {/* Your table rows with delete buttons */}
      <button onClick={() => handleDeleteClick('123')}>
        Delete Record 123
      </button>
      
      <ConfirmDialog
        open={confirmDialog.open}
        title="Delete Confirmation"
        message="Take a moment to review the details provided to ensure you understand the implications. This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="error"
      />
    </>
  );
}
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `open` | `boolean` | Yes | - | Controls whether the dialog is visible |
| `title` | `string` | No | `'Are you sure?'` | The main heading of the dialog |
| `message` | `string` | Yes | - | The descriptive message text |
| `onConfirm` | `() => void` | Yes | - | Callback function when user clicks confirm button |
| `onCancel` | `() => void` | Yes | - | Callback function when user clicks cancel or closes dialog |
| `confirmText` | `string` | No | `'Okay'` | Text label for the confirm button |
| `cancelText` | `string` | No | `'Cancel'` | Text label for the cancel button |
| `confirmColor` | `'error' \| 'primary' \| 'secondary'` | No | `'error'` | Color variant for the confirm button |

### Color Variants

#### Error (Default - Red)
Best for destructive actions like delete, remove, or cancel operations:
```tsx
<ConfirmDialog
  confirmColor="error"
  // Red button (#EF4444) with darker hover (#DC2626)
/>
```

#### Primary (Cyan - Climoro Brand)
For primary actions like save, confirm, or proceed:
```tsx
<ConfirmDialog
  confirmColor="primary"
  // Cyan button (#00BCD4) with darker hover (#008BA3)
/>
```

#### Secondary
For secondary actions:
```tsx
<ConfirmDialog
  confirmColor="secondary"
  // Uses theme secondary color
/>
```

### Styling

The component uses the following design specifications:

**Dialog Container:**
- Border radius: 16px
- Padding: 32px
- Max width: 480px
- Centered on screen with backdrop overlay

**Title:**
- Font size: 28px
- Font weight: 600 (Semi-bold)
- Color: Black (#000)
- Margin bottom: 16px

**Message:**
- Font size: 16px
- Color: Gray (#6B7280)
- Line height: 1.6
- Margin bottom: 32px

**Buttons:**
- Font size: 16px
- Font weight: 500 (Medium)
- Padding: 12px 32px
- Border radius: 8px
- Gap between buttons: 12px

**Cancel Button:**
- Outlined variant
- Border color: #D1D5DB
- Text color: #374151
- Hover: Lighter border (#9CA3AF) and background (#F9FAFB)

**Confirm Button (Error variant):**
- Contained variant
- Background: Red (#EF4444)
- Text: White (#FFFFFF)
- Hover: Darker red (#DC2626)
- No box shadow

### Implementation Example

See the implementation in:
- `src/features/stationary/StationaryEmissions.tsx` - Stationary emissions delete confirmation
- `src/features/mobile/MobileCombustion.tsx` - Mobile combustion delete confirmation (both fuel and transport methods)

### Replacing window.confirm()

**Before (Native Confirm):**
```tsx
const handleDelete = async (id: string) => {
  if (window.confirm('Are you sure you want to delete this entry?')) {
    await deleteRecord(id);
  }
};
```

**After (Custom ConfirmDialog):**
```tsx
const [confirmDialog, setConfirmDialog] = useState({
  open: false,
  recordId: '',
});

const handleDeleteClick = (id: string) => {
  setConfirmDialog({ open: true, recordId: id });
};

const handleConfirmDelete = async () => {
  const idToDelete = confirmDialog.recordId;
  setConfirmDialog({ open: false, recordId: '' });
  await deleteRecord(idToDelete);
};

const handleCancelDelete = () => {
  setConfirmDialog({ open: false, recordId: '' });
};

// In JSX:
<ConfirmDialog
  open={confirmDialog.open}
  title="Are you sure?"
  message="This action cannot be undone."
  onConfirm={handleConfirmDelete}
  onCancel={handleCancelDelete}
  confirmText="Delete"
  confirmColor="error"
/>
```

### Best Practices

1. **Use descriptive messages**: Explain what will happen if the user confirms
2. **Choose appropriate colors**: Use `error` for destructive actions, `primary` for positive actions
3. **Custom button text**: Use action-specific labels like "Delete", "Remove", "Save", etc.
4. **Store context**: When confirming multiple items, store the item ID/reference in state
5. **Close on confirm**: Always close the dialog in the confirm handler
6. **Provide escape routes**: Allow users to cancel easily

### Accessibility

- Uses Material-UI Dialog component with built-in accessibility features
- Keyboard navigation supported (Tab, Enter, Escape)
- Focus management handled automatically
- ARIA attributes included by Material-UI
- Screen reader friendly

---

## Future Components

Other reusable UI components can be added to this directory:
- Loading spinners
- Toast notifications
- Data cards
- Form inputs
- etc.

---

**Created**: November 6, 2025  
**Author**: Climoro Development Team

