[app]
title = Varna Banker
package.name = varna_banker
package.domain = org.varnabanker
source.dir = .
source.main = kviy.py
version = 1.0
requirements = kivy
orientation = portrait
fullscreen = 0
android.permissions = READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE, CAMERA
icon.filename = assets/icon.png

[buildozer]
log_level = 2
warn_on_root = 1
android.api = 33
android.minapi = 21
android.ndk = 25b
