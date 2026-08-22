import React, { useState, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Modal, useColorScheme, Pressable, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/Colors';

export type BusinessTypeOption = {
  id: number;
  name: string;
  icon?: string;
};

export type StoreItemSummary = {
  business_type_id?: number;
  business_type_name?: string;
};

interface StoreFilterHeaderProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  businessTypes: BusinessTypeOption[];
  stores?: StoreItemSummary[];
  selectedBusinessTypeId: number | null;
  onSelectBusinessType: (id: number | null) => void;
}

export function StoreFilterHeader({
  searchQuery,
  onSearchChange,
  businessTypes,
  stores,
  selectedBusinessTypeId,
  onSelectBusinessType,
}: StoreFilterHeaderProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const borderColor = isDark ? '#2C2C2E' : '#E5E5EA';
  const activeColor = Colors[isDark ? 'dark' : 'light'].primary;
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  // 1. Show ONLY business categories present in the current stores list on screen
  const availableBusinessTypes = useMemo(() => {
    if (!stores || stores.length === 0) return businessTypes;

    const presentIds = new Set(
      stores.map(s => (s.business_type_id != null ? Number(s.business_type_id) : null)).filter(Boolean)
    );
    const presentNames = new Set(
      stores.map(s => s.business_type_name?.toLowerCase().trim()).filter(Boolean)
    );

    const filtered = businessTypes.filter(bt => {
      if (presentIds.has(Number(bt.id))) return true;
      if (presentNames.has(bt.name.toLowerCase().trim())) return true;
      return false;
    });

    return filtered.length > 0 ? filtered : businessTypes;
  }, [businessTypes, stores]);

  // 2. Put selected category at the top / front of the list
  const orderedBusinessTypes = useMemo(() => {
    const list = [...availableBusinessTypes];
    if (selectedBusinessTypeId !== null) {
      const selectedIndex = list.findIndex(b => Number(b.id) === Number(selectedBusinessTypeId));
      if (selectedIndex > 0) {
        const [selectedItem] = list.splice(selectedIndex, 1);
        list.unshift(selectedItem);
      }
    }
    return list;
  }, [availableBusinessTypes, selectedBusinessTypeId]);

  // Top bar shows only what screen can comfortably display without scrolling
  const topBarTypes = useMemo(() => {
    return orderedBusinessTypes.slice(0, 3);
  }, [orderedBusinessTypes]);

  const hasMoreCategories = orderedBusinessTypes.length > 3;

  // 3. Search filter inside the Modal sheet
  const filteredModalTypes = useMemo(() => {
    if (!modalSearchQuery.trim()) return orderedBusinessTypes;
    const q = modalSearchQuery.toLowerCase().trim();
    return orderedBusinessTypes.filter(bt => bt.name.toLowerCase().includes(q));
  }, [orderedBusinessTypes, modalSearchQuery]);

  const activeCount = (selectedBusinessTypeId !== null ? 1 : 0) + (searchQuery.trim().length > 0 ? 1 : 0);
  const selectedType = businessTypes.find(b => Number(b.id) === Number(selectedBusinessTypeId));

  const handleOpenModal = () => {
    setModalSearchQuery('');
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    Keyboard.dismiss();
    setModalSearchQuery('');
    setModalVisible(false);
  };

  return (
    <View style={[styles.headerContainer, { borderBottomColor: borderColor }]}>
      {/* Compact Search Bar & Filter Button Row */}
      <View style={styles.topRow}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderColor }]}>
          <Ionicons name="search" size={15} color={isDark ? '#8E8E93' : '#6C6C70'} />
          <TextInput
            placeholder="Search stores or location..."
            placeholderTextColor={isDark ? '#8E8E93' : '#6C6C70'}
            style={[styles.searchInput, { color: isDark ? '#FFF' : '#000' }]}
            value={searchQuery}
            onChangeText={onSearchChange}
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => onSearchChange('')} style={{ padding: 2 }}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#8E8E93' : '#6C6C70'} />
            </TouchableOpacity>
          )}
        </View>

        {/* Expandable Filter Modal Trigger */}
        <TouchableOpacity
          style={[
            styles.filterTriggerBtn,
            { backgroundColor: activeCount > 0 ? activeColor : (isDark ? '#1C1C1E' : '#F2F2F7'), borderColor: activeCount > 0 ? activeColor : borderColor }
          ]}
          onPress={handleOpenModal}
        >
          <Ionicons 
            name="options-outline" 
            size={16} 
            color={activeCount > 0 ? (isDark ? '#000' : '#FFF') : (isDark ? '#AAA' : '#555')} 
          />
          {activeCount > 0 && (
            <View style={[styles.triggerBadge, { backgroundColor: isDark ? '#FFF' : '#000' }]}>
              <ThemedText style={[styles.triggerBadgeText, { color: isDark ? '#000' : '#FFF' }]}>
                {activeCount}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Compact Top Bar Pills - Fits Screen Without Scroll */}
      <View style={styles.pillsRow}>
        <TouchableOpacity
          style={[
            styles.compactPill,
            selectedBusinessTypeId === null 
              ? { backgroundColor: activeColor, borderColor: activeColor } 
              : { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderColor }
          ]}
          onPress={() => onSelectBusinessType(null)}
        >
          <ThemedText 
            style={[
              styles.compactPillText, 
              selectedBusinessTypeId === null ? { color: isDark ? '#000' : '#FFF', fontWeight: '700' } : { color: isDark ? '#BBB' : '#444' }
            ]}
          >
            All
          </ThemedText>
        </TouchableOpacity>

        {topBarTypes.map((bt) => {
          const isSelected = Number(selectedBusinessTypeId) === Number(bt.id);
          return (
            <TouchableOpacity
              key={bt.id}
              style={[
                styles.compactPill,
                isSelected 
                  ? { backgroundColor: activeColor, borderColor: activeColor } 
                  : { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderColor }
              ]}
              onPress={() => onSelectBusinessType(isSelected ? null : bt.id)}
            >
              <ThemedText 
                style={[
                  styles.compactPillText, 
                  isSelected ? { color: isDark ? '#000' : '#FFF', fontWeight: '700' } : { color: isDark ? '#BBB' : '#444' }
                ]}
                numberOfLines={1}
              >
                {bt.name}
              </ThemedText>
            </TouchableOpacity>
          );
        })}

        {hasMoreCategories && (
          <TouchableOpacity
            style={[styles.compactPill, { backgroundColor: isDark ? '#2C2C2E' : '#E5E5EA', borderColor }]}
            onPress={handleOpenModal}
          >
            <ThemedText style={[styles.compactPillText, { color: isDark ? '#AAA' : '#666', fontWeight: '700' }]}>
              +{orderedBusinessTypes.length - 3} More
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>

      {/* Comprehensive Filter Bottom Modal Sheet */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
            <Pressable 
              onPress={(e) => e.stopPropagation()} 
              style={[
                styles.modalSheet, 
                { 
                  backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                  paddingBottom: Math.max(insets.bottom + 20, 28)
                }
              ]}
            >
              {/* Modal Drag Indicator */}
              <View style={styles.sheetHandleContainer}>
                <View style={[styles.sheetHandle, { backgroundColor: isDark ? '#444' : '#DDD' }]} />
              </View>

              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <ThemedText style={styles.modalTitle}>Filter Stores</ThemedText>
                <TouchableOpacity onPress={handleCloseModal} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color={isDark ? '#FFF' : '#000'} />
                </TouchableOpacity>
              </View>

              {/* Category Search Input Inside Modal */}
              <View style={[styles.modalSearchBar, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7', borderColor }]}>
                <Ionicons name="search" size={15} color={isDark ? '#8E8E93' : '#6C6C70'} />
                <TextInput
                  placeholder="Search categories..."
                  placeholderTextColor={isDark ? '#8E8E93' : '#6C6C70'}
                  style={[styles.modalSearchInput, { color: isDark ? '#FFF' : '#000' }]}
                  value={modalSearchQuery}
                  onChangeText={setModalSearchQuery}
                  returnKeyType="search"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />
                {modalSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setModalSearchQuery('')} style={{ padding: 2 }}>
                    <Ionicons name="close-circle" size={16} color={isDark ? '#8E8E93' : '#6C6C70'} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filter Section Title */}
              <ThemedText style={styles.sectionTitle}>Categories ({filteredModalTypes.length})</ThemedText>

              {/* Grid of Business Category Filters */}
              <ScrollView 
                style={styles.modalScrollView} 
                contentContainerStyle={styles.categoryGrid}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {!modalSearchQuery && (
                  <TouchableOpacity
                    style={[
                      styles.gridItem,
                      selectedBusinessTypeId === null 
                        ? { backgroundColor: activeColor + '20', borderColor: activeColor } 
                        : { backgroundColor: isDark ? '#2C2C2E' : '#F9F9FB', borderColor }
                    ]}
                    onPress={() => {
                      onSelectBusinessType(null);
                    }}
                  >
                    <ThemedText 
                      style={[
                        styles.gridItemText,
                        selectedBusinessTypeId === null ? { color: activeColor, fontWeight: '700' } : null
                      ]}
                    >
                      All Businesses
                    </ThemedText>
                    {selectedBusinessTypeId === null && (
                      <Ionicons name="checkmark" size={16} color={activeColor} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                )}

                {filteredModalTypes.map((bt) => {
                  const isSelected = Number(selectedBusinessTypeId) === Number(bt.id);
                  return (
                    <TouchableOpacity
                      key={bt.id}
                      style={[
                        styles.gridItem,
                        isSelected 
                          ? { backgroundColor: activeColor + '20', borderColor: activeColor } 
                          : { backgroundColor: isDark ? '#2C2C2E' : '#F9F9FB', borderColor }
                      ]}
                      onPress={() => {
                        onSelectBusinessType(isSelected ? null : bt.id);
                      }}
                    >
                      <ThemedText 
                        style={[
                          styles.gridItemText,
                          isSelected ? { color: activeColor, fontWeight: '700' } : null
                        ]}
                        numberOfLines={1}
                      >
                        {bt.name}
                      </ThemedText>
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color={activeColor} style={{ marginLeft: 'auto' }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Modal Actions */}
              <View style={[styles.modalActions, { borderTopColor: borderColor }]}>
                {selectedBusinessTypeId !== null && (
                  <TouchableOpacity 
                    style={[styles.resetBtn, { borderColor }]} 
                    onPress={() => onSelectBusinessType(null)}
                  >
                    <ThemedText style={styles.resetBtnText}>Clear Filter</ThemedText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={[styles.applyBtn, { backgroundColor: activeColor }]} 
                  onPress={handleCloseModal}
                >
                  <ThemedText style={[styles.applyBtnText, { color: isDark ? '#000' : '#FFF' }]}>
                    Done {selectedType ? `(${selectedType.name})` : ''}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 35,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    height: '100%',
  },
  filterTriggerBtn: {
    width: 35,
    height: 35,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  triggerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 15,
    height: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  triggerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'nowrap',
    overflow: 'hidden',
  },
  compactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    flexShrink: 1,
  },
  compactPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
    marginVertical: 6,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    opacity: 0.6,
    marginTop: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  modalScrollView: {
    maxHeight: 280,
  },
  categoryGrid: {
    gap: 8,
    paddingBottom: 10,
  },
  gridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  gridItemText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 8,
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
});
