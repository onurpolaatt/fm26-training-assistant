# Adds the "Assistant" tab to FMSuperScout (or removes it with -Uninstall).
# Normally started by Install.cmd / Uninstall.cmd. Run from an elevated PowerShell if you start it directly.
param([switch]$Uninstall)
$ErrorActionPreference = 'Stop'
$tr = (Get-UICulture).Name -like 'tr*'
function M($en, $tr_) { if ($tr) { $tr_ } else { $en } }
$log = Join-Path $PSScriptRoot 'install-log.txt'
function Say($m, $c = 'Gray') { Write-Host $m -ForegroundColor $c; Add-Content -Path $log -Value $m -Encoding UTF8 -ErrorAction SilentlyContinue }

try {
  Set-Content -Path $log -Value ("Install " + (Get-Date)) -Encoding UTF8 -ErrorAction SilentlyContinue
  $admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  Say "Admin: $admin"

  # Find the FMSuperScout install folder: uninstall registry entry first, then the usual places
  $id = '{6E3F0B7C-9D24-4A8B-B1E5-2C7F4D98A310}_is1'
  $dirs = New-Object System.Collections.Generic.List[string]
  foreach ($k in "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$id",
                 "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\$id",
                 "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\$id") {
    $p = Get-ItemProperty -Path $k -ErrorAction SilentlyContinue
    if ($p -and $p.InstallLocation) { $dirs.Add($p.InstallLocation) }
  }
  foreach ($d in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA 'Programs'))) {
    if ($d) { $dirs.Add((Join-Path $d 'FMSuperScout')) }
  }
  $app = $null
  foreach ($d in $dirs) {
    $cand = Join-Path $d 'app'
    Say "Check: $cand"
    if (Test-Path (Join-Path $cand 'index.html')) { $app = $cand; break }
  }
  if (-not $app) { throw (M 'FMSuperScout was not found. Install it first with FMSuperScout-Setup.exe.' 'FMSuperScout kurulumu bulunamadı. Önce FMSuperScout-Setup.exe ile kur.') }
  Say "Found: $app" 'Cyan'

  $needAdmin = $app.StartsWith($env:ProgramFiles) -or (${env:ProgramFiles(x86)} -and $app.StartsWith(${env:ProgramFiles(x86)}))
  if ($needAdmin -and -not $admin) { throw (M 'Administrator rights are needed to write to this folder. Double-click Install.cmd instead.' 'Bu klasöre yazmak için yönetici izni gerekiyor. Install.cmd dosyasını çift tıklayarak çalıştır.') }

  $index = Join-Path $app 'index.html'
  $html = [IO.File]::ReadAllText($index)
  $tag = '<script src="assistant.js"></script>'
  $utf8 = New-Object Text.UTF8Encoding $false

  if ($Uninstall) {
    $html = $html.Replace("`r`n$tag", '').Replace("`n$tag", '').Replace($tag, '')
    [IO.File]::WriteAllText($index, $html, $utf8)
    Remove-Item (Join-Path $app 'assistant.js') -ErrorAction SilentlyContinue
    Say (M 'Assistant removed.' 'Asistan kaldırıldı.') 'Green'
  } else {
    $src = Join-Path $PSScriptRoot 'assistant.js'
    if (-not (Test-Path $src)) { throw ((M 'assistant.js not found: ' 'assistant.js bulunamadı: ') + $src + (M '. Extract the whole zip into one folder.' ". Zip'in tamamını aynı klasöre çıkar.")) }
    try { Unblock-File -Path $src } catch { }
    Copy-Item $src $app -Force
    if (-not $html.Contains($tag)) {
      if (-not $html.Contains('<script src="app.js"></script>')) { throw (M 'index.html does not have the expected app.js line.' 'index.html beklenen yapıda değil (app.js satırı yok).') }
      $html = $html.Replace('<script src="app.js"></script>', "<script src=""app.js""></script>`n$tag")
      [IO.File]::WriteAllText($index, $html, $utf8)
    }
    Say (M 'Assistant installed.' 'Asistan kuruldu.') 'Green'
    Say (M 'Restart FMSuperScout if it is open; an "Assistant" tab appears in the top bar.' 'FMSuperScout açıksa kapatıp yeniden aç; üst menüde "Asistan" sekmesi görünecek.')
  }
} catch {
  Say ((M 'ERROR: ' 'HATA: ') + $_.Exception.Message) 'Red'
  Say (M 'Details are in install-log.txt.' 'Ayrıntı install-log.txt dosyasında.') 'Yellow'
  exit 1
}
