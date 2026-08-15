# VEM Mobile

## Build AAB for Play Store

To build a release Android App Bundle (.aab) for Google Play Store natively on your machine:

1. **Build the AAB**
   ```bash
   cd android && ./gradlew bundleRelease
   ```
   
   *The generated AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`*

## Build IPA for iOS (App Store & Ad-Hoc)

To build an `.ipa` file using Expo Application Services (EAS):

1. **Build Production IPA for App Store / TestFlight**:
   ```bash
   npx eas-cli build --platform ios --profile production
   ```

2. **Build Ad-Hoc / Internal IPA for Device Testing**:
   ```bash
   npx eas-cli build --platform ios --profile preview
   ```

*Note: EAS will manage your Apple credentials or prompt you to log into your Apple Developer account.*

