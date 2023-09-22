# GoToTestUniversal

GoToUniversal enables users to switch to test files based on glob patters via the context menu of the editor.

[Marketplace](https://marketplace.visualstudio.com/items?itemName=philippkorn.gototestuniversal)

## Features

* Specify multiple file extensions
* Use multiple configs to cover different project types
* Include any test from parent folders (e.g. for integration tests)

## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings

This extension contributes the following settings:

* `GoToTestUniversal.config`

Example: 
```
"GoToTestUniversal.config": [
    {
        "sourceFolder": "src/main/scala",
        "testFolder": "src/test/scala",
        "includeParentFolderLevel": 2,
        "fileExtensions": [
            "scala"
        ]
    }
]
```

## Known Issues


## Release Notes
### 0.0.2

fix git repo
### 0.0.1

alpha release, expect some bugs

