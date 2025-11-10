import React, { useState, useRef } from 'react';
import {
  Box,
  Drawer,
  List,
  Typography,
  Divider,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  Logout,
  MoreVert,
  CameraAlt,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useFrappeAuth, useFrappeGetCall, useFrappeUpdateDoc } from 'frappe-react-sdk';
import { routesConfig, routesToNavItems } from '../config/routes.config';

const DRAWER_WIDTH = 256; // Updated to match Figma design

// Climoro Logo for sidebar - Updated to match Figma design
const ClimoroLogo = ({ collapsed }: { collapsed: boolean }) => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', // Center the logo
    px: 2, 
    py: 2,
    height: '83px', // Figma: Logo container height
  }}>
    <img
      src="/Climoro.png"
      alt="Climoro"
      style={{
        height: collapsed ? '40px' : '51px', // Figma: 51px height
        width: 'auto',
        maxWidth: '89px', // Figma: 89px width
        transition: 'height 0.3s ease'
      }}
    />
  </Box>
);

interface NavItem {
  label: string;
  icon: React.ReactElement;
  path?: string;
  children?: NavItem[];
}

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({
    'GHG Calculator': true,
    'Scope 1': true,
    'Scope 2': false,
    'Scope 3': false,
    'Upstream': false, // Collapse by default to reduce clutter
    'Downstream': false, // Collapse by default to reduce clutter
    'Upstream Transportation and Distribution': false,
    'Downstream Transportation and Distribution': false,
    'Investments': false,
    'Reduction Factor': false, // Collapse by default
  });
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useFrappeAuth();
  const { updateDoc } = useFrappeUpdateDoc();
  
  // Fetch user profile data from backend only when user is logged in
  const shouldFetchUserData = !!currentUser && currentUser !== 'Guest';
  const { data: userData, mutate: refetchUserData} = useFrappeGetCall<{
    message?: {
      user_image?: string;
      full_name?: string;
    }
  }>(
    shouldFetchUserData ? 'frappe.client.get' : '',
    shouldFetchUserData ? {
      doctype: 'User',
      name: currentUser,
    } : undefined,
    shouldFetchUserData ? `user-profile-${currentUser}` : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      isPaused: () => !shouldFetchUserData,
    }
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (label: string) => {
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleSidebarUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleSidebarUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleLogout = async () => {
    handleSidebarUserMenuClose();
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      // Even if logout fails, navigate to login
      navigate('/login', { replace: true });
    }
  };

  const handleChangeProfileImage = () => {
    handleSidebarUserMenuClose();
    fileInputRef.current?.click();
  };

  const handleRemoveProfileImage = async () => {
    handleSidebarUserMenuClose();
    try {
      // Remove image from User doctype
      await updateDoc('User', currentUser || '', {
        user_image: null,
      });
      
      // Clear local state
      setProfileImage(null);
      
      // Refetch user data
      await refetchUserData();
      
      setSnackbar({
        open: true,
        message: 'Profile image removed successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error removing profile image:', error);
      setSnackbar({
        open: true,
        message: 'Failed to remove image.',
        severity: 'error',
      });
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSnackbar({
        open: true,
        message: 'Please select an image file',
        severity: 'error',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({
        open: true,
        message: 'Image size should be less than 5MB',
        severity: 'error',
      });
      return;
    }

    try {
      setIsUploading(true);

      // Use relative URL for proxy
      const formData = new FormData();
      formData.append('file', file);
      formData.append('is_private', '0');
      formData.append('doctype', 'User');
      formData.append('docname', currentUser || '');
      formData.append('fieldname', 'user_image');

      const uploadResponse = await fetch(`/api/method/upload_file`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
        headers: {
          'Accept': 'application/json',
          'X-Frappe-CSRF-Token': document.cookie
            .split('; ')
            .find(row => row.startsWith('csrf_token='))
            ?.split('=')[1] || '',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      
      if (uploadData.message?.file_url) {
        const fileUrl = uploadData.message.file_url;
        
        // Update the User doctype with the new image URL
        await updateDoc('User', currentUser || '', {
          user_image: fileUrl,
        });

        // Set relative URL for proxy
        setProfileImage(fileUrl);
        
        // Refetch user data to ensure consistency
        await refetchUserData();
        
        setSnackbar({
          open: true,
          message: 'Profile image updated successfully!',
          severity: 'success',
        });
      }
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      setSnackbar({
        open: true,
        message: 'Failed to upload image. Please try again or refresh the page.',
        severity: 'error',
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Load profile image from backend user data
  React.useEffect(() => {
    // Frappe API wraps the response in a 'message' key
    const userInfo = (userData as any)?.message || userData;
    
    if (userInfo?.user_image) {
      // Use relative URL for proxy, unless it's already a full URL
      const imageUrl = userInfo.user_image.startsWith('http') 
        ? userInfo.user_image 
        : userInfo.user_image;
      setProfileImage(imageUrl);
    } else {
      setProfileImage(null);
    }
  }, [userData]);

  // Navigation structure - dynamically generated from routes config
  const navigationItems: NavItem[] = routesToNavItems(routesConfig);

  // SidebarItem - Simple item without children
  const SidebarItem = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
    const isActive = item.path === location.pathname;
    const showIcon = depth === 0; // Only show icons for top-level items (cleaner look)
    
    return (
      <ListItemButton
        onClick={() => item.path && handleNavigation(item.path)}
        sx={{
          mx: depth === 0 ? 2 : 0,
          ml: depth === 0 ? 2 : depth === 1 ? 4 : 6,
          mb: depth === 0 ? 0.5 : 0.25,
          px: 2,
          py: depth === 0 ? 1.25 : 1,
          borderRadius: '8px',
          backgroundColor: isActive ? 'rgba(0, 188, 212, 0.08)' : 'transparent',
          '&:hover': {
            backgroundColor: isActive ? 'rgba(0, 188, 212, 0.12)' : 'rgba(0, 0, 0, 0.04)',
          },
          transition: 'all 0.15s ease',
        }}
      >
        {showIcon && item.icon && (
          <ListItemIcon sx={{ 
            minWidth: 36, 
            color: isActive ? '#00BCD4' : '#5F6368',
          }}>
            {item.icon}
          </ListItemIcon>
        )}
        <ListItemText
          primary={item.label}
          primaryTypographyProps={{
            fontSize: depth === 0 ? '14px' : depth === 1 ? '13px' : '12px',
            fontWeight: isActive ? 600 : (depth === 0 ? 500 : 400),
            color: isActive ? '#00BCD4' : '#202124',
            noWrap: true,
          }}
        />
      </ListItemButton>
    );
  };

  // SidebarCollapse - Item with nested children
  const SidebarCollapse = ({ item, depth = 0 }: { item: NavItem; depth?: number }) => {
      const isOpen = openMenus[item.label];
      const isActive = item.path === location.pathname;
    const hasChildren = item.children && item.children.length > 0;
    const showIcon = depth === 0; // Only show icons for top-level items (cleaner look)

      return (
      <div>
          <ListItemButton
            onClick={() => {
            if (item.path) {
              handleNavigation(item.path);
            }
              if (hasChildren) {
                handleMenuClick(item.label);
              }
            }}
            sx={{
            mx: depth === 0 ? 2 : 0,
            ml: depth === 0 ? 2 : depth === 1 ? 4 : 6,
            mb: depth === 0 ? 0.5 : 0.25,
            px: 2,
            py: 1.25,
              borderRadius: '8px',
              backgroundColor: isActive ? 'rgba(0, 188, 212, 0.08)' : 'transparent',
              '&:hover': {
              backgroundColor: isActive ? 'rgba(0, 188, 212, 0.12)' : 'rgba(0, 0, 0, 0.04)',
              },
            transition: 'all 0.15s ease',
            }}
          >
          {showIcon && item.icon && (
            <ListItemIcon sx={{ 
              minWidth: 36, 
              color: isActive ? '#00BCD4' : '#5F6368',
            }}>
              {item.icon}
            </ListItemIcon>
          )}
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
              fontSize: depth === 0 ? '14px' : depth === 1 ? '13px' : '12px',
              fontWeight: isActive ? 600 : (depth === 0 ? 500 : 400),
                color: isActive ? '#00BCD4' : '#202124',
              noWrap: true,
              }}
            />
          {hasChildren && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuClick(item.label);
              }}
              sx={{ 
                padding: '4px',
                color: '#5F6368',
                transition: 'transform 0.2s ease',
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <ExpandMore />
            </IconButton>
          )}
          </ListItemButton>
          {hasChildren && (
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <Box
              sx={{
                py: 0.5,
              }}
            >
              {item.children!.map((child) => {
                const childHasChildren = child.children && child.children.length > 0;
                if (childHasChildren) {
                  return <SidebarCollapse key={child.label} item={child} depth={depth + 1} />;
                } else {
                  return <SidebarItem key={child.label} item={child} depth={depth + 1} />;
                }
              })}
            </Box>
            </Collapse>
          )}
        </div>
      );
  };

  // SidebarItemGroup - Groups items together
  const SidebarItemGroup = ({ items }: { items: NavItem[] }) => {
    return (
      <List sx={{ py: 0 }}>
        {items.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          if (hasChildren) {
            return <SidebarCollapse key={item.label} item={item} />;
          } else {
            return <SidebarItem key={item.label} item={item} />;
          }
        })}
      </List>
    );
  };

  const renderNavItems = (items: NavItem[]) => {
    return <SidebarItemGroup items={items} />;
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF' }}>
      <ClimoroLogo collapsed={false} />
      <Divider sx={{ borderColor: '#E0E0E0' }} />
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', pt: 1 }}>
        {renderNavItems(navigationItems)}
      </Box>
      <Divider sx={{ borderColor: '#E0E0E0' }} />
      {/* User Profile Section - Figma: 40px height container */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mx: 2, // Figma: 16px margin
          my: 1.5,
          px: 1.5,
          height: '40px', // Figma: 40px height
          borderRadius: '8px',
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'rgba(0, 188, 212, 0.04)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar 
              src={profileImage || undefined}
              sx={{ width: 32, height: 32, backgroundColor: '#00BCD4' }}
            >
              {!profileImage && currentUser?.charAt(0).toUpperCase()}
            </Avatar>
            {isUploading && (
              <CircularProgress
                size={32}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  color: '#00BCD4',
                }}
              />
            )}
          </Box>
          <Box sx={{ overflow: 'hidden', minWidth: 0 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 500, 
                fontSize: '13px',
                color: '#202124',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {currentUser}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleSidebarUserMenuOpen} size="small" sx={{ p: 0.5 }}>
          <MoreVert fontSize="small" sx={{ color: '#5F6368' }} />
        </IconButton>
      </Box>
      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchorEl}
        open={Boolean(userMenuAnchorEl)}
        onClose={handleSidebarUserMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MenuItem onClick={handleChangeProfileImage}>
          <ListItemIcon>
            <CameraAlt fontSize="small" />
          </ListItemIcon>
          Change Profile Image
        </MenuItem>
        {profileImage && (
          <MenuItem onClick={handleRemoveProfileImage}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Remove Profile Image
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Hidden file input for profile image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
      />

      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}>
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: DRAWER_WIDTH,
              backgroundColor: '#FFFFFF',
            },
          }}
        >
          {drawer}
        </Drawer>
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid #E0E0E0',
              boxShadow: 'none', // Figma: No shadow on sidebar
              backgroundColor: '#FFFFFF',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          backgroundColor: '#F5F7FA',
          minHeight: '100vh',
          position: 'relative',
        }}
      >
        {/* Mobile Menu Button */}
        <IconButton
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            display: { sm: 'none' },
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': { backgroundColor: '#f5f5f5' },
            zIndex: 1200,
          }}
        >
          <MenuIcon />
        </IconButton>
        <Outlet />
      </Box>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

