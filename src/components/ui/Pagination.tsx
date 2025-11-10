import React from 'react';
import { Box, IconButton, Typography, Select, MenuItem, FormControl } from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  FirstPage,
  LastPage,
} from '@mui/icons-material';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handleFirstPage = () => {
    onPageChange(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    onPageChange(totalPages);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 2,
        borderTop: '1px solid #E5E7EB',
        backgroundColor: '#FAFAFA',
      }}
    >
      {/* Items per page selector */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          Rows per page:
        </Typography>
        <FormControl size="small" sx={{ minWidth: 70 }}>
          <Select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            sx={{
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#E5E7EB',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00BCD4',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00BCD4',
              },
            }}
          >
            {itemsPerPageOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Page info and navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" sx={{ color: '#6B7280' }}>
          {startItem}-{endItem} of {totalItems}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* First page */}
          <IconButton
            onClick={handleFirstPage}
            disabled={currentPage === 1}
            size="small"
            sx={{
              color: currentPage === 1 ? '#D1D5DB' : '#6B7280',
              '&:hover': {
                backgroundColor: '#F3F4F6',
                color: '#00BCD4',
              },
              '&.Mui-disabled': {
                color: '#D1D5DB',
              },
            }}
          >
            <FirstPage fontSize="small" />
          </IconButton>

          {/* Previous page */}
          <IconButton
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            size="small"
            sx={{
              color: currentPage === 1 ? '#D1D5DB' : '#6B7280',
              '&:hover': {
                backgroundColor: '#F3F4F6',
                color: '#00BCD4',
              },
              '&.Mui-disabled': {
                color: '#D1D5DB',
              },
            }}
          >
            <ChevronLeft fontSize="small" />
          </IconButton>

          {/* Page number display */}
          <Typography
            variant="body2"
            sx={{
              minWidth: 80,
              textAlign: 'center',
              color: '#374151',
              fontWeight: 500,
            }}
          >
            Page {currentPage} of {totalPages || 1}
          </Typography>

          {/* Next page */}
          <IconButton
            onClick={handleNextPage}
            disabled={currentPage === totalPages || totalPages === 0}
            size="small"
            sx={{
              color: currentPage === totalPages || totalPages === 0 ? '#D1D5DB' : '#6B7280',
              '&:hover': {
                backgroundColor: '#F3F4F6',
                color: '#00BCD4',
              },
              '&.Mui-disabled': {
                color: '#D1D5DB',
              },
            }}
          >
            <ChevronRight fontSize="small" />
          </IconButton>

          {/* Last page */}
          <IconButton
            onClick={handleLastPage}
            disabled={currentPage === totalPages || totalPages === 0}
            size="small"
            sx={{
              color: currentPage === totalPages || totalPages === 0 ? '#D1D5DB' : '#6B7280',
              '&:hover': {
                backgroundColor: '#F3F4F6',
                color: '#00BCD4',
              },
              '&.Mui-disabled': {
                color: '#D1D5DB',
              },
            }}
          >
            <LastPage fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Pagination;

