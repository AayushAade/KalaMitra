---
name: Artisan Vernacular
colors:
  surface: '#fcf9f6'
  surface-dim: '#dcdad7'
  surface-bright: '#fcf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f0'
  surface-container: '#f0edea'
  surface-container-high: '#eae8e5'
  surface-container-highest: '#e5e2df'
  on-surface: '#1b1c1a'
  on-surface-variant: '#55433e'
  inverse-surface: '#31302f'
  inverse-on-surface: '#f3f0ed'
  outline: '#88726d'
  outline-variant: '#dbc1ba'
  surface-tint: '#974730'
  primary: '#94442e'
  on-primary: '#ffffff'
  primary-container: '#b35c44'
  on-primary-container: '#fffcff'
  inverse-primary: '#ffb5a1'
  secondary: '#4e6078'
  on-secondary: '#ffffff'
  secondary-container: '#cee1fe'
  on-secondary-container: '#52647c'
  tertiary: '#006195'
  on-tertiary: '#ffffff'
  tertiary-container: '#167bb8'
  on-tertiary-container: '#fefdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a1'
  on-primary-fixed: '#3b0900'
  on-primary-fixed-variant: '#79301b'
  secondary-fixed: '#d2e4ff'
  secondary-fixed-dim: '#b5c8e4'
  on-secondary-fixed: '#081c32'
  on-secondary-fixed-variant: '#36485f'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#94ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#fcf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e5e2df'
typography:
  display-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  title-md:
    fontFamily: Be Vietnam Pro
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  voice-assist:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  touch-target-min: 48px
  margin-mobile: 20px
  gutter: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style
The design system is built to empower marginalized Indian artisans, prioritizing warmth, trust, and human connection over corporate efficiency. The aesthetic is **Modern Tactile**, blending the heritage of Indian craftsmanship with contemporary mobile usability. 

The UI should feel like a physical workshop—grounded, textured, and inviting. It emphasizes extreme clarity for users who may have varying levels of digital literacy. The emotional response is one of safety and respect, ensuring that technology feels like a supportive tool rather than a barrier. High whitespace and organic alignment prevent the interface from feeling cluttered or overwhelming.

## Colors
The palette is rooted in the natural dyes and materials of Indian craft. 

- **Primary (Terracotta):** Used for main actions and brand identity. It represents the earth and the foundational nature of handiwork.
- **Secondary (Indigo):** Reserved for secondary navigation and structural elements, providing a deep, professional contrast.
- **Voice/AI (Sky Blue):** A distinct, calming blue specifically used for assisted features. This color acts as a "beacon" for help.
- **Background (Warm Cream):** A soft, non-white base that reduces eye strain and feels more natural than clinical white.
- **Text (Soft Black):** High contrast for accessibility but softened slightly to avoid the harshness of pure black.

## Typography
**Be Vietnam Pro** is selected for its exceptional legibility and modern, friendly character. It supports various scripts and maintains a high x-height, which is crucial for readability on low-resolution mobile screens.

- **Scale:** Type sizes are intentionally larger than standard apps (minimum 16px for body) to accommodate users with diverse visual needs.
- **Weight:** Use SemiBold (600) or Bold (700) for interactive elements to ensure they are perceived as clickable.
- **Hierarchy:** Maintain clear distinction between headlines and body text through size and color (Primary for major titles, Soft Black for content).

## Layout & Spacing
The layout follows a **Fluid Grid** model with generous margins to prevent accidental taps.

- **Mobile First:** The primary interface is a single-column layout on mobile to keep focus on one task at a time.
- **Rhythm:** An 8px linear scale is used for all spacing. 
- **Accessibility:** Every interactive element (buttons, icons, inputs) must maintain a minimum touch area of 48x48px, even if the visual element is smaller.
- **Safe Zones:** Use 20px side margins to ensure content doesn't bleed into the edges of diverse device screens.

## Elevation & Depth
Depth in this design system is achieved through **Tonal Layers** and **Soft Ambient Shadows**. We avoid high-contrast shadows to keep the UI approachable.

- **Surface Levels:** The background is the lowest level (Warm Cream). Cards and containers sit on top (Surface White).
- **Shadows:** Use extremely diffused shadows (Blur: 20px, Y: 4px, Opacity: 8%) with a tiny hint of the Terracotta or Indigo color mixed into the shadow gray to maintain warmth.
- **Voice/AI Elevation:** Features using the Sky Blue accent should have a subtle "glow" (a colored outer shadow) to denote their special status as helpful, active components.

## Shapes
The shape language is organic and soft, avoiding sharp corners that can feel "aggressive" or "technical."

- **Base Radius:** 16px (`rounded-lg`) is the standard for cards and major buttons.
- **Large Radius:** 24px (`rounded-xl`) is used for primary action containers or bottom sheets to emphasize their importance.
- **Icons:** Use rounded icon sets (e.g., Lucide or Phosphor) with a 2px stroke weight to match the softness of the typography.

## Components

### Buttons
- **Primary:** Terracotta background, White text. 16px rounded corners. Large height (56px) for easy tapping.
- **Voice Assist:** Sky Blue background or border. Often accompanied by a pulsing animation to indicate the AI is listening.

### Cards
- **Product/Task Cards:** White background on the Warm Cream base. 16px radius, subtle shadow. Title in Indigo, price or status in Terracotta.

### Input Fields
- **Design:** Large labels placed above the field (not inside). 12px padding with a Soft Black 1px border. On focus, the border thickens and changes to Indigo.
- **Audio Input:** A prominent floating action button (FAB) in Sky Blue for voice-to-text commands.

### Chips & Tags
- Used for categories (e.g., "Pottery," "Weaving"). Pills (fully rounded) with a light Indigo background and dark Indigo text.

### Navigation
- **Bottom Bar:** High-contrast icons with clear text labels underneath. Active state is highlighted with a Terracotta indicator bar or icon color change.

### Progress Indicators
- Thick, 8px lines with rounded caps. Success steps use Nature Green; pending steps use a light version of the background cream.