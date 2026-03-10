Set oWS = WScript.CreateObject("WScript.Shell")
sLinkFile = oWS.ExpandEnvironmentStrings("%USERPROFILE%\Desktop\Start SLC System.lnk")

Set oLink = oWS.CreateShortcut(sLinkFile)

' Get the absolute path to start.bat relative to where the vbs is run
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
strPath = fso.GetAbsolutePathName(".\start.bat")
strFolder = fso.GetParentFolderName(strPath)

oLink.TargetPath = strPath
oLink.WorkingDirectory = strFolder
oLink.Description = "Start Stars Law College Web Application"

oLink.Save

WScript.Echo "Desktop shortcut 'Start SLC System' has been created successfully!"
