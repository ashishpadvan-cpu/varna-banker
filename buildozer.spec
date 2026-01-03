[app]
title = Varna Banker
package.name = varna_banker
package.domain = org.varnabanker

source.dir = .
source.main = main.py

version = 1.0

requirements = python3,kivy,pillow

orientation = portrait
fullscreen = 0

android.permissions = CAMERA, READ_MEDIA_IMAGES

# icon.filename = assets/icon.png


[buildozer]
log_level = 2
warn_on_root = 1

android.api = 33
android.minapi = 21
android.ndk = 25.1.8937393
android.build_tools_version = 33.0.2

# 🚨 THIS LINE STOPS BUILDTOOLS 36.1
android.sdk_path = /home/runner/android-sdk
