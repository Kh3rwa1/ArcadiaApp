module.exports = {
    preset: "jest-expo",
    testPathIgnorePatterns: [
        "/node_modules/",
        "/ArcadiaApp/",
        "/mobile/",
        "/server/",
    ],
    moduleNameMapper: {
        "^react-native-reanimated$": "<rootDir>/__mocks__/react-native-reanimated.js",
        "^react-native/Libraries/Animated/NativeAnimatedHelper$": "<rootDir>/__mocks__/NativeAnimatedHelper.js",
    },
    transformIgnorePatterns: [
        "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base))",
        "/node_modules/react-native-reanimated/plugin/",
    ]
};
