# Working with a development snapshot

## Requirements and installation

The development version of `ccp4i2-django` sits on top of a regular CCP4/CCP4i2 installation. It requires a number of commonly available python modules to be installed, and the versions of these modules required by ccp4i2-django _may_ be incompatible with a standard CCP4/CCP4i2 distribution, so that we recommend downloading and installing a bespoke instance of CCP4 from [here](https://www.ccp4.ac.uk/downloads) for use only by `ccp4i2-django`. This requirement will disappear as we head towards release.

`ccp4i2-django` is an electron app, built using github actions. Action runs, including the most recent, are available [here](https://github.com/paulsbond/ccp4i2-django/actions). Note that a run that shows up as failed (with a red cross) may have succesfully built products for one or more of windows, mac, or linux. Any successfully built products are available in the "Artifacts" section at the bottom of the page reached by clicking on one of the runs.

As of now `ccp4i2-django` builds and runs on linux mac and windows. For windows, you will need sufficient system privilege to install software.

## Special consideration for MacOS

After retrieving the built artifact ( a `.dmg` disk image file), from the github pages, a terminal command is needed before the disk gets mounted, in order to make it compatible with MacOS sandboxing procedures. If the artifact is called `/Users/user/Downloads/ccp4i2-django-0.0.1-arm64.dmg`, issue the following command in a terminal:

```
xattr -c /Users/user/Downloads/ccp4i2-django-0.0.1-arm64.dmg
```

## Launching ccp4i2-django

To launch the program, either double click the app icon (MacOS or linux), or launch it from the command line.

e.g. Macos

```
/Applications/ccp4i2-django.app/Contents/MacOS/ccp4i2-django
```

## Getting started

See [here](./getting-started.md) for guidance on getting going with ccp4i2-django
