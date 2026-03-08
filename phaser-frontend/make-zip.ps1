Add-Type -Assembly System.IO.Compression
Add-Type -Assembly System.IO.Compression.FileSystem

$zipPath = [System.IO.Path]::GetFullPath("flag-trivia-itch.zip")
$distPath = [System.IO.Path]::GetFullPath("dist")

if (Test-Path $zipPath) { Remove-Item $zipPath }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, "Create")

Get-ChildItem -Path $distPath -Recurse -File | ForEach-Object {
    $entryName = $_.FullName.Substring($distPath.Length + 1).Replace("\", "/")
    Write-Host $entryName
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $entryName, "Optimal") | Out-Null
}

$zip.Dispose()
Get-Item $zipPath | Select-Object Name, Length
