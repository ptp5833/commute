Add-Type -AssemblyName System.Drawing

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# color.png — 192x192
$bmp = New-Object System.Drawing.Bitmap(192, 192)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.FillRectangle([System.Drawing.Brushes]::DodgerBlue, 0, 0, 192, 192)
$font = New-Object System.Drawing.Font("Arial", 80, [System.Drawing.FontStyle]::Bold)
$brush = [System.Drawing.Brushes]::White
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("근", $font, $brush, [System.Drawing.RectangleF]::new(0, 0, 192, 192), $sf)
$bmp.Save("$dir\color.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "color.png 생성 완료"

# outline.png — 32x32
$bmp2 = New-Object System.Drawing.Bitmap(32, 32)
$g2 = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.Clear([System.Drawing.Color]::Transparent)
$font2 = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)
$sf2 = New-Object System.Drawing.StringFormat
$sf2.Alignment = [System.Drawing.StringAlignment]::Center
$sf2.LineAlignment = [System.Drawing.StringAlignment]::Center
$g2.DrawString("근", $font2, [System.Drawing.Brushes]::White, [System.Drawing.RectangleF]::new(0, 0, 32, 32), $sf2)
$bmp2.Save("$dir\outline.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g2.Dispose(); $bmp2.Dispose()
Write-Host "outline.png 생성 완료"

# teams-app.zip 패키징
$zip = "$dir\..\teams-app.zip"
if (Test-Path $zip) { Remove-Item $zip }
Compress-Archive -Path "$dir\manifest.json", "$dir\color.png", "$dir\outline.png" -DestinationPath $zip
Write-Host "teams-app.zip 생성 완료: $zip"
