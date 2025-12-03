# Apple-like Animations Implementation

This document describes the comprehensive animation system implemented throughout the Honorable AI platform, inspired by Apple's design language.

## Overview

The animation system provides smooth, subtle animations throughout the entire application, creating a polished and professional user experience similar to Apple's software.

## Animation Library

### Location: `lib/animations.ts`

This file contains all animation presets and variants:

- **Transitions**: Smooth spring animations with Apple's easing curves
- **Fade Animations**: `fadeIn`, `fadeInUp`, `fadeInDown`
- **Scale Animations**: `scaleIn`, `scaleInCenter`
- **Slide Animations**: `slideInRight`, `slideInLeft`
- **Stagger Animations**: For lists and grids
- **Card Animations**: Hover and tap effects
- **Button Animations**: Hover and tap effects
- **Modal Animations**: Backdrop and content animations
- **Page Transitions**: Smooth page changes
- **Toast Animations**: Notification slide-in effects
- **Loading Animations**: Spinner and pulse effects

## Components Enhanced

### 1. Modal (`components/ui/Modal.tsx`)
- Smooth backdrop fade-in/out
- Scale and slide animation for modal content
- Uses `modalBackdrop` and `modalContent` variants

### 2. Toast Notifications (`components/ui/Toast.tsx`)
- Slide-in from right with scale effect
- Uses `toastSlideIn` variant

### 3. Loading Components (`components/ui/Loading.tsx`)
- Smooth spinner rotation using Framer Motion
- Fade-in overlay with pulse effect
- Animated loading messages

### 4. Debate Cards (`components/debate/DebateCard.tsx`)
- Hover scale and lift effect
- Tap feedback animation
- Uses `cardHover` and `cardTap` presets

### 5. Trending Topics (`components/debate/TrendingTopics.tsx`)
- Staggered fade-in for topic cards
- Hover and tap animations
- Smooth entrance animations

### 6. Arena Panel (`components/panels/ArenaPanel.tsx`)
- Stagger container for debate lists
- Individual item animations
- Uses `StaggerContainer` and `StaggerItem` components

## New Animation Components

### AnimatedButton (`components/ui/AnimatedButton.tsx`)
- Enhanced button with hover and tap animations
- Smooth scale transitions
- Loading spinner animation

### AnimatedCard (`components/ui/AnimatedCard.tsx`)
- Card wrapper with fade-in and hover effects
- Configurable hoverable state
- Delay support for staggered animations

### StaggerContainer (`components/ui/StaggerContainer.tsx`)
- Container for staggered list animations
- Automatically animates children with delay

### StaggerItem (`components/ui/StaggerItem.tsx`)
- Individual item wrapper for stagger animations
- Fade-in and slide-up effect

### PageTransition (`components/ui/PageTransition.tsx`)
- Page transition wrapper (ready for use)
- Smooth fade and slide transitions between pages

## Global Enhancements

### Smooth Scrolling (`app/globals.css`)
- Added `scroll-behavior: smooth` to HTML
- Respects `prefers-reduced-motion` for accessibility

## Animation Characteristics

### Apple-like Features:
1. **Spring Physics**: Natural, bouncy animations using spring physics
2. **Easing Curves**: Custom easing curves matching Apple's design language
3. **Subtle Effects**: Small, refined animations that don't distract
4. **Performance**: Optimized animations using Framer Motion
5. **Accessibility**: Respects user's motion preferences

### Timing:
- **Quick**: 0.25s for immediate feedback
- **Smooth**: 0.3-0.4s for standard transitions
- **Gentle**: Longer durations for important content

## Usage Examples

### Basic Card Animation
```tsx
import { AnimatedCard } from '@/components/ui/AnimatedCard'

<AnimatedCard hoverable delay={0.1}>
  {/* Card content */}
</AnimatedCard>
```

### Staggered List
```tsx
import { StaggerContainer, StaggerItem } from '@/components/ui'

<StaggerContainer className="grid grid-cols-2 gap-4">
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.content}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>
```

### Animated Button
```tsx
import { AnimatedButton } from '@/components/ui/AnimatedButton'

<AnimatedButton variant="primary" onClick={handleClick}>
  Click Me
</AnimatedButton>
```

## Performance Considerations

- All animations use Framer Motion's optimized rendering
- Animations respect `prefers-reduced-motion` for accessibility
- GPU-accelerated transforms for smooth performance
- Minimal re-renders through proper React patterns

## Future Enhancements

Potential additions:
- Page transition wrapper in root layout
- More micro-interactions on form inputs
- Scroll-triggered animations
- Gesture-based animations for mobile

## Testing

To test animations:
1. Navigate through different pages
2. Hover over cards and buttons
3. Open and close modals
4. Trigger toast notifications
5. View loading states
6. Scroll through lists with stagger animations

All animations should feel smooth, natural, and polished - similar to Apple's software experience.

