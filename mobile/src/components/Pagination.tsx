/**
 * Pagination component for long lists
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  itemsPerPage?: number;
  totalItems?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  loading = false,
  itemsPerPage,
  totalItems,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <View style={styles.container}>
      {totalItems !== undefined && itemsPerPage !== undefined && (
        <Text style={styles.infoText}>
          Showing {((currentPage - 1) * itemsPerPage) + 1}-
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </Text>
      )}

      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.button, currentPage === 1 && styles.buttonDisabled]}
          onPress={handlePrevious}
          disabled={currentPage === 1 || loading}
        >
          <Ionicons name="chevron-back" size={20} color={currentPage === 1 ? '#666' : '#fff'} />
        </TouchableOpacity>

        <View style={styles.pageNumbers}>
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return (
                <Text key={`ellipsis-${index}`} style={styles.ellipsis}>
                  ...
                </Text>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <TouchableOpacity
                key={pageNum}
                style={[styles.pageButton, isActive && styles.pageButtonActive]}
                onPress={() => !loading && onPageChange(pageNum)}
                disabled={loading}
              >
                {loading && isActive ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={[styles.pageButtonText, isActive && styles.pageButtonTextActive]}>
                    {pageNum}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.button, currentPage === totalPages && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={currentPage === totalPages || loading}
        >
          <Ionicons name="chevron-forward" size={20} color={currentPage === totalPages ? '#666' : '#fff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  infoText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  pageNumbers: {
    flexDirection: 'row',
    gap: 4,
  },
  pageButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  pageButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  pageButtonText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  pageButtonTextActive: {
    color: '#000',
  },
  ellipsis: {
    color: '#888',
    fontSize: 14,
    paddingHorizontal: 8,
    lineHeight: 40,
  },
});



