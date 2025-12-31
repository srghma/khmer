{
  description = "Flutter Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      rust-overlay,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          inherit system overlays;
          config = {
            android_sdk.accept_license = true;
            allowUnfree = true;
          };
        };

        flutterPkg = pkgs.flutterPackages.v3_38;

        # androidComposition = pkgs.androidenv.composeAndroidPackages {
        #   platformVersions = [
        #     "31"
        #     "35"
        #     "36"
        #     "28"
        #   ];
        #   buildToolsVersions = [
        #     "31.0.0"
        #     "35.0.0"
        #     "36.0.0"
        #     "28.0.3"
        #   ];
        #   includeEmulator = true;
        #   includeSystemImages = true;
        #   systemImageTypes = [ "google_apis" ];
        #   abiVersions = [
        #     "x86_64"
        #     "armeabi-v7a"
        #     "arm64-v8a"
        #   ];
        #   includeNDK = true;
        #   ndkVersions = [
        #     "28.2.13676358"
        #     "27.1.12297006"
        #     "27.0.12077973"
        #   ];
        #   cmakeVersions = [ "3.22.1" ];
        # };
        # androidSdk = androidComposition.androidsdk;

        androidComposition = pkgs.androidenv.composeAndroidPackages {
          buildToolsVersions = [
            "35.0.0"
            "34.0.0"
            "28.0.3"
          ];
          platformVersions = [
            "36"
            "34"
            "28"
          ];
          abiVersions = [
            "armeabi-v7a"
            "arm64-v8a"
          ];

          # --- ADD THESE LINES ---
          includeNDK = true;
          # The version specifically requested by your Gradle error
          ndkVersions = [ "28.2.13676358" ];
          cmakeVersions = [ "3.22.1" ];
          # -----------------------
        };
        androidSdk = androidComposition.androidsdk;

        # Rust toolchain with Android targets
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          targets = [
            "wasm32-unknown-unknown"

            # Android targets
            "aarch64-linux-android"
            "armv7-linux-androideabi"
            "i686-linux-android"
            "x86_64-linux-android"
          ];
          extensions = [
            "rust-src"
            "rust-analyzer"
          ];
        };
      in
      {
        devShell =
          with pkgs;
          mkShell {
            ANDROID_HOME = "${androidSdk}/libexec/android-sdk";
            ANDROID_SDK_ROOT = "${androidSdk}/libexec/android-sdk";
            ANDROID_NDK_HOME = "${androidSdk}/libexec/android-sdk/ndk/28.2.13676358";

            CHROME_EXECUTABLE = "google-chrome-stable";

            buildInputs = [
              flutterPkg
              androidSdk
              jdk17
              mesa-demos # Fixes the 'eglinfo' warning for Linux Desktop dev

              # dioxus
              pkg-config
              openssl
              glib
              gtk3
              libsoup_3
              webkitgtk_4_1
              xdotool

              rustToolchain
            ];

            shellHook = ''
              # Make sure android tools & emulator are visible
              export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

              # Help openssl-sys
              export OPENSSL_DIR="${pkgs.openssl.dev}"
              export OPENSSL_LIB_DIR="${pkgs.openssl.out}/lib"
              export OPENSSL_INCLUDE_DIR="${pkgs.openssl.dev}/include"

              # For rust-analyzer
              export RUST_SRC_PATH="${rustToolchain}/lib/rustlib/src/rust/library"
            '';
          };
      }
    );
}
