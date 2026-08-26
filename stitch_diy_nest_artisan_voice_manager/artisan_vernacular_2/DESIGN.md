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
  outline-variant: '#dbc1bb'
  surface-tint: '#974630'
  primary: '#762d19'
  on-primary: '#ffffff'
  primary-container: '#94442e'
  on-primary-container: '#ffc8ba'
  inverse-primary: '#ffb5a1'
  secondary: '#4e6078'
  on-secondary: '#ffffff'
  secondary-container: '#cee1fe'
  on-secondary-container: '#52647c'
  tertiary: '#004871'
  on-tertiary: '#ffffff'
  tertiary-container: '#006195'
  on-tertiary-container: '#b2d9ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb5a1'
  on-primary-fixed: '#3b0800'
  on-primary-fixed-variant: '#79301b'
  secondary-fixed: '#d2e4ff'
  secondary-fixed-dim: '#b5c8e4'
  on-secondary-fixed: '#081c31'
  on-secondary-fixed-variant: '#36485f'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#94ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#fcf9f6'
  on-background: '#1b1c1a'
  surface-variant: '#e5e2df'
  terracotta-container: '#b35c44'
  indigo-container: '#cee1fe'
  voice-blue: '#167bb8'
  surface-cream: '#f0edea'
  error-red: '#ba1a1a'
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
  gutter: 16px
  margin-mobile: 20px
  margin-desktop: 64px
  touch-target: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is defined by a **Modern Tactile** aesthetic, intentionally distancing itself from the clinical coldness of traditional SaaS. It targets a demographic that values craftsmanship, human connection, and heritage. The emotional response should be one of safety, groundedness, and approachable sophistication.

The style leverages **Minimalism** through generous whitespace and a limited, earth-inspired palette, but softens it with **Tactile** elements. High-quality typography and organic shapes prevent the interface from feeling "technical," instead mimicking the warmth of a physical workshop or a curated gallery. The focus is on clarity and respect for the user's pace and digital literacy.

## Colors

The palette is rooted in natural pigments. 

- **Primary (Terracotta):** Represents the earth and handiwork. Used for main calls to action and critical brand moments.
- **Secondary (Indigo):** Provides a professional, deep contrast for structural elements and secondary navigation.
- **Tertiary (Voice/AI Blue):** A functional "beacon" color used exclusively for assisted features and AI-driven help.
- **Neutral (Warm Cream):** Replaces pure white as the background base to reduce eye strain and provide a more organic, paper-like feel.

Interactive states should utilize the `container` variants for subtle backgrounds behind high-contrast text.

## Typography

**Be Vietnam Pro** is used across all levels to ensure a unified, contemporary, and friendly voice. The scale is intentionally generous to maximize accessibility.

- **Headlines:** Use Bold weights to create a strong visual anchor.
- **Body:** The minimum size is 16px to ensure readability across all device types.
- **Voice Assist:** A specialized style for assisted interactions, slightly larger than standard body text to signify its unique role.
- **Contrast:** High-contrast text is essential; use Primary or Secondary colors for headlines to reinforce hierarchy, and Soft Black (`#1b1c1a`) for long-form content.

## Layout & Spacing

This design system utilizes a **Fluid Grid** model centered on an 8px rhythmic scale.

- **Mobile:** Single-column layout with 20px side margins to ensure focus and prevent "edge-bleed."
- **Tablet/Desktop:** Content reflows into a 12-column grid with 16px gutters. Margins expand to 64px on large screens to maintain a centered, editorial feel.
- **Touch Targets:** All interactive elements must adhere to a minimum 48x48px area, regardless of their visual size, to accommodate diverse motor skills.
- **White Space:** Prioritize vertical "stacking" distances (stack-lg) to separate distinct content blocks, ensuring the UI never feels cramped.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Ambient Shadows** that feel soft and physical.

- **Tiers:** The background uses the Neutral base. Cards and modal containers sit on the highest tier, utilizing the "Surface-Bright" (`#ffffff`) color to pop against the cream background.
- **Shadows:** Shadows are highly diffused and "warm." Use a 20px blur with a 4px Y-offset at 8% opacity. To enhance the craft aesthetic, tint shadows with a hint of the Primary Terracotta rather than using pure neutral gray.
- **Voice Help:** Elements using the Tertiary blue should feature a subtle 4px colored glow (outer shadow) to distinguish them as active, helpful tools.

## Shapes

The shape language is organic and inviting. 

- **Standard:** The base radius is 16px (`rounded-lg`) for buttons and standard cards.
- **Containers:** Larger elements like bottom sheets or featured containers use 24px (`rounded-xl`).
- **Icons:** Must feature rounded terminals and a 2px stroke weight to harmonize with the soft curves of the typography and components.

## Components

### Buttons
- **Primary:** High-profile 56px height. Filled Terracotta with White text. 16px corners.
- **Voice:** Circular FAB or pill-shaped button in Tertiary Blue, utilizing a soft pulse animation when active.

### Cards
- **Product/Task:** Surface-white background sitting on the cream base. Features a 16px radius and a soft warm shadow. Titles use the Secondary Indigo for professional clarity.

### Input Fields
- **Structure:** Labels are always positioned above the input. 1px border in a soft neutral, thickening to 2px in Secondary Indigo upon focus.
- **Voice-to-Text:** Every text input is paired with a Tertiary Blue icon to trigger voice assistance.

### Navigation
- **Bottom Bar:** Uses high-contrast icons (2px stroke) with clear text labels. The active state is indicated by a Primary Terracotta underline or filled icon variant.

### Chips & Tags
- Fully rounded (pill) shapes. Use `indigo-container` for categories and `terracotta-container` for active filters, ensuring text remains high-contrast.