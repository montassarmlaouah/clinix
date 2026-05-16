import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { LUNA_COLORS } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { fontSize, fontWeight } from '@/src/theme/typography';

interface TagInputProps {
  label?: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

export function TagInput({ label, tags, onChange, placeholder = 'Ajouter...', maxTags = 20 }: TagInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);

  const addTag = () => {
    const trimmed = input.trim();
    if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return;
    onChange([...tags, trimmed]);
    setInput('');
    inputRef.current?.focus();
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tagsScroll}
        contentContainerStyle={styles.tagsContent}
      >
        {tags.map((tag, i) => (
          <View key={i} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.tagRemove}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={addTag}
          placeholder={placeholder}
          placeholderTextColor={LUNA_COLORS.textDisabled}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[styles.addBtn, !input.trim() && styles.addBtnDisabled]}
          onPress={addTag}
          disabled={!input.trim()}
        >
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold as any,
    color: LUNA_COLORS.textPrimary,
    marginBottom: spacing.xs,
  },
  tagsScroll: {
    maxHeight: 44,
    marginBottom: spacing.xs,
  },
  tagsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    gap: spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LUNA_COLORS.infoLight,
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 4,
  },
  tagText: {
    fontSize: fontSize.xs,
    color: LUNA_COLORS.tertiary,
    fontWeight: fontWeight.medium as any,
  },
  tagRemove: {
    fontSize: 16,
    color: LUNA_COLORS.tertiary,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LUNA_COLORS.border,
    borderRadius: 10,
    backgroundColor: LUNA_COLORS.surface,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: LUNA_COLORS.textPrimary,
  },
  addBtn: {
    backgroundColor: LUNA_COLORS.secondary,
    width: 44,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    backgroundColor: LUNA_COLORS.textDisabled,
  },
  addBtnText: {
    fontSize: 22,
    color: LUNA_COLORS.surface,
    fontWeight: fontWeight.bold as any,
  },
});
