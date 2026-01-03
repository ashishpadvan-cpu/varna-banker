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


[buildozer]
log_level = 2
warn_on_root = 1

android.api = 33
android.minapi = 21
android.ndk = 25.1.8937393

# 🚨 ABSOLUTELY REQUIRED
android.sdk_path = /home/runner/android-sdk
