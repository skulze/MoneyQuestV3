# Archived Packages

This directory contains packages that were deprecated in favor of more efficient solutions.

## mobile/
**Archived**: September 2024
**Reason**: Replaced with Progressive Web App (PWA) architecture

### Why PWA Over React Native?

The React Native mobile package was retired in favor of a PWA-only approach for several strategic reasons:

#### **Business Benefits**
- **Zero App Store Fees**: Save 30% commission on all subscriptions ($10k-30k annually)
- **Instant Deployment**: No app store approval delays or rejections
- **Reduced Development Cost**: Single codebase instead of maintaining web + mobile

#### **Technical Benefits**
- **Universal Compatibility**: Works on all platforms (iOS, Android, Desktop)
- **Local-First Perfect Match**: PWA offline capabilities align with our architecture
- **Simplified Maintenance**: One codebase, one build process, one deployment

#### **User Experience**
- **No Download Required**: Users can try instantly via web
- **Add to Home Screen**: Native app-like experience when users are ready
- **URL Sharing**: Viral growth potential through shareable links

#### **Final State**
- Mobile package had expo-sqlite module errors and wasn't running
- PWA provides equivalent mobile experience with better business model
- All mobile functionality now handled by responsive web app

**Decision**: Focus resources on perfecting the PWA experience rather than maintaining two separate codebases.