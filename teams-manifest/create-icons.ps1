Add-Type -AssemblyName System.Drawing

$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$colorPath   = Join-Path $dir "color.png"
$outlinePath = Join-Path $dir "outline.png"
$zipPath     = Join-Path (Split-Path $dir -Parent) "teams-app.zip"

# color.png - 192x192
$bmp = New-Object System.Drawing.Bitmap(192, 192)
$g   = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.FillRectangle([System.Drawing.Brushes]::DodgerBlue, 0, 0, 192, 192)
$font = New-Object System.Drawing.Font("Arial", 80, [System.Drawing.FontStyle]::Bold)
$sf   = New-Object System.Drawing.StringFormat
$sf.Alignment     = [System.Drawing.StringAlignment]::Center
$sf.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect = New-Object System.Drawing.RectangleF(0, 0, 192, 192)
$g.DrawString("O", $font, [System.Drawing.Brushes]::White, $rect, $sf)
$bmp.Save($colorPath)
$g.Dispose()
$bmp.Dispose()
Write-Host "color.png 생성 완료"

# outline.png - 32x32
$bmp2 = New-Object System.Drawing.Bitmap(32, 32)
$g2   = [System.Drawing.Graphics]::FromImage($bmp2)
$g2.Clear([System.Drawing.Color]::Transparent)
$font2 = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)
$sf2   = New-Object System.Drawing.StringFormat
$sf2.Alignment     = [System.Drawing.StringAlignment]::Center
$sf2.LineAlignment = [System.Drawing.StringAlignment]::Center
$rect2 = New-Object System.Drawing.RectangleF(0, 0, 32, 32)
$g2.DrawString("O", $font2, [System.Drawing.Brushes]::White, $rect2, $sf2)
$bmp2.Save($outlinePath)
$g2.Dispose()
$bmp2.Dispose()
Write-Host "outline.png 생성 완료"

# teams-app.zip 패키징
Compress-Archive -Path $colorPath, $outlinePath, (Join-Path $dir "manifest.json") -DestinationPath $zipPath -Force
Write-Host "teams-app.zip 생성 완료: $zipPath"
