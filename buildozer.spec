[app]
title = Varna Banker
package.name = varna_banker
package.domain = org.varnabanker

source.dir = .
source.main = main.py

version = 1.0

# Python & Kivy requirements
requirements = python3,kivy,pillow

orientation = portrait
fullscreen = 0

# Android permissions (API 33 safe)
android.permissions = CAMERA, READ_MEDIA_IMAGES

# Uncomment after build success
# icon.filename = assets/icon.png


[buildozer]
log_level = 2
warn_on_root = 1

# Android configuration (VERY IMPORTANT)
android.api = 33
android.minapi = 21
android.ndk = 25.1.8937393
android.build_tools_version = 33.0.2


