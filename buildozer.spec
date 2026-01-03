name: Build Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-24.04  # Using a standard Ubuntu runner

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      # 1. Setup Python
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      # 2. Install System Dependencies required by Kivy/Buildozer
      - name: Install Dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y \
            build-essential \
            git \
            ffmpeg \
            libsdl2-dev \
            libsdl2-image-dev \
            libsdl2-mixer-dev \
            libsdl2-ttf-dev \
            libportmidi-dev \
            libswscale-dev \
            libavformat-dev \
            libavcodec-dev \
            zlib1g-dev \
            libffi-dev \
            libssl-dev \
            autoconf \
            libtool \
            openjdk-17-jdk \
            zip \
            unzip

      # 3. Install Buildozer and Cython
      - name: Install Buildozer
        run: |
          pip install --upgrade pip
          pip install buildozer cython

      # 4. Run Buildozer
      # We pipe "y" just in case, though accept_sdk_license in spec should handle it
      - name: Build with Buildozer
        run: |
          yes | buildozer android debug

      # 5. Upload the resulting APK
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: varna-banker-apk
          path: bin/*.apk
